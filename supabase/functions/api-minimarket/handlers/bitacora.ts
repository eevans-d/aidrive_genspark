// ============================================================================
// HANDLER: Bitácora de Turnos (Notas de Turno)
// ============================================================================
// POST /bitacora  -> crear nota de turno (roles base)
// GET  /bitacora  -> listar notas (solo admin)
// ============================================================================

import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { insertTable, queryTable } from '../helpers/supabase.ts';

const logger = createLogger('api-bitacora');

type ApiHeaders = Record<string, string>;

export type BitacoraDeps = {
  insertTableImpl?: typeof insertTable;
  queryTableImpl?: typeof queryTable;
};

export type UserSnapshot = {
  email?: string;
  role: string | null;
};

export async function handleCrearBitacora(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  body: Record<string, unknown>,
  user: UserSnapshot | null,
  deps: BitacoraDeps = {},
): Promise<Response> {
  try {
    const nota = typeof body.nota === 'string' ? body.nota.trim() : '';
    if (!nota) {
      return fail('VALIDATION_ERROR', 'nota es requerida', 400, responseHeaders, { requestId });
    }
    if (nota.length > 2000) {
      return fail('VALIDATION_ERROR', 'nota demasiado larga (máx 2000)', 400, responseHeaders, { requestId });
    }

    const usuarioNombre = typeof body.usuario_nombre === 'string' ? body.usuario_nombre.trim() : '';

    const insert = deps.insertTableImpl || insertTable;
    const inserted = await insert(supabaseUrl, 'bitacora_turnos', headers, {
      // usuario_id se setea por DEFAULT auth.uid() y es validado por RLS
      usuario_nombre: usuarioNombre || null,
      usuario_email: user?.email ?? null,
      usuario_rol: user?.role ?? null,
      nota,
    });

    const row = (inserted as unknown[])[0] as Record<string, unknown> | undefined;
    return ok(row ?? inserted, 201, responseHeaders, { requestId, message: 'Nota registrada' });
  } catch (error) {
    logger.error('CREAR_BITACORA_ERROR', { requestId, error });
    throw error;
  }
}

export async function handleListarBitacora(
  supabaseUrl: string,
  headers: ApiHeaders,
  responseHeaders: Record<string, string>,
  requestId: string,
  params: { limit: number; offset: number },
  deps: BitacoraDeps = {},
): Promise<Response> {
  try {
    const query = deps.queryTableImpl || queryTable;
    const rows = await query(
      supabaseUrl,
      'bitacora_turnos',
      headers,
      {},
      'id,usuario_nombre,usuario_email,usuario_rol,nota,created_at',
      { order: 'created_at.desc', limit: params.limit, offset: params.offset },
    );
    return ok(rows, 200, responseHeaders, { requestId });
  } catch (error) {
    logger.error('LISTAR_BITACORA_ERROR', { requestId, error });
    throw error;
  }
}

