/**
 * api-assistant — Edge Function for AI Assistant (Sprint 1 + Sprint 2 + Sprint 3)
 *
 * Sprint 1: Receives natural language messages, parses intent via rule-based parser,
 * proxies read-only queries to api-minimarket (or PostgREST), and returns
 * structured answers in natural language.
 *
 * Sprint 2: Detects write intents (crear_tarea, registrar_pago_cc), returns a
 * confirmation plan (mode: "plan") with a single-use confirm_token. The user
 * must POST /confirm with the token to execute the action.
 *
 * Sprint 3: Adds actualizar_estado_pedido intent (plan → confirm) with state
 * transition validation mirroring the gateway's VALID_TRANSITIONS map.
 *
 * Auth: expects user JWT and validates identity/role via Supabase Auth API.
 */

import { ok, fail } from '../_shared/response.ts';
import {
  validateOrigin,
  parseAllowedOrigins,
  handleCors,
  createCorsErrorResponse,
} from '../_shared/cors.ts';
import {
  FixedWindowRateLimiter,
  buildRateLimitKey,
  withRateLimitHeaders,
} from '../_shared/rate-limit.ts';
import { parseIntent, SUGGESTIONS, findRelevantSuggestions, WRITE_INTENTS } from './parser.ts';
import { extractTrustedRole } from './auth.ts';
import { createConfirmToken, consumeConfirmToken, type ActionPlan } from './confirm-store.ts';

// ---------------------------------------------------------------------------
// Rate limiter — 30 requests per minute per user (in-memory, per-isolate)
// ---------------------------------------------------------------------------
const rateLimiter = new FixedWindowRateLimiter(30, 60_000);

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

interface ConfirmRequest {
  confirm_token: string;
}

interface NavigationHint {
  label: string;
  path: string;
}

interface AssistantResponse {
  intent: string | null;
  confidence: number;
  mode: 'answer' | 'clarify' | 'plan';
  answer: string;
  data: unknown;
  request_id: string;
  suggestions?: string[];
  navigation?: NavigationHint[];
  confirm_token?: string;
  action_plan?: {
    intent: string;
    label: string;
    payload: Record<string, unknown>;
    summary: string;
    risk: string;
  };
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
  context?: { timezone?: string },
) => Promise<{ answer: string; data: unknown; navigation?: NavigationHint[] }>;

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
    return { answer: 'No hay productos con stock bajo. Todo esta en niveles normales.', data: items };
  }

  const top5 = items.slice(0, 5)
    .map((p: Record<string, unknown>) => `- ${p.nombre || p.producto_nombre}: ${p.cantidad_actual ?? '?'} (min: ${p.stock_minimo ?? '?'})`)
    .join('\n');

  return {
    answer: `Hay ${count} producto${count !== 1 ? 's' : ''} con stock bajo.\n\nPrimeros ${Math.min(5, count)}:\n${top5}${count > 5 ? `\n\n...y ${count - 5} mas.` : ''}`,
    data: items,
    navigation: [{ label: 'Ver Stock', path: '/stock' }],
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
    navigation: [{ label: 'Ver Pedidos', path: '/pedidos' }],
  };
};

const handleResumenCC: IntentHandler = async (supabaseUrl, headers) => {
  const data = await fetchGateway(supabaseUrl, '/cuentas-corrientes/resumen', headers) as Record<string, unknown>;
  const dinero = Number(data?.dinero_en_la_calle ?? 0);
  const clientes = Number(data?.clientes_con_deuda ?? 0);

  return {
    answer: `Resumen de cuentas corrientes:\n- Dinero en la calle: $${dinero.toLocaleString('es-AR')}\n- Clientes con deuda: ${clientes}`,
    data,
    navigation: [{ label: 'Ver Clientes', path: '/clientes' }],
  };
};

const handleVentasDia: IntentHandler = async (supabaseUrl, headers, _params, _requestId, context) => {
  // Use client timezone to compute "today" (server runs in UTC)
  const tz = context?.timezone || 'America/Argentina/Buenos_Aires';
  let today: string;
  try {
    today = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    today = new Date().toISOString().split('T')[0];
  }
  const fechaDesde = today + 'T00:00:00';
  const fechaHasta = today + 'T23:59:59';

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
    navigation: [{ label: 'Ver Ventas', path: '/ventas' }],
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
    navigation: [{ label: 'Ver Facturas', path: '/facturas' }],
  };
};

