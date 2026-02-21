/**
 * backfill-faltantes-recordatorios
 *
 * Daily idempotent backfill: creates reminder tasks in `tareas_pendientes`
 * for critical unresolved faltantes (`productos_faltantes`) that do not
 * already have an active associated task.
 *
 * Query params:
 *   ?dry_run=true   — simulate without writing to DB
 *
 * Auth: service-role key required (internal cron endpoint).
 *
 * Idempotency guarantee:
 *   Each faltante is linked via `datos->>'faltante_id'` in tareas_pendientes.
 *   A tarea is considered "active" when estado IN ('pendiente','en_progreso').
 *   Re-running produces zero new rows if all critical faltantes are already covered.
 *
 * Fail-safe:
 *   Errors on individual rows do not abort the batch.
 *   Response includes procesados / creados / omitidos / errores counts.
 */

import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { ok, fail } from '../_shared/response.ts';
import { requireServiceRoleAuth } from '../_shared/internal-auth.ts';

const BACKFILL_VERSION = '1.0.0';
const FETCH_TIMEOUT_MS = 8000;

interface FaltanteCritico {
  id: string;
  producto_id: string | null;
  producto_nombre: string | null;
  cantidad_faltante: number | null;
  observaciones: string | null;
  proveedor_asignado_id: string | null;
  fecha_reporte: string | null;
}

interface BackfillCounts {
  procesados: number;
  creados: number;
  omitidos: number;
  errores: number;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  const preflight = handleCors(req, corsHeaders);
  if (preflight) return preflight;

