/**
 * api-assistant — Edge Function for AI Assistant (Sprint 1: read-only)
 *
 * Receives natural language messages, parses intent via rule-based parser,
 * proxies read-only queries to api-minimarket (or PostgREST), and returns
 * structured answers in natural language.
 *
 * Auth: expects user JWT and validates identity/role via Supabase Auth API.
 * No write operations in Sprint 1.
 */

import { ok, fail } from '../_shared/response.ts';
import {
  validateOrigin,
  parseAllowedOrigins,
  handleCors,
  createCorsErrorResponse,
} from '../_shared/cors.ts';
import { parseIntent, SUGGESTIONS } from './parser.ts';
import { extractTrustedRole } from './auth.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssistantRequest {
  message: string;
  context?: {
    ui_route?: string;
    timezone?: string;
  };
}

interface AssistantResponse {
  intent: string | null;
  confidence: number;
  mode: 'answer' | 'clarify';
  answer: string;
  data: unknown;
  request_id: string;
  suggestions?: string[];
}

// ---------------------------------------------------------------------------
// Auth helper — validates JWT via Supabase Auth API
// ---------------------------------------------------------------------------

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

async function validateUserJwt(
  supabaseUrl: string,
  authHeader: string | null,
  anonKey: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7);

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
    });

    if (!res.ok) {
      return { user: null, error: 'Invalid or expired token' };
    }

    const userData = await res.json();
    const role = extractTrustedRole(userData as Record<string, unknown>);

    return {
      user: {
        id: userData.id,
        email: userData.email,
        role,
        user_metadata: userData.user_metadata,
      },
      error: null,
    };
  } catch {
    return { user: null, error: 'Auth service unavailable' };
  }
}

// ---------------------------------------------------------------------------
// Intent handlers — each calls api-minimarket or PostgREST
// ---------------------------------------------------------------------------

type IntentHandler = (
  supabaseUrl: string,
  headers: Record<string, string>,
  params: Record<string, string>,
  requestId: string,
) => Promise<{ answer: string; data: unknown }>;

function buildGatewayHeaders(
  authHeader: string,
  anonKey: string,
  requestId: string,
): Record<string, string> {
  return {
    'Authorization': authHeader,
    'apikey': anonKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-request-id': requestId,
  };
}