const handleSaludo: IntentHandler = async () => ({
  answer: 'Hola! Soy el asistente operativo del minimarket. Puedo ayudarte con consultas rapidas sobre el negocio.\n\nPreguntame sobre stock bajo, pedidos pendientes, cuentas corrientes, ventas del dia o facturas.',
  data: null,
});

const handleAyuda: IntentHandler = async () => ({
  answer: 'Puedo ayudarte con estas consultas:\n\n- "Que productos tienen stock bajo?" — ver productos a reponer\n- "Hay pedidos pendientes?" — estado de pedidos\n- "Cuanto me deben?" — resumen de cuentas corrientes\n- "Como fueron las ventas hoy?" — ventas del dia\n- "Estado de las facturas?" — facturas cargadas\n\nTambien puedo ejecutar acciones:\n- "Crear tarea comprar harina" — crear una tarea pendiente\n- "Registrar pago de 5000 de Juan Perez" — registrar un pago de cliente\n- "Cambiar pedido #123 a preparando" — actualizar estado de un pedido\n- "Aplicar factura 001-00012345" — aplicar factura validada al deposito\n\nEscribi tu consulta como la dirias normalmente.',
  data: null,
});

const INTENT_HANDLERS: Record<string, IntentHandler> = {
  consultar_stock_bajo: handleStockBajo,
  consultar_pedidos_pendientes: handlePedidosPendientes,
  consultar_resumen_cc: handleResumenCC,
  consultar_ventas_dia: handleVentasDia,
  consultar_estado_ocr_facturas: handleEstadoOCRFacturas,
  saludo: handleSaludo,
  ayuda: handleAyuda,
};

// ---------------------------------------------------------------------------
// Sprint 2 — Plan builders for write intents
// ---------------------------------------------------------------------------

const INTENT_LABELS: Record<string, string> = {
  crear_tarea: 'Crear tarea',
  registrar_pago_cc: 'Registrar pago',
  actualizar_estado_pedido: 'Actualizar estado de pedido',
  aplicar_factura: 'Aplicar factura al deposito',
};

interface PlanResult {
  plan: ActionPlan;
  answer: string;
  needsDisambiguation?: { field: string; message: string };
}

async function buildCrearTareaPlan(
  params: Record<string, string>,
): Promise<PlanResult> {
  const titulo = params.titulo;
  if (!titulo || titulo.length < 3) {
    return {
      plan: { intent: 'crear_tarea', label: 'Crear tarea', payload: {}, summary: '', risk: 'bajo' },
      answer: '',
      needsDisambiguation: {
        field: 'titulo',
        message: 'No pude detectar el titulo de la tarea. Escribi algo como: "Crear tarea comprar harina"',
      },
    };
  }

  const prioridad = params.prioridad || 'normal';
  const payload = { titulo, prioridad };

  return {
    plan: {
      intent: 'crear_tarea',
      label: 'Crear tarea',
      payload,
      summary: `Crear tarea "${titulo}" con prioridad ${prioridad}`,
      risk: 'bajo',
    },
    answer: `Voy a crear esta tarea:\n\n- Titulo: ${titulo}\n- Prioridad: ${prioridad}\n\n¿Confirmas?`,
  };
}