  const logger = createLogger('backfill-faltantes-recordatorios');
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === 'true';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return fail(
        'CONFIG_ERROR',
        'Configuración de Supabase faltante',
        500,
        corsHeaders,
        { requestId },
      );
    }

    const authCheck = requireServiceRoleAuth(req, serviceRoleKey, corsHeaders, requestId);
    if (!authCheck.authorized) {
      logger.warn('UNAUTHORIZED_REQUEST', { requestId });
      return authCheck.errorResponse as Response;
    }

    const headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    };

    // ── Step 1: Fetch critical unresolved faltantes ──────────────────────
    const faltantesResponse = await fetch(
      `${supabaseUrl}/rest/v1/productos_faltantes` +
        `?resuelto=eq.false&prioridad=eq.alta` +
        `&select=id,producto_id,producto_nombre,cantidad_faltante,observaciones,proveedor_asignado_id,fecha_reporte` +
        `&order=created_at.asc`,
      { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );

    if (!faltantesResponse.ok) {
      const body = await faltantesResponse.text();
      throw new Error(`Error al obtener faltantes críticos: ${faltantesResponse.status} ${body}`);
    }

    const faltantes: FaltanteCritico[] = await faltantesResponse.json();

    if (faltantes.length === 0) {
      logger.info('BACKFILL_NO_FALTANTES', { requestId, dryRun });
      return ok(
        {
          procesados: 0,
          creados: 0,
          omitidos: 0,
          errores: 0,
          dry_run: dryRun,
          mensaje: 'No hay faltantes críticos activos.',
          timestamp: new Date().toISOString(),
        },
        200,
        corsHeaders,
        { requestId },
      );
    }

    // ── Step 2: Fetch existing active tareas linked to faltantes ─────────
    // Active = estado IN ('pendiente','en_progreso') AND tipo='reposicion'
    const tareasResponse = await fetch(
      `${supabaseUrl}/rest/v1/tareas_pendientes` +
        `?tipo=eq.reposicion` +
        `&or=(estado.eq.pendiente,estado.eq.en_progreso)` +
        `&select=id,datos`,
      { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );

    const existingFaltanteIds = new Set<string>();

    if (tareasResponse.ok) {
      const tareas: Array<{ id: string; datos: Record<string, unknown> | null }> =
        await tareasResponse.json();

      for (const t of tareas) {
        const faltanteId = t.datos?.faltante_id;
        if (typeof faltanteId === 'string' && faltanteId.length > 0) {
          existingFaltanteIds.add(faltanteId);
        }
      }
    } else {
      logger.warn('BACKFILL_TAREAS_FETCH_WARN', {
        requestId,
        status: tareasResponse.status,
      });
      // Continue — we'll conservatively create tareas (worst case: some duplicates
      // on the first run if this query fails, but next run will skip them).
    }

    // ── Step 3: Determine which faltantes need a new tarea ──────────────
    const toCreate: FaltanteCritico[] = [];
    let omitidos = 0;

    for (const f of faltantes) {
      if (existingFaltanteIds.has(f.id)) {
        omitidos++;
      } else {
        toCreate.push(f);
      }
    }

    logger.info('BACKFILL_PLAN', {
      requestId,
      dryRun,
      totalFaltantes: faltantes.length,
      toCreate: toCreate.length,
      omitidos,
    });

    // ── Dry-run: return plan without writing ─────────────────────────────
    if (dryRun) {
      return ok(
        {
          procesados: faltantes.length,
          creados: 0,
          omitidos,
          errores: 0,
          dry_run: true,
          plan: toCreate.map((f) => ({
            faltante_id: f.id,
            producto_nombre: f.producto_nombre,
            cantidad_faltante: f.cantidad_faltante,
          })),
          mensaje: `Dry-run: ${toCreate.length} tareas se crearían.`,
          timestamp: new Date().toISOString(),
        },
        200,
        corsHeaders,
        { requestId },
      );
    }

    // ── Step 4: Create tareas (batch insert with per-row fallback) ──────
    const counts: BackfillCounts = {
      procesados: faltantes.length,
      creados: 0,
      omitidos,
      errores: 0,
    };
    const erroresDetalle: Array<{ faltante_id: string; error: string }> = [];
    const creados: Array<{ faltante_id: string; tarea_id: string }> = [];

    // Build all payloads first
    const payloads: Array<{ faltante: FaltanteCritico; payload: Record<string, unknown> }> = [];
    for (const f of toCreate) {
      const productName = (f.producto_nombre ?? '').trim() || 'Producto faltante';
      const safeProductName = productName.slice(0, 80);
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const descriptionParts = [
        'Generado por backfill diario de faltantes críticos.',
        `Producto: ${productName}.`,
        f.cantidad_faltante ? `Cantidad estimada: ${f.cantidad_faltante}.` : null,
        f.observaciones ? `Nota: ${f.observaciones.slice(0, 180)}.` : null,
        f.fecha_reporte ? `Reportado: ${new Date(f.fecha_reporte).toLocaleDateString('es-AR')}.` : null,
      ].filter(Boolean);

      payloads.push({
        faltante: f,
        payload: {
          titulo: `Reponer urgente: ${safeProductName}`,
          descripcion: descriptionParts.join(' '),
          prioridad: 'urgente',
          estado: 'pendiente',
          tipo: 'reposicion',
          creada_por_nombre: 'Sistema Backfill Diario',
          fecha_vencimiento: dueDate,
          datos: {
            origen: 'cuaderno',
            faltante_id: f.id,
            backfill_version: BACKFILL_VERSION,
          },
        },
      });
    }

    if (payloads.length > 0) {
      // Try batch insert first (single POST with array — same pattern as alertas-stock)
      try {
        const batchResponse = await fetch(
          `${supabaseUrl}/rest/v1/tareas_pendientes`,
          {
            method: 'POST',
            headers: { ...headers, Prefer: 'return=representation' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            body: JSON.stringify(payloads.map((p) => p.payload)),
          },
        );

        if (batchResponse.ok) {
          const batchCreated = await batchResponse.json();
          const results = Array.isArray(batchCreated) ? batchCreated : [batchCreated];
          for (let i = 0; i < payloads.length; i++) {
            const tareaId = results[i]?.id ?? 'unknown';
            creados.push({ faltante_id: payloads[i].faltante.id, tarea_id: tareaId });
            counts.creados++;
          }
        } else {
          // Batch failed — fall back to per-row inserts for fail-safe
          const batchError = await batchResponse.text();
          logger.warn('BACKFILL_BATCH_FALLBACK', {
            requestId,
            status: batchResponse.status,
            error: batchError,
          });

          for (const { faltante: f, payload } of payloads) {
            try {
              const createResponse = await fetch(
                `${supabaseUrl}/rest/v1/tareas_pendientes`,
                {
                  method: 'POST',
                  headers: { ...headers, Prefer: 'return=representation' },
                  signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
                  body: JSON.stringify(payload),
                },
              );

              if (!createResponse.ok) {
                const errorBody = await createResponse.text();
                throw new Error(`HTTP ${createResponse.status}: ${errorBody}`);
              }

              const created = await createResponse.json();
              const tareaId = Array.isArray(created) ? created[0]?.id : created?.id;
              creados.push({ faltante_id: f.id, tarea_id: tareaId ?? 'unknown' });
              counts.creados++;
            } catch (error) {
              counts.errores++;
              const errorMessage = error instanceof Error ? error.message : String(error);
              erroresDetalle.push({ faltante_id: f.id, error: errorMessage });
              logger.warn('BACKFILL_ROW_ERROR', {
                requestId,
                faltante_id: f.id,
                error: errorMessage,
              });
            }
          }
        }
      } catch (error) {
        // Batch request itself failed (timeout, network, etc.) — fall back to per-row
        const batchErrMsg = error instanceof Error ? error.message : String(error);
        logger.warn('BACKFILL_BATCH_ERROR', { requestId, error: batchErrMsg });

        for (const { faltante: f, payload } of payloads) {
          try {
            const createResponse = await fetch(
              `${supabaseUrl}/rest/v1/tareas_pendientes`,
              {
                method: 'POST',
                headers: { ...headers, Prefer: 'return=representation' },
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
                body: JSON.stringify(payload),
              },
            );

            if (!createResponse.ok) {
              const errorBody = await createResponse.text();
              throw new Error(`HTTP ${createResponse.status}: ${errorBody}`);
            }

            const created = await createResponse.json();
            const tareaId = Array.isArray(created) ? created[0]?.id : created?.id;
            creados.push({ faltante_id: f.id, tarea_id: tareaId ?? 'unknown' });
            counts.creados++;
          } catch (rowError) {
            counts.errores++;
            const errorMessage = rowError instanceof Error ? rowError.message : String(rowError);
            erroresDetalle.push({ faltante_id: f.id, error: errorMessage });
            logger.warn('BACKFILL_ROW_ERROR', {
              requestId,
              faltante_id: f.id,
              error: errorMessage,
            });
          }
        }
      }
    }

    logger.info('BACKFILL_COMPLETE', { requestId, ...counts });

    return ok(
      {
        ...counts,
        dry_run: false,
        creados_detalle: creados,
        errores_detalle: erroresDetalle.length > 0 ? erroresDetalle : undefined,
        timestamp: new Date().toISOString(),
      },
      200,
      corsHeaders,
      { requestId },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('BACKFILL_FATAL_ERROR', { requestId, error: errorMessage });

    return fail(
      'BACKFILL_ERROR',
      errorMessage,
      500,
      corsHeaders,
      { requestId },
    );
  }
});