async function fetchGateway(
  supabaseUrl: string,
  path: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const url = `${supabaseUrl}/functions/v1/api-minimarket${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `Gateway returned ${res.status}`);
    }
    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPostgREST(
  supabaseUrl: string,
  table: string,
  query: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const url = `${supabaseUrl}/rest/v1/${table}?${query}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      headers: { ...headers, 'Prefer': 'count=exact' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`PostgREST returned ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

const handleStockBajo: IntentHandler = async (supabaseUrl, headers) => {
  const data = await fetchGateway(supabaseUrl, '/stock/minimo', headers);
  const items = Array.isArray(data) ? data : [];
  const count = items.length;

  if (count === 0) {
    return { answer: 'No hay productos con stock bajo minimo. Todo esta en niveles normales.', data: items };
  }

  const top5 = items.slice(0, 5)
    .map((p: Record<string, unknown>) => `- ${p.nombre || p.producto_nombre}: ${p.cantidad_actual ?? '?'} (min: ${p.stock_minimo ?? '?'})`)
    .join('\n');

  return {
    answer: `Hay ${count} producto${count !== 1 ? 's' : ''} con stock bajo minimo.\n\nPrimeros ${Math.min(5, count)}:\n${top5}${count > 5 ? `\n\n...y ${count - 5} mas.` : ''}`,
    data: items,
  };
};

const handlePedidosPendientes: IntentHandler = async (supabaseUrl, headers) => {
  const data = await fetchGateway(supabaseUrl, '/pedidos?estado=pendiente&limit=20', headers);
  const pedidos = Array.isArray(data) ? data : [];
  const count = pedidos.length;

  if (count === 0) {
    return { answer: 'No hay pedidos pendientes en este momento.', data: pedidos };
  }

  const top5 = pedidos.slice(0, 5)
    .map((p: Record<string, unknown>) => `- #${p.numero_pedido} — ${p.cliente_nombre} ($${p.monto_total})`)
    .join('\n');

  return {
    answer: `Hay ${count} pedido${count !== 1 ? 's' : ''} pendiente${count !== 1 ? 's' : ''}.\n\nUltimos:\n${top5}${count > 5 ? `\n\n...y ${count - 5} mas.` : ''}`,
    data: pedidos,
  };
};

const handleResumenCC: IntentHandler = async (supabaseUrl, headers) => {
  const data = await fetchGateway(supabaseUrl, '/cuentas-corrientes/resumen', headers) as Record<string, unknown>;
  const dinero = Number(data?.dinero_en_la_calle ?? 0);
  const clientes = Number(data?.clientes_con_deuda ?? 0);

  return {
    answer: `Resumen de cuentas corrientes:\n- Dinero en la calle: $${dinero.toLocaleString('es-AR')}\n- Clientes con deuda: ${clientes}`,
    data,
  };
};

const handleVentasDia: IntentHandler = async (supabaseUrl, headers) => {
  const now = new Date();
  const fechaDesde = now.toISOString().split('T')[0] + 'T00:00:00';
  const fechaHasta = now.toISOString().split('T')[0] + 'T23:59:59';

  const data = await fetchGateway(
    supabaseUrl,
    `/ventas?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&limit=200`,
    headers,
  );
  const ventas = Array.isArray(data) ? data : [];
  const count = ventas.length;
  const totalMonto = ventas.reduce((sum: number, v: Record<string, unknown>) => sum + Number(v.monto_total ?? 0), 0);

  if (count === 0) {
    return { answer: 'No se registraron ventas hoy todavia.', data: ventas };
  }

  return {
    answer: `Ventas del dia:\n- ${count} venta${count !== 1 ? 's' : ''}\n- Total facturado: $${totalMonto.toLocaleString('es-AR')}`,
    data: { count, total: totalMonto, ventas: ventas.slice(0, 10) },
  };
};

const handleEstadoOCRFacturas: IntentHandler = async (supabaseUrl, headers) => {
  const query = 'select=id,estado,proveedor_id,numero,created_at&order=created_at.desc&limit=50';
  const data = await fetchPostgREST(supabaseUrl, 'facturas_ingesta', query, headers);
  const facturas = Array.isArray(data) ? data : [];

  const byEstado: Record<string, number> = {};
  for (const f of facturas) {
    const estado = (f as Record<string, unknown>).estado as string;
    byEstado[estado] = (byEstado[estado] || 0) + 1;
  }

  const total = facturas.length;
  if (total === 0) {
    return { answer: 'No hay facturas cargadas en el sistema.', data: { total: 0, por_estado: {} } };
  }

  const resumenEstados = Object.entries(byEstado)
    .map(([estado, count]) => `- ${estado}: ${count}`)
    .join('\n');

  return {
    answer: `Hay ${total} factura${total !== 1 ? 's' : ''} en el sistema:\n${resumenEstados}`,
    data: { total, por_estado: byEstado },
  };
};

const INTENT_HANDLERS: Record<string, IntentHandler> = {
  consultar_stock_bajo: handleStockBajo,
  consultar_pedidos_pendientes: handlePedidosPendientes,
  consultar_resumen_cc: handleResumenCC,
  consultar_ventas_dia: handleVentasDia,
  consultar_estado_ocr_facturas: handleEstadoOCRFacturas,
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

  // Request ID
  const incomingRequestId = req.headers.get('x-request-id') || '';
  const requestId = (incomingRequestId && /^[\w-]{1,128}$/.test(incomingRequestId))
    ? incomingRequestId
    : crypto.randomUUID();

  // CORS
  const corsResult = validateOrigin(req, allowedOrigins);
  const responseHeaders: Record<string, string> = {
    ...corsResult.headers,
    'x-request-id': requestId,
  };

  if (!corsResult.allowed) {
    return createCorsErrorResponse(requestId, corsResult.headers);
  }

  const preflightResponse = handleCors(req, responseHeaders);
  if (preflightResponse) return preflightResponse;

  // Route: only POST /message
  const url = new URL(req.url);
  const path = url.pathname.replace(/.*\/api-assistant/, '').replace(/\/$/, '') || '/';
  const method = req.method;

  // Health check
  if (path === '/health' && method === 'GET') {
    return ok({ status: 'ok', version: '1.0.0-sprint1' }, 200, responseHeaders, { requestId });
  }

  if (path !== '/message' || method !== 'POST') {
    return fail('NOT_FOUND', `Route ${method} ${path} not found`, 404, responseHeaders, { requestId });
  }

  // Auth
  const authHeader = req.headers.get('authorization');
  const { user, error: authError } = await validateUserJwt(supabaseUrl, authHeader, anonKey);

  if (!user || authError) {
    return fail('UNAUTHORIZED', authError || 'Unauthorized', 401, responseHeaders, { requestId });
  }

  // Role check — Sprint 1: admin only
  if (user.role !== 'admin') {
    return fail('FORBIDDEN', 'El asistente esta disponible solo para administradores', 403, responseHeaders, { requestId });
  }

  // Parse body
  let body: AssistantRequest;
  try {
    body = await req.json();
  } catch {
    return fail('BAD_REQUEST', 'Invalid JSON body', 400, responseHeaders, { requestId });
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length < 2) {
    return fail('BAD_REQUEST', 'El mensaje debe tener al menos 2 caracteres', 400, responseHeaders, { requestId });
  }

  // Limit message length
  const message = body.message.trim().slice(0, 500);

  // Parse intent
  const parsed = parseIntent(message);

  // No intent recognized
  if (!parsed.intent) {
    const response: AssistantResponse = {
      intent: null,
      confidence: 0,
      mode: 'clarify',
      answer: 'No entendi tu consulta. Puedo ayudarte con:\n- Stock bajo\n- Pedidos pendientes\n- Cuentas corrientes (fiado)\n- Ventas del dia\n- Estado de facturas OCR',
      data: null,
      request_id: requestId,
      suggestions: SUGGESTIONS,
    };
    return ok(response, 200, responseHeaders, { requestId });
  }

  // Execute intent handler
  const handler = INTENT_HANDLERS[parsed.intent];
  if (!handler) {
    return fail('INTERNAL_ERROR', 'Intent handler not found', 500, responseHeaders, { requestId });
  }

  const gatewayHeaders = buildGatewayHeaders(authHeader!, anonKey, requestId);

  try {
    const result = await handler(supabaseUrl, gatewayHeaders, parsed.params, requestId);

    const response: AssistantResponse = {
      intent: parsed.intent,
      confidence: parsed.confidence,
      mode: 'answer',
      answer: result.answer,
      data: result.data,
      request_id: requestId,
    };

    return ok(response, 200, responseHeaders, { requestId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error procesando consulta';
    return fail('QUERY_ERROR', `No se pudo consultar: ${msg}`, 502, responseHeaders, { requestId });
  }
});