async function buildRegistrarPagoCCPlan(
  params: Record<string, string>,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<PlanResult> {
  const monto = params.monto;
  const clienteNombre = params.cliente_nombre;

  if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
    return {
      plan: { intent: 'registrar_pago_cc', label: 'Registrar pago', payload: {}, summary: '', risk: 'medio' },
      answer: '',
      needsDisambiguation: {
        field: 'monto',
        message: 'No pude detectar el monto del pago. Escribi algo como: "Registrar pago de 5000 de Juan Perez"',
      },
    };
  }

  if (!clienteNombre || clienteNombre.length < 2) {
    return {
      plan: { intent: 'registrar_pago_cc', label: 'Registrar pago', payload: {}, summary: '', risk: 'medio' },
      answer: '',
      needsDisambiguation: {
        field: 'cliente_nombre',
        message: `Detecte un pago de $${Number(monto).toLocaleString('es-AR')}, pero no el nombre del cliente. Escribi algo como: "Registrar pago de ${monto} de Juan Perez"`,
      },
    };
  }

  // Search for client by name via gateway
  let clientes: Array<Record<string, unknown>> = [];
  try {
    const data = await fetchGateway(supabaseUrl, `/clientes?q=${encodeURIComponent(clienteNombre)}&limit=5`, headers);
    clientes = Array.isArray(data) ? data : [];
  } catch {
    // If gateway fails, still allow plan but mark for review
  }

  if (clientes.length === 0) {
    return {
      plan: { intent: 'registrar_pago_cc', label: 'Registrar pago', payload: {}, summary: '', risk: 'medio' },
      answer: '',
      needsDisambiguation: {
        field: 'cliente_nombre',
        message: `No encontre un cliente con el nombre "${clienteNombre}". Verifica el nombre o usa uno mas especifico.`,
      },
    };
  }

  if (clientes.length > 1) {
    // Check for exact matches. If there is more than one exact candidate,
    // force disambiguation to avoid applying payment to the wrong client.
    const exactMatches = clientes.filter(
      (c) => String(c.nombre || '').toLowerCase() === clienteNombre.toLowerCase(),
    );
    if (exactMatches.length !== 1) {
      const names = clientes.map((c) => `- ${c.nombre}`).join('\n');
      return {
        plan: { intent: 'registrar_pago_cc', label: 'Registrar pago', payload: {}, summary: '', risk: 'medio' },
        answer: '',
        needsDisambiguation: {
          field: 'cliente_nombre',
          message: `Encontre varios clientes similares:\n${names}\n\nEscribi el nombre completo del cliente o agrega un dato extra (telefono/email).`,
        },
      };
    }
    clientes = [exactMatches[0]];
  }

  const cliente = clientes[0];
  const clienteId = String(cliente.id);
  const clienteNombreFinal = String(cliente.nombre);
  const saldoActual = Number(cliente.saldo_cc ?? 0);

  const payload = {
    cliente_id: clienteId,
    cliente_nombre: clienteNombreFinal,
    monto: Number(monto),
    descripcion: `Pago registrado via Asistente IA`,
  };

  return {
    plan: {
      intent: 'registrar_pago_cc',
      label: 'Registrar pago',
      payload,
      summary: `Registrar pago de $${Number(monto).toLocaleString('es-AR')} para ${clienteNombreFinal} (saldo actual: $${saldoActual.toLocaleString('es-AR')})`,
      risk: 'medio',
    },
    answer: `Voy a registrar este pago:\n\n- Cliente: ${clienteNombreFinal}\n- Monto: $${Number(monto).toLocaleString('es-AR')}\n- Saldo actual: $${saldoActual.toLocaleString('es-AR')}\n\n¿Confirmas?`,
  };
}

