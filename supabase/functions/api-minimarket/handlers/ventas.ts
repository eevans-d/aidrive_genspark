// ============================================================================
// HANDLER: Ventas (POS)
// ============================================================================
// POST /ventas  -> RPC sp_procesar_venta_pos(payload jsonb) con idempotencia
// GET  /ventas  -> Listado básico (incluye cliente embebido)
// GET  /ventas/:id -> Detalle con items
// ============================================================================

import { isAppError } from '../../_shared/errors.ts';
import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { callFunction, queryTable, queryTableWithCount } from '../helpers/supabase.ts';
import { isUuid, parsePositiveInt } from '../helpers/validation.ts';

const logger = createLogger('api-ventas');

type ApiHeaders = Record<string, string>;

type LoggerLike = {
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

type RespondOk = <T>(
  data: T,
  status?: number,
  options?: { message?: string; extra?: Record<string, unknown> },
) => Response;

type RespondFail = (
  code: string,
  message: string,
  status?: number,
  options?: { details?: unknown; message?: string; extra?: Record<string, unknown> },
) => Response;

type RequestHeadersFactory = (extraHeaders?: Record<string, string>) => Record<string, string>;

export type CreateVentaInput = {
  supabaseUrl: string;
  userId: string;
  requestId: string;
  clientIp: string;
  body: Record<string, unknown>;
  idempotencyKeyRaw: string | null;
  requestHeaders: RequestHeadersFactory;
  respondOk: RespondOk;
  respondFail: RespondFail;
  logger?: LoggerLike;
};

export type CreateVentaDeps = {
  callFunctionImpl?: typeof callFunction;
};

type VentaItemInput = { producto_id: string; cantidad: number };

function aggregateItems(items: VentaItemInput[]): VentaItemInput[] {
  const map = new Map<string, number>();
  for (const it of items) {
    map.set(it.producto_id, (map.get(it.producto_id) ?? 0) + it.cantidad);
  }
  return Array.from(map.entries()).map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
}

export async function handleCreateVentaPos(
  input: CreateVentaInput,
  deps: CreateVentaDeps = {},
): Promise<Response> {
  const {
    supabaseUrl,
    userId,
    requestId,
    clientIp,
    body,
    idempotencyKeyRaw,
    requestHeaders,
    respondOk,
    respondFail,
    logger: logLike,
  } = input;

  const metodoPagoRaw = body.metodo_pago;
  const metodoPago =
    typeof metodoPagoRaw === 'string' ? metodoPagoRaw.trim().toLowerCase() : '';
  if (!metodoPago || !['efectivo', 'tarjeta', 'cuenta_corriente'].includes(metodoPago)) {
    return respondFail(
      'VALIDATION_ERROR',
      'metodo_pago debe ser "efectivo", "tarjeta" o "cuenta_corriente"',
      400,
    );
  }

  const confirmarRiesgo = body.confirmar_riesgo === true;

  const clienteIdRaw = body.cliente_id;
  const clienteId =
    typeof clienteIdRaw === 'string' && clienteIdRaw.trim() ? clienteIdRaw.trim() : null;
  if (clienteId !== null && !isUuid(clienteId)) {
    return respondFail('VALIDATION_ERROR', 'cliente_id invalido', 400);
  }
  if (metodoPago === 'cuenta_corriente' && !clienteId) {
    return respondFail('VALIDATION_ERROR', 'cliente_id es requerido para cuenta_corriente', 400);
  }

  const itemsRaw = body.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    return respondFail('VALIDATION_ERROR', 'items es requerido (array no vacío)', 400);
  }

  const parsedItems: VentaItemInput[] = [];
  for (let i = 0; i < itemsRaw.length; i += 1) {
    const item = itemsRaw[i] as Record<string, unknown> | null;
    if (!item || typeof item !== 'object') {
      return respondFail('VALIDATION_ERROR', `items[${i}] invalido`, 400);
    }

    const pid = item.producto_id;
    if (typeof pid !== 'string' || !isUuid(pid)) {
      return respondFail('VALIDATION_ERROR', `items[${i}].producto_id invalido`, 400);
    }

    const qty = parsePositiveInt(item.cantidad);
    if (qty === null) {
      return respondFail('VALIDATION_ERROR', `items[${i}].cantidad debe ser entero > 0`, 400);
    }

    parsedItems.push({ producto_id: pid, cantidad: qty });
  }

  const idempotencyKey = typeof idempotencyKeyRaw === 'string' ? idempotencyKeyRaw.trim() : '';
  if (!idempotencyKey) {
    logLike?.warn?.('IDEMPOTENCY_KEY_MISSING', { requestId, clientIp, userId });
    return respondFail('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key es requerido', 400);
  }

  const callFn = deps.callFunctionImpl || callFunction;

  try {
    const result = await callFn(supabaseUrl, 'sp_procesar_venta_pos', requestHeaders(), {
      payload: {
        idempotency_key: idempotencyKey,
        metodo_pago: metodoPago,
        cliente_id: clienteId,
        confirmar_riesgo: confirmarRiesgo,
        items: aggregateItems(parsedItems),
      },
    });

    const payload = result as Record<string, unknown>;
    const status = typeof payload.status === 'string' ? payload.status : 'created';
    const idempotent = status === 'existing';

    return respondOk(payload, idempotent ? 200 : 201, {
      message: idempotent ? 'Venta ya existente (idempotente)' : 'Venta creada exitosamente',
      extra: { idempotent },
    });
  } catch (error) {
    if (
      isAppError(error) &&
      (error.code === 'UNDEFINED_FUNCTION' || error.code === 'POSTGREST_NOT_FOUND')
    ) {
      logLike?.error?.('VENTAS_RPC_MISSING', { requestId, error: error.message });
      return respondFail(
        'VENTAS_UNAVAILABLE',
        'Ventas temporalmente no disponibles. Intente nuevamente más tarde.',
        503,
      );
    }

    if (isAppError(error) && error.code === 'RAISE_EXCEPTION') {
      const msg = error.message;
      if (msg === 'LOSS_RISK_CONFIRM_REQUIRED') {
        return respondFail(
          'LOSS_RISK_CONFIRM_REQUIRED',
          'Se requiere confirmación explícita por riesgo de pérdida',
          409,
        );
      }
      if (msg === 'STOCK_INSUFICIENTE') {
        return respondFail('INSUFFICIENT_STOCK', 'Stock insuficiente para la venta', 409);
      }
      if (msg === 'CREDIT_LIMIT_EXCEEDED') {
        return respondFail(
          'CREDIT_LIMIT_EXCEEDED',
          'El cliente supera el límite de crédito configurado',
          409,
        );
      }
      if (msg === 'CLIENTE_REQUIRED_FOR_CC' || msg === 'CLIENTE_REQUIRED_FOR_CC') {
        return respondFail('VALIDATION_ERROR', 'cliente_id es requerido para cuenta_corriente', 400);
      }
    }

    throw error;
  }
}

