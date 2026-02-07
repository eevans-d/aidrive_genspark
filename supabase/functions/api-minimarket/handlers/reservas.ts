import { isAppError } from '../../_shared/errors.ts';
import { callFunction } from '../helpers/supabase.ts';
import { isUuid, parsePositiveInt } from '../helpers/validation.ts';

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

export type CreateReservaInput = {
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

export type CreateReservaDeps = {
  callFunctionImpl?: typeof callFunction;
};

export async function handleCreateReserva(
  input: CreateReservaInput,
  deps: CreateReservaDeps = {},
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
    logger,
  } = input;

  const { producto_id, cantidad, referencia, deposito } = body as Record<string, unknown>;

  if (typeof producto_id !== 'string' || !isUuid(producto_id)) {
    return respondFail('VALIDATION_ERROR', 'producto_id invalido', 400);
  }

  const cantidadNumero = parsePositiveInt(cantidad);
  if (cantidadNumero === null) {
    return respondFail('VALIDATION_ERROR', 'cantidad debe ser un entero > 0', 400);
  }

  const depositoValue = typeof deposito === 'string' && deposito.trim() ? deposito.trim() : 'Principal';
  const referenciaValue = typeof referencia === 'string' && referencia.trim() ? referencia.trim() : null;
  const idempotencyKey = typeof idempotencyKeyRaw === 'string' ? idempotencyKeyRaw.trim() : '';

  if (!idempotencyKey) {
    logger?.warn?.('IDEMPOTENCY_KEY_MISSING', { requestId, clientIp, producto_id });
    return respondFail('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key es requerido', 400);
  }

  const callFn = deps.callFunctionImpl || callFunction;

  try {
    const result = await callFn(supabaseUrl, 'sp_reservar_stock', requestHeaders(), {
      p_producto_id: producto_id,
      p_cantidad: cantidadNumero,
      p_usuario: userId,
      p_referencia: referenciaValue,
      p_deposito: depositoValue,
      p_idempotency_key: idempotencyKey,
    });

    const payload = result as Record<string, unknown>;
    const reserva = (payload?.reserva as Record<string, unknown>) || payload;
    const idempotent = Boolean(payload?.idempotent);
    const stockDisponible = payload?.stock_disponible;

    return respondOk(reserva, idempotent ? 200 : 201, {
      message: idempotent ? 'Reserva ya existente (idempotente)' : 'Reserva creada exitosamente',
      extra: {
        idempotent,
        stock_disponible: stockDisponible,
      },
    });
  } catch (error) {
    if (
      isAppError(error) &&
      (error.code === 'UNDEFINED_FUNCTION' || error.code === 'POSTGREST_NOT_FOUND')
    ) {
      logger?.error?.('RESERVA_RPC_MISSING', { requestId, error: error.message });
      return respondFail(
        'RESERVA_UNAVAILABLE',
        'Reserva temporalmente no disponible. Intente nuevamente más tarde.',
        503,
      );
    }

    if (isAppError(error) && error.code === 'RAISE_EXCEPTION' && error.message === 'INSUFFICIENT_STOCK') {
      return respondFail('INSUFFICIENT_STOCK', 'Stock disponible insuficiente para la reserva', 409);
    }

    throw error;
  }
}