// Sprint 3 — Plan builder: actualizar estado pedido
const PEDIDO_VALID_TRANSITIONS: Record<string, string[]> = {
  pendiente: ['preparando', 'cancelado'],
  preparando: ['listo', 'cancelado'],
  listo: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

async function buildActualizarEstadoPedidoPlan(
  params: Record<string, string>,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<PlanResult> {
  const numeroPedido = params.numero_pedido;
  const nuevoEstado = params.nuevo_estado;

  if (!numeroPedido) {
    return {
      plan: { intent: 'actualizar_estado_pedido', label: 'Actualizar estado de pedido', payload: {}, summary: '', risk: 'medio' },
      answer: '',
      needsDisambiguation: {
        field: 'numero_pedido',
        message: 'No pude detectar el numero del pedido. Escribi algo como: "Cambiar pedido #123 a preparando"',
      },
    };
  }

  if (!nuevoEstado || !['preparando', 'listo', 'entregado', 'cancelado'].includes(nuevoEstado)) {
    return {
      plan: { intent: 'actualizar_estado_pedido', label: 'Actualizar estado de pedido', payload: {}, summary: '', risk: 'medio' },
      answer: '',
      needsDisambiguation: {
        field: 'nuevo_estado',
        message: `No pude detectar el nuevo estado. Estados validos: preparando, listo, entregado, cancelado.\n\nEjemplo: "Cambiar pedido #${numeroPedido} a preparando"`,
      },
    };
  }

  // Fetch current pedido via PostgREST
  let pedidos: Array<Record<string, unknown>> = [];
  try {
    const query = `select=id,numero_pedido,estado,monto_total&numero_pedido=eq.${encodeURIComponent(numeroPedido)}&limit=1`;
    const data = await fetchPostgREST(supabaseUrl, 'pedidos', query, headers);
    pedidos = Array.isArray(data) ? data : [];
  } catch {
    // PostgREST lookup failed
  }

  if (pedidos.length === 0) {
    return {
      plan: { intent: 'actualizar_estado_pedido', label: 'Actualizar estado de pedido', payload: {}, summary: '', risk: 'medio' },
      answer: '',
      needsDisambiguation: {
        field: 'numero_pedido',
        message: `No encontre un pedido con el numero #${numeroPedido}. Verifica el numero e intenta de nuevo.`,
      },
    };
  }

  const pedido = pedidos[0];
  const pedidoId = String(pedido.id);
  const estadoActual = String(pedido.estado || 'desconocido');
  const montoTotal = Number(pedido.monto_total ?? 0);

  // Validate transition
  const allowed = PEDIDO_VALID_TRANSITIONS[estadoActual] || [];
  if (!allowed.includes(nuevoEstado)) {
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'ninguna (estado terminal)';
    return {
      plan: { intent: 'actualizar_estado_pedido', label: 'Actualizar estado de pedido', payload: {}, summary: '', risk: 'medio' },
      answer: '',
      needsDisambiguation: {
        field: 'nuevo_estado',
        message: `No se puede cambiar el pedido #${numeroPedido} de "${estadoActual}" a "${nuevoEstado}". Transiciones permitidas: ${allowedStr}.`,
      },
    };
  }

  const risk = nuevoEstado === 'cancelado' ? 'alto' : 'medio';
  const payload = {
    pedido_id: pedidoId,
    numero_pedido: numeroPedido,
    nuevo_estado: nuevoEstado,
    estado_actual: estadoActual,
  };

  return {
    plan: {
      intent: 'actualizar_estado_pedido',
      label: 'Actualizar estado de pedido',
      payload,
      summary: `Cambiar pedido #${numeroPedido} de "${estadoActual}" a "${nuevoEstado}"`,
      risk,
    },
    answer: `Voy a actualizar el estado del pedido:\n\n- Pedido: #${numeroPedido}\n- Monto: $${montoTotal.toLocaleString('es-AR')}\n- Estado actual: ${estadoActual}\n- Nuevo estado: ${nuevoEstado}\n\n¿Confirmas?`,
  };
}

// Sprint 3 — Plan builder: aplicar factura
async function buildAplicarFacturaPlan(
  params: Record<string, string>,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<PlanResult> {
  const facturaNumero = params.factura_numero;

  // Fetch facturas in estado=validada via PostgREST
  let facturas: Array<Record<string, unknown>> = [];
  try {
    let query = 'select=id,numero,total,fecha_factura,estado,proveedores(nombre)&estado=eq.validada&order=created_at.desc&limit=10';
    if (facturaNumero) {
      query += `&numero=eq.${encodeURIComponent(facturaNumero)}`;
    }
    const data = await fetchPostgREST(supabaseUrl, 'facturas_ingesta', query, headers);
    facturas = Array.isArray(data) ? data : [];
  } catch {
    // PostgREST lookup failed
  }

  if (facturas.length === 0) {
    const detail = facturaNumero
      ? `No encontre una factura validada con numero "${facturaNumero}".`
      : 'No hay facturas en estado "validada" listas para aplicar.';
    return {
      plan: { intent: 'aplicar_factura', label: 'Aplicar factura', payload: {}, summary: '', risk: 'alto' },
      answer: '',
      needsDisambiguation: {
        field: 'factura_numero',
        message: `${detail} Solo se pueden aplicar facturas que ya pasaron la validacion de items.`,
      },
    };
  }

  if (facturas.length > 1) {
    const list = facturas.slice(0, 5)
      .map((f) => {
        const prov = (f.proveedores as Record<string, unknown>)?.nombre || 'N/A';
        return `- #${f.numero || 'S/N'} — ${prov} ($${Number(f.total ?? 0).toFixed(2)})`;
      })
      .join('\n');
    return {
      plan: { intent: 'aplicar_factura', label: 'Aplicar factura', payload: {}, summary: '', risk: 'alto' },
      answer: '',
      needsDisambiguation: {
        field: 'factura_numero',
        message: `Hay ${facturas.length} facturas validadas. Indica cual aplicar:\n${list}\n\nEjemplo: "Aplicar factura 001-00012345"`,
      },
    };
  }

  const factura = facturas[0];
  const facturaId = String(factura.id);
  const numero = String(factura.numero || 'S/N');
  const total = Number(factura.total ?? 0);
  const provNombre = String((factura.proveedores as Record<string, unknown>)?.nombre || 'N/A');
  const fechaFactura = String(factura.fecha_factura || 'N/A');

  const payload = {
    factura_id: facturaId,
    numero,
    proveedor: provNombre,
    total,
  };

  return {
    plan: {
      intent: 'aplicar_factura',
      label: 'Aplicar factura al deposito',
      payload,
      summary: `Aplicar factura #${numero} de ${provNombre} ($${total.toFixed(2)}) al deposito`,
      risk: 'alto',
    },
    answer: `Voy a aplicar esta factura al deposito (ingresara los items al stock):\n\n- Factura: #${numero}\n- Proveedor: ${provNombre}\n- Total: $${total.toLocaleString('es-AR')}\n- Fecha: ${fechaFactura}\n\nEsta accion es irreversible. ¿Confirmas?`,
  };
}

// ---------------------------------------------------------------------------
// Sprint 2 — Action executors (called after confirm)
// ---------------------------------------------------------------------------

async function executeCrearTarea(
  plan: ActionPlan,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<{ answer: string; data: unknown }> {
  const url = `${supabaseUrl}/functions/v1/api-minimarket/tareas`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        titulo: plan.payload.titulo,
        prioridad: plan.payload.prioridad || 'normal',
      }),
      signal: controller.signal,
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `Gateway returned ${res.status}`);
    }

    const tarea = json.data;
    return {
      answer: `Tarea creada exitosamente:\n- Titulo: ${tarea?.titulo || plan.payload.titulo}\n- ID: ${tarea?.id || 'N/A'}`,
      data: tarea,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function executeRegistrarPagoCC(
  plan: ActionPlan,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<{ answer: string; data: unknown }> {
  const url = `${supabaseUrl}/functions/v1/api-minimarket/cuentas-corrientes/pagos`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cliente_id: plan.payload.cliente_id,
        monto: plan.payload.monto,
        descripcion: plan.payload.descripcion || 'Pago via Asistente IA',
      }),
      signal: controller.signal,
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `Gateway returned ${res.status}`);
    }

    return {
      answer: `Pago registrado exitosamente:\n- Cliente: ${plan.payload.cliente_nombre}\n- Monto: $${Number(plan.payload.monto).toLocaleString('es-AR')}`,
      data: json.data,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function executeActualizarEstadoPedido(
  plan: ActionPlan,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<{ answer: string; data: unknown }> {
  const url = `${supabaseUrl}/functions/v1/api-minimarket/pedidos/${plan.payload.pedido_id}/estado`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ estado: plan.payload.nuevo_estado }),
      signal: controller.signal,
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `Gateway returned ${res.status}`);
    }

    return {
      answer: `Pedido #${plan.payload.numero_pedido} actualizado a "${plan.payload.nuevo_estado}" exitosamente.`,
      data: json.data,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function executeAplicarFactura(
  plan: ActionPlan,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<{ answer: string; data: unknown }> {
  const url = `${supabaseUrl}/functions/v1/api-minimarket/facturas/${plan.payload.factura_id}/aplicar`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // longer timeout for bulk operation

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `Gateway returned ${res.status}`);
    }

    const data = json.data as Record<string, unknown>;
    const aplicados = Number(data?.items_aplicados ?? 0);
    const errores = Number(data?.items_errores ?? 0);

    let answer = `Factura #${plan.payload.numero} aplicada exitosamente:\n- Items ingresados al deposito: ${aplicados}`;
    if (errores > 0) {
      answer += `\n- Items con error: ${errores} (aplicacion parcial)`;
    }

    return { answer, data: json.data };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Sprint 3 — Persistent audit trail for assistant actions
// ---------------------------------------------------------------------------

async function insertAuditLog(
  supabaseUrl: string,
  headers: Record<string, string>,
  entry: {
    usuario_id: string;
    intent: string;
    payload: Record<string, unknown>;
    result_success: boolean;
    result_data?: unknown;
    error_message?: string;
    request_id: string;
  },
): Promise<void> {
  const url = `${supabaseUrl}/rest/v1/asistente_audit_log`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(entry),
      signal: controller.signal,
    });
  } catch {
    // Audit insert failures are non-critical — do not propagate
  } finally {
    clearTimeout(timeout);
  }
}