// ============================================================================
// GET /ventas (lista)
// ============================================================================

export async function handleListarVentas(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  params: { limit: number; offset: number; fecha_desde?: string; fecha_hasta?: string },
): Promise<Response> {
  try {
    if (!params.fecha_desde && !params.fecha_hasta) {
      const { data, count } = await queryTableWithCount(
        supabaseUrl,
        'ventas',
        headers,
        {},
        'id,created_at,metodo_pago,monto_total,cliente_id,clientes(nombre,telefono)',
        { order: 'created_at.desc', limit: params.limit, offset: params.offset },
      );
      return ok(data, 200, responseHeaders, { requestId, extra: { count } });
    }

    // Date range filters require manual URL construction (queryTableWithCount only supports eq.)
    const sp = new URLSearchParams();
    sp.set('select', 'id,created_at,metodo_pago,monto_total,cliente_id,clientes(nombre,telefono)');
    sp.set('order', 'created_at.desc');
    sp.set('limit', String(params.limit));
    sp.set('offset', String(params.offset));
    if (params.fecha_desde) sp.append('created_at', `gte.${params.fecha_desde}`);
    if (params.fecha_hasta) sp.append('created_at', `lte.${params.fecha_hasta}`);

    const res = await fetch(`${supabaseUrl}/rest/v1/ventas?${sp.toString()}`, {
      headers: { ...headers, 'Prefer': 'count=exact' },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Error listando ventas: ${body}`);
    }

    const data = await res.json();
    const contentRange = res.headers.get('content-range') || '*/0';
    const count = parseInt(contentRange.split('/')[1] || '0', 10);

    return ok(data, 200, responseHeaders, { requestId, extra: { count } });
  } catch (error) {
    logger.error('LISTAR_VENTAS_ERROR', { requestId, error });
    throw error;
  }
}

// ============================================================================
// GET /ventas/:id (detalle)
// ============================================================================

export async function handleObtenerVenta(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  ventaId: string,
): Promise<Response> {
  try {
    if (!isUuid(ventaId)) {
      return fail('VALIDATION_ERROR', 'id de venta invalido', 400, responseHeaders, { requestId });
    }

    const rows = await queryTable(
      supabaseUrl,
      'ventas',
      headers,
      { id: ventaId },
      '*,venta_items(*),clientes(*)',
    );

    if (!rows || rows.length === 0) {
      return fail('NOT_FOUND', 'Venta no encontrada', 404, responseHeaders, { requestId });
    }

    return ok(rows[0], 200, responseHeaders, { requestId });
  } catch (error) {
    logger.error('OBTENER_VENTA_ERROR', { requestId, ventaId, error });
    throw error;
  }
}

