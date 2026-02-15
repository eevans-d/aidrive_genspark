// ============================================================================
// HANDLER: Proveedores (CRUD)
// ============================================================================
// POST /proveedores          -> crear proveedor
// PUT  /proveedores/:id      -> actualizar proveedor
// ============================================================================

import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { insertTable, updateTable } from '../helpers/supabase.ts';
import { isUuid, sanitizeTextParam } from '../helpers/validation.ts';

const logger = createLogger('api-proveedores');

type ApiHeaders = Record<string, string>;

type ProveedorPayload = {
  nombre?: unknown;
  contacto?: unknown;
  email?: unknown;
  telefono?: unknown;
  direccion?: unknown;
  cuit?: unknown;
  sitio_web?: unknown;
  productos_ofrecidos?: unknown;
  activo?: unknown;
};

function buildProveedorPatch(
  payload: ProveedorPayload,
  options: { requireNombre: boolean },
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

  setIfString('contacto', payload.contacto);
  setIfString('email', payload.email);
  setIfString('telefono', payload.telefono);
  setIfString('direccion', payload.direccion);
  setIfString('cuit', payload.cuit);
  setIfString('sitio_web', payload.sitio_web);

  if (Array.isArray(payload.productos_ofrecidos)) {
    const filtered = payload.productos_ofrecidos
      .filter((item: unknown): item is string => typeof item === 'string')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    patch.productos_ofrecidos = filtered.length > 0 ? filtered : null;
  }

  if (payload.activo !== undefined) {
    if (typeof payload.activo !== 'boolean') {
      return { ok: false, code: 'VALIDATION_ERROR', message: 'activo debe ser boolean' };
    }
    patch.activo = payload.activo;
  }

  return { ok: true, value: patch };
}

export async function handleCrearProveedor(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  payload: ProveedorPayload,
): Promise<Response> {
  try {
    const patchRes = buildProveedorPatch(payload, { requireNombre: true });
    if (!patchRes.ok) {
      return fail(patchRes.code, patchRes.message, 400, responseHeaders, { requestId });
    }

    const inserted = await insertTable(supabaseUrl, 'proveedores', headers, patchRes.value);
    const row = (inserted as unknown[])[0] as Record<string, unknown> | undefined;

    return ok(row ?? inserted, 201, responseHeaders, { requestId, message: 'Proveedor creado' });
  } catch (error) {
    logger.error('CREAR_PROVEEDOR_ERROR', { requestId, error });
    throw error;
  }
}

export async function handleActualizarProveedor(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  proveedorId: string,
  payload: ProveedorPayload,
): Promise<Response> {
  try {
    if (!isUuid(proveedorId)) {
      return fail('VALIDATION_ERROR', 'id de proveedor invalido', 400, responseHeaders, { requestId });
    }

    const patchRes = buildProveedorPatch(payload, { requireNombre: false });
    if (!patchRes.ok) {
      return fail(patchRes.code, patchRes.message, 400, responseHeaders, { requestId });
    }

    if (Object.keys(patchRes.value).length === 0) {
      return fail('VALIDATION_ERROR', 'No hay campos para actualizar', 400, responseHeaders, { requestId });
    }

    const updated = await updateTable(supabaseUrl, 'proveedores', proveedorId, headers, patchRes.value);
    const row = (updated as unknown[])[0] as Record<string, unknown> | undefined;

    if (!row) {
      return fail('NOT_FOUND', 'Proveedor no encontrado', 404, responseHeaders, { requestId });
    }

    return ok(row, 200, responseHeaders, { requestId, message: 'Proveedor actualizado' });
  } catch (error) {
    logger.error('ACTUALIZAR_PROVEEDOR_ERROR', { requestId, proveedorId, error });
    throw error;
  }
}