const ACTION_EXECUTORS: Record<
  string,
  (plan: ActionPlan, supabaseUrl: string, headers: Record<string, string>) => Promise<{ answer: string; data: unknown }>
> = {
  crear_tarea: executeCrearTarea,
  registrar_pago_cc: executeRegistrarPagoCC,
  actualizar_estado_pedido: executeActualizarEstadoPedido,
  aplicar_factura: executeAplicarFactura,
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

  // Env validation — fail fast if critical vars are missing
  if (!supabaseUrl || !anonKey) {
    return fail(
      'CONFIG_ERROR',
      'Server misconfigured: missing SUPABASE_URL or SUPABASE_ANON_KEY',
      500,
      { 'Content-Type': 'application/json' },
    );
  }

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
    return ok({ status: 'ok', version: '2.0.0-sprint2' }, 200, responseHeaders, { requestId });
  }

  if (method !== 'POST' || (path !== '/message' && path !== '/confirm')) {
    return fail('NOT_FOUND', `Route ${method} ${path} not found`, 404, responseHeaders, { requestId });
  }

  // Auth
  const authHeader = req.headers.get('authorization');
  const { user, error: authError } = await validateUserJwt(supabaseUrl, authHeader, anonKey);

  if (!user || authError) {
    return fail('UNAUTHORIZED', authError || 'Unauthorized', 401, responseHeaders, { requestId });
  }

  // Role check — admin only
  if (user.role !== 'admin') {
    return fail('FORBIDDEN', 'El asistente esta disponible solo para administradores', 403, responseHeaders, { requestId });
  }

  // Rate limiting — per user
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rlKey = buildRateLimitKey(user.id, clientIp);
  const rlResult = rateLimiter.check(rlKey);
  const headersWithRL = withRateLimitHeaders(responseHeaders, rlResult, rateLimiter.getLimit());
  Object.assign(responseHeaders, headersWithRL);

  if (!rlResult.allowed) {
    return fail(
      'RATE_LIMITED',
      'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
      429,
      responseHeaders,
      { requestId },
    );
  }

  // =========================================================================
  // POST /confirm — execute a previously planned action
  // =========================================================================
  if (path === '/confirm') {
    let confirmBody: ConfirmRequest;
    try {
      confirmBody = await req.json();
    } catch {
      return fail('BAD_REQUEST', 'Invalid JSON body', 400, responseHeaders, { requestId });
    }

    if (!confirmBody.confirm_token || typeof confirmBody.confirm_token !== 'string') {
      return fail('BAD_REQUEST', 'confirm_token es requerido', 400, responseHeaders, { requestId });
    }

    const result = consumeConfirmToken(confirmBody.confirm_token, user.id);
    if (!result.ok) {
      const messages: Record<string, string> = {
        NOT_FOUND: 'Token de confirmacion invalido o ya utilizado',
        EXPIRED: 'El token de confirmacion ha expirado. Volve a pedir la accion.',
        USER_MISMATCH: 'El token no corresponde a tu usuario',
      };
      return fail('CONFIRM_FAILED', messages[result.reason], 400, responseHeaders, { requestId });
    }

    const executor = ACTION_EXECUTORS[result.plan.intent];
    if (!executor) {
      return fail('INTERNAL_ERROR', 'Executor not found for intent', 500, responseHeaders, { requestId });
    }

    const gatewayHeaders = buildGatewayHeaders(authHeader!, anonKey, requestId);

    try {
      const execResult = await executor(result.plan, supabaseUrl, gatewayHeaders);

      // Sprint 3: Persistent audit trail
      insertAuditLog(supabaseUrl, gatewayHeaders, {
        usuario_id: user.id,
        intent: result.plan.intent,
        payload: result.plan.payload,
        result_success: true,
        result_data: execResult.data,
        request_id: requestId,
      });

      return ok(
        {
          executed: true,
          operation: result.plan.intent,
          answer: execResult.answer,
          result: execResult.data,
          request_id: requestId,
        },
        200,
        responseHeaders,
        { requestId },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error ejecutando accion';

      // Sprint 3: Audit failed execution
      insertAuditLog(supabaseUrl, gatewayHeaders, {
        usuario_id: user.id,
        intent: result.plan.intent,
        payload: result.plan.payload,
        result_success: false,
        error_message: msg,
        request_id: requestId,
      });

      return fail('EXECUTION_ERROR', `No se pudo ejecutar la accion: ${msg}`, 502, responseHeaders, { requestId });
    }
  }

  // =========================================================================
  // POST /message — parse intent and respond
  // =========================================================================

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

  // No intent recognized — provide contextual suggestions
  if (!parsed.intent) {
    const contextualSuggestions = findRelevantSuggestions(message);
    const isContextual = contextualSuggestions.length < SUGGESTIONS.length;

    const answer = isContextual
      ? `No encontre una consulta exacta, pero quizas quisiste decir:\n${contextualSuggestions.map(s => `- ${s}`).join('\n')}\n\nToca una sugerencia o reformula tu consulta.`
      : 'No entendi tu consulta. Puedo ayudarte con:\n- Stock bajo\n- Pedidos pendientes\n- Cuentas corrientes (fiado)\n- Ventas del dia\n- Estado de facturas OCR\n- Crear tarea\n- Registrar pago de cliente\n- Actualizar estado de pedido\n- Aplicar factura al deposito\n\nEscribi "ayuda" para ver ejemplos.';

    const response: AssistantResponse = {
      intent: null,
      confidence: 0,
      mode: 'clarify',
      answer,
      data: null,
      request_id: requestId,
      suggestions: contextualSuggestions,
    };
    return ok(response, 200, responseHeaders, { requestId });
  }

  // ----- Sprint 2: Write intents → plan mode -----
  if (WRITE_INTENTS.has(parsed.intent)) {
    const gatewayHeaders = buildGatewayHeaders(authHeader!, anonKey, requestId);

    let planResult: PlanResult;
    try {
      if (parsed.intent === 'crear_tarea') {
        planResult = await buildCrearTareaPlan(parsed.params);
      } else if (parsed.intent === 'actualizar_estado_pedido') {
        planResult = await buildActualizarEstadoPedidoPlan(parsed.params, supabaseUrl, gatewayHeaders);
      } else if (parsed.intent === 'aplicar_factura') {
        planResult = await buildAplicarFacturaPlan(parsed.params, supabaseUrl, gatewayHeaders);
      } else {
        planResult = await buildRegistrarPagoCCPlan(parsed.params, supabaseUrl, gatewayHeaders);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error preparando accion';
      return fail('PLAN_ERROR', msg, 502, responseHeaders, { requestId });
    }

    // Disambiguation needed
    if (planResult.needsDisambiguation) {
      const response: AssistantResponse = {
        intent: parsed.intent,
        confidence: parsed.confidence,
        mode: 'clarify',
        answer: planResult.needsDisambiguation.message,
        data: null,
        request_id: requestId,
        suggestions: [],
      };
      return ok(response, 200, responseHeaders, { requestId });
    }

    // Generate confirm token
    const token = createConfirmToken(user.id, planResult.plan);

    const response: AssistantResponse = {
      intent: parsed.intent,
      confidence: parsed.confidence,
      mode: 'plan',
      answer: planResult.answer,
      data: null,
      request_id: requestId,
      confirm_token: token,
      action_plan: {
        intent: planResult.plan.intent,
        label: planResult.plan.label,
        payload: planResult.plan.payload,
        summary: planResult.plan.summary,
        risk: planResult.plan.risk,
      },
    };
    return ok(response, 200, responseHeaders, { requestId });
  }

  // ----- Read-only intents -----
  const handler = INTENT_HANDLERS[parsed.intent];
  if (!handler) {
    return fail('INTERNAL_ERROR', 'Intent handler not found', 500, responseHeaders, { requestId });
  }

  const gatewayHeaders = buildGatewayHeaders(authHeader!, anonKey, requestId);

  try {
    const result = await handler(supabaseUrl, gatewayHeaders, parsed.params, requestId, {
      timezone: body.context?.timezone,
    });

    const response: AssistantResponse = {
      intent: parsed.intent,
      confidence: parsed.confidence,
      mode: 'answer',
      answer: result.answer,
      data: result.data,
      request_id: requestId,
      ...(result.navigation ? { navigation: result.navigation } : {}),
    };

    return ok(response, 200, responseHeaders, { requestId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error procesando consulta';
    return fail('QUERY_ERROR', `No se pudo consultar: ${msg}`, 502, responseHeaders, { requestId });
  }
});
