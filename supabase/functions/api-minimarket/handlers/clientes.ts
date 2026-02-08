// ============================================================================
// HANDLER: Clientes (CRM Light)
// ============================================================================
// GET  /clientes          -> listado (usa vista_cc_saldos_por_cliente si existe)
// POST /clientes          -> crear cliente
// PUT  /clientes/:id      -> actualizar cliente
// ============================================================================

import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { fetchWithParams, insertTable, updateTable, queryTableWithCount } from '../helpers/supabase.ts';
import { isUuid, parseNonNegativeNumber, sanitizeTextParam } from '../helpers/validation.ts';

const logger = createLogger('api-clientes');

type ApiHeaders = Record<string, string>;

export type ListClientesParams = {
  q?: string | null;
  limit: number;
  offset: number;
};

export async function handleListarClientes(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  params: ListClientesParams,
): Promise<Response> {
  try {
    const q = typeof params.q === 'string' ? sanitizeTextParam(params.q) : '';
    const query = q.trim();

    const sp = new URLSearchParams();
    sp.set(
      'select',
      'cliente_id,nombre,telefono,email,direccion_default,whatsapp_e164,link_pago,limite_credito,saldo,ultimo_movimiento',
    );
    sp.set('order', 'nombre');
    sp.set('limit', String(params.limit));
    sp.set('offset', String(params.offset));

    if (query.length >= 2) {
      // Search by name/phone/email
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
    logger.error('LISTAR_CLIENTES_ERROR', { requestId, error });
    throw error;
  }
}

type ClientePayload = {
  nombre?: unknown;
  telefono?: unknown;
  email?: unknown;
  direccion_default?: unknown;
  edificio?: unknown;
  piso?: unknown;
  departamento?: unknown;
  observaciones?: unknown;
  activo?: unknown;
  whatsapp_e164?: unknown;
  link_pago?: unknown;
  limite_credito?: unknown;
};

function buildClientePatch(
  payload: ClientePayload,
  options: { requireNombre: boolean; allowLimiteCredito: boolean },
): { ok: true; value: Record<string, unknown> } | { ok: false; code: string; message: string } {
  const patch: Record<string, unknown> = {};

  const nombre =
    typeof payload.nombre === 'string' ? payload.nombre.trim() : '';
  if (options.requireNombre) {
    if (!nombre) return { ok: false, code: 'VALIDATION_ERROR', message: 'nombre es requerido' };
    patch.nombre = nombre;
  } else if (typeof payload.nombre === 'string') {
    if (!nombre) return { ok: false, code: 'VALIDATION_ERROR', message: 'nombre no puede ser vacío' };
    patch.nombre = nombre;
  }

  const setIfString = (key: string, value: unknown) => {
    if (typeof value === 'string') {
      const v = value.trim();
      patch[key] = v === '' ? null : v;
    }
  };

  setIfString('telefono', payload.telefono);
  setIfString('email', payload.email);
  setIfString('direccion_default', payload.direccion_default);
  setIfString('edificio', payload.edificio);
  setIfString('piso', payload.piso);
  setIfString('departamento', payload.departamento);
  setIfString('observaciones', payload.observaciones);
  setIfString('whatsapp_e164', payload.whatsapp_e164);
  setIfString('link_pago', payload.link_pago);

  if (payload.activo !== undefined) {
    if (typeof payload.activo !== 'boolean') {
      return { ok: false, code: 'VALIDATION_ERROR', message: 'activo debe ser boolean' };
    }
    patch.activo = payload.activo;
  }

  if (payload.limite_credito !== undefined) {
    if (!options.allowLimiteCredito) {
      return { ok: false, code: 'FORBIDDEN', message: 'limite_credito solo puede ser editado por admin' };
    }

    if (payload.limite_credito === null) {
      patch.limite_credito = null;
    } else {
      const parsed = parseNonNegativeNumber(payload.limite_credito);
      if (parsed === null) {
        return { ok: false, code: 'VALIDATION_ERROR', message: 'limite_credito inválido' };
      }
      patch.limite_credito = parsed;
    }
  }

  return { ok: true, value: patch };
}

export async function handleCrearCliente(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  payload: ClientePayload,
  options: { allowLimiteCredito: boolean },
): Promise<Response> {
  try {
    const patchRes = buildClientePatch(payload, {
      requireNombre: true,
      allowLimiteCredito: options.allowLimiteCredito,
    });
    if (!patchRes.ok) {
      return fail(patchRes.code, patchRes.message, patchRes.code === 'FORBIDDEN' ? 403 : 400, responseHeaders, { requestId });
    }

    const inserted = await insertTable(supabaseUrl, 'clientes', headers, patchRes.value);
    const row = (inserted as unknown[])[0] as Record<string, unknown> | undefined;

    return ok(row ?? inserted, 201, responseHeaders, { requestId, message: 'Cliente creado' });
  } catch (error) {
    logger.error('CREAR_CLIENTE_ERROR', { requestId, error });
    throw error;
  }
}

export async function handleActualizarCliente(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  clienteId: string,
  payload: ClientePayload,
  options: { allowLimiteCredito: boolean },
): Promise<Response> {
  try {
    if (!isUuid(clienteId)) {
      return fail('VALIDATION_ERROR', 'id de cliente inválido', 400, responseHeaders, { requestId });
    }

    const patchRes = buildClientePatch(payload, {
      requireNombre: false,
      allowLimiteCredito: options.allowLimiteCredito,
    });
    if (!patchRes.ok) {
      return fail(patchRes.code, patchRes.message, patchRes.code === 'FORBIDDEN' ? 403 : 400, responseHeaders, { requestId });
    }

    if (Object.keys(patchRes.value).length === 0) {
      return fail('VALIDATION_ERROR', 'No hay campos para actualizar', 400, responseHeaders, { requestId });
    }

    const updated = await updateTable(supabaseUrl, 'clientes', clienteId, headers, patchRes.value);
    const row = (updated as unknown[])[0] as Record<string, unknown> | undefined;

    if (!row) {
      return fail('NOT_FOUND', 'Cliente no encontrado', 404, responseHeaders, { requestId });
    }

    return ok(row, 200, responseHeaders, { requestId, message: 'Cliente actualizado' });
  } catch (error) {
    logger.error('ACTUALIZAR_CLIENTE_ERROR', { requestId, clienteId, error });
    throw error;
  }
}

export async function handleResumenCuentaCorriente(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
): Promise<Response> {
  try {
    const { data } = await queryTableWithCount(
      supabaseUrl,
      'vista_cc_resumen',
      headers,
      {},
      '*',
      { limit: 1, offset: 0 },
    );
    const row = (data as unknown[])[0] as Record<string, unknown> | undefined;
    return ok(row ?? {}, 200, responseHeaders, { requestId });
  } catch (error) {
    logger.error('RESUMEN_CC_ERROR', { requestId, error });
    throw error;
  }
}

