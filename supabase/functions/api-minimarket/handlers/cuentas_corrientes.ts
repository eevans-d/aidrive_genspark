// ============================================================================
// HANDLER: Cuentas Corrientes (Fiados)
// ============================================================================
// GET  /cuentas-corrientes/resumen  -> vista_cc_resumen
// GET  /cuentas-corrientes/saldos   -> vista_cc_saldos_por_cliente (opcional q)
// POST /cuentas-corrientes/pagos    -> RPC sp_registrar_pago_cc(payload jsonb)
// ============================================================================

import { isAppError } from '../../_shared/errors.ts';
import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { callFunction, fetchWithParams, queryTable } from '../helpers/supabase.ts';
import { isUuid, parsePositiveNumber, sanitizeTextParam } from '../helpers/validation.ts';

const logger = createLogger('api-cuentas-corrientes');

type ApiHeaders = Record<string, string>;

export async function handleResumenCC(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
): Promise<Response> {
  try {
    const rows = await queryTable(supabaseUrl, 'vista_cc_resumen', headers, {}, '*', { limit: 1, offset: 0 });
    return ok((rows as unknown[])[0] ?? {}, 200, responseHeaders, { requestId });
  } catch (error) {
    logger.error('RESUMEN_CC_ERROR', { requestId, error });
    throw error;
  }
}

export async function handleListarSaldosCC(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  params: { q?: string | null; solo_deuda?: boolean; limit: number; offset: number },
): Promise<Response> {
  try {
    const q = typeof params.q === 'string' ? sanitizeTextParam(params.q) : '';
    const query = q.trim();

    const sp = new URLSearchParams();
    sp.set(
      'select',
      'cliente_id,nombre,telefono,email,whatsapp_e164,link_pago,limite_credito,saldo,ultimo_movimiento',
    );
    sp.set('order', 'saldo.desc,nombre');
    sp.set('limit', String(params.limit));
    sp.set('offset', String(params.offset));

    if (params.solo_deuda) {
      sp.set('saldo', 'gt.0');
    }

    if (query.length >= 2) {
      sp.set('or', `(nombre.ilike.*${query}*,telefono.ilike.*${query}*,email.ilike.*${query}*)`);
    }

    const { data, count } = await fetchWithParams(
      supabaseUrl,
      'vista_cc_saldos_por_cliente',
      sp,
      headers,
    );

    return ok(data, 200, responseHeaders, { requestId, extra: { count } });
  } catch (error) {
    logger.error('LISTAR_SALDOS_CC_ERROR', { requestId, error });
    throw error;
  }
}

export async function handleRegistrarPagoCC(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  try {
    const clienteIdRaw = body.cliente_id;
    if (typeof clienteIdRaw !== 'string' || !isUuid(clienteIdRaw)) {
      return fail('VALIDATION_ERROR', 'cliente_id inválido', 400, responseHeaders, { requestId });
    }

    const monto = parsePositiveNumber(body.monto);
    if (monto === null) {
      return fail('VALIDATION_ERROR', 'monto debe ser un número > 0', 400, responseHeaders, { requestId });
    }

    const descripcion =
      typeof body.descripcion === 'string' && body.descripcion.trim()
        ? body.descripcion.trim()
        : null;

    const result = await callFunction(supabaseUrl, 'sp_registrar_pago_cc', headers, {
      payload: {
        cliente_id: clienteIdRaw,
        monto,
        descripcion,
      },
    });

    return ok(result, 201, responseHeaders, { requestId, message: 'Pago registrado' });
  } catch (error) {
    if (isAppError(error) && error.code === 'RAISE_EXCEPTION') {
      if (error.message === 'CLIENTE_NO_ENCONTRADO') {
        return fail('NOT_FOUND', 'Cliente no encontrado', 404, responseHeaders, { requestId });
      }
      if (error.message === 'MONTO_INVALIDO') {
        return fail('VALIDATION_ERROR', 'monto inválido', 400, responseHeaders, { requestId });
      }
    }
    logger.error('REGISTRAR_PAGO_CC_ERROR', { requestId, error });
    throw error;
  }
}

