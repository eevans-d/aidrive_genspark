// ============================================================================
// HANDLER: Ofertas (Anti-mermas)
// ============================================================================
// GET  /ofertas/sugeridas
// POST /ofertas/aplicar
// POST /ofertas/:id/desactivar
// ============================================================================

import { isAppError } from '../../_shared/errors.ts';
import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { callFunction, queryTable } from '../helpers/supabase.ts';
import { isUuid, parseNonNegativeNumber } from '../helpers/validation.ts';

const logger = createLogger('api-ofertas');

type ApiHeaders = Record<string, string>;

export type OfertasDeps = {
  queryTableImpl?: typeof queryTable;
  callFunctionImpl?: typeof callFunction;
};

export async function handleListarOfertasSugeridas(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  deps: OfertasDeps = {},
): Promise<Response> {
  try {
    const query = deps.queryTableImpl || queryTable;
    const rows = await query(
      supabaseUrl,
      'vista_ofertas_sugeridas',
      headers,
      {},
      '*',
      { order: 'dias_hasta_vencimiento.asc', limit: 50, offset: 0 },
    );
    return ok(rows, 200, responseHeaders, { requestId });
  } catch (error) {
    logger.error('LISTAR_OFERTAS_SUGERIDAS_ERROR', { requestId, error });
    throw error;
  }
}

export async function handleAplicarOferta(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  body: Record<string, unknown>,
  deps: OfertasDeps = {},
): Promise<Response> {
  try {
    const stockId = typeof body.stock_id === 'string' ? body.stock_id.trim() : '';
    if (!stockId || !isUuid(stockId)) {
      return fail('VALIDATION_ERROR', 'stock_id inválido', 400, responseHeaders, { requestId });
    }

    const descuentoRaw = body.descuento_pct;
    const descuento = descuentoRaw === undefined || descuentoRaw === null || descuentoRaw === ''
      ? 30
      : parseNonNegativeNumber(descuentoRaw);

    if (descuento === null || descuento <= 0 || descuento >= 100) {
      return fail('VALIDATION_ERROR', 'descuento_pct inválido', 400, responseHeaders, { requestId });
    }

    const callFn = deps.callFunctionImpl || callFunction;
    const result = await callFn(supabaseUrl, 'sp_aplicar_oferta_stock', headers, {
      p_stock_id: stockId,
      p_descuento_pct: descuento,
    });

    return ok(result, 201, responseHeaders, { requestId, message: 'Oferta aplicada' });
  } catch (error) {
    if (isAppError(error) && error.code === 'RAISE_EXCEPTION') {
      if (error.message === 'STOCK_NO_ENCONTRADO') {
        return fail('NOT_FOUND', 'Stock no encontrado', 404, responseHeaders, { requestId });
      }
      if (error.message === 'PRECIO_BASE_INVALIDO') {
        return fail('CONFLICT', 'El producto no tiene precio base válido', 409, responseHeaders, { requestId });
      }
      if (error.message === 'DESCUENTO_INVALIDO') {
        return fail('VALIDATION_ERROR', 'descuento_pct inválido', 400, responseHeaders, { requestId });
      }
    }

    logger.error('APLICAR_OFERTA_ERROR', { requestId, error });
    throw error;
  }
}

export async function handleDesactivarOferta(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  ofertaId: string,
  deps: OfertasDeps = {},
): Promise<Response> {
  try {
    if (!isUuid(ofertaId)) {
      return fail('VALIDATION_ERROR', 'id de oferta inválido', 400, responseHeaders, { requestId });
    }

    const callFn = deps.callFunctionImpl || callFunction;
    const result = await callFn(supabaseUrl, 'sp_desactivar_oferta_stock', headers, {
      p_oferta_id: ofertaId,
    });

    return ok(result, 200, responseHeaders, { requestId, message: 'Oferta desactivada' });
  } catch (error) {
    if (isAppError(error) && error.code === 'RAISE_EXCEPTION') {
      if (error.message === 'NOT_FOUND') {
        return fail('NOT_FOUND', 'Oferta no encontrada', 404, responseHeaders, { requestId });
      }
    }

    logger.error('DESACTIVAR_OFERTA_ERROR', { requestId, ofertaId, error });
    throw error;
  }
}
