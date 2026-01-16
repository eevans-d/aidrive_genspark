import { createLogger } from '../_shared/logger.ts';
import {
    parseAllowedOrigins,
    validateOrigin,
    handleCors,
    createCorsErrorResponse,
} from '../_shared/cors.ts';
import { ok, fail } from '../_shared/response.ts';

const logger = createLogger('notificaciones-tareas');

Deno.serve(async (req) => {
    const url = new URL(req.url);
    const requestId =
        req.headers.get('x-request-id') || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const jobId = 'notificaciones-tareas';
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
    const corsResult = validateOrigin(req, allowedOrigins, { 'x-request-id': requestId });
    let responseHeaders = corsResult.headers;

    if (!corsResult.allowed) {
        logger.warn('CORS_BLOCKED', { requestId, origin: corsResult.origin });
        return createCorsErrorResponse(requestId, responseHeaders);
    }

    const preflightResponse = handleCors(req, responseHeaders);
    if (preflightResponse) return preflightResponse;

    const requestLog = {
        requestId,
        jobId,
        runId,
        method: req.method,
        path: url.pathname,
    };

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            return fail(
                'CONFIG_ERROR',
                'Configuración de Supabase faltante',
                500,
                responseHeaders,
                { requestId }
            );
        }

        const commonHeaders = {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
        };

        const refreshStatus: { refreshed: boolean; error: string | null } = {
            refreshed: false,
            error: null,
        };

        try {
            const refreshResponse = await fetch(
                `${supabaseUrl}/rest/v1/rpc/refresh_tareas_metricas`,
                {
                    method: 'POST',
                    headers: commonHeaders,
                },
            );

            if (!refreshResponse.ok) {
                const errorBody = await refreshResponse.text();
                throw new Error(`Refresh tareas_metricas falló: ${errorBody}`);
            }

            refreshStatus.refreshed = true;
        } catch (error) {
            refreshStatus.error = error instanceof Error ? error.message : String(error);
        }

        const tareasResponse = await fetch(
            `${supabaseUrl}/rest/v1/tareas_pendientes?estado=eq.pendiente&select=*`,
            {
                headers: commonHeaders,
            },
        );

        if (!tareasResponse.ok) {
            const errorBody = await tareasResponse.text();
            throw new Error(`Error al obtener tareas pendientes: ${errorBody}`);
        }

        const tareas = await tareasResponse.json();
        const notificacionesEnviadas: Array<{ tarea: string; asignado_a: string | null; prioridad: string }> = [];
        const errores: string[] = [];

        for (const tarea of tareas) {
            try {
                const dosHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

                const ultimaNotifResponse = await fetch(
                    `${supabaseUrl}/rest/v1/notificaciones_tareas?tarea_id=eq.${tarea.id}&fecha_envio=gte.${dosHorasAtras}&order=fecha_envio.desc&limit=1`,
                    {
                        headers: commonHeaders,
                    },
                );

                if (!ultimaNotifResponse.ok) {
                    const errorBody = await ultimaNotifResponse.text();
                    throw new Error(`Error al verificar notificaciones: ${errorBody}`);
                }

                const ultimasNotif = await ultimaNotifResponse.json();

                if (ultimasNotif.length === 0) {
                    const mensaje = `Recordatorio: Tarea "${tarea.titulo}" asignada a ${tarea.asignada_a_nombre || 'ti'}. Prioridad: ${tarea.prioridad}. Vence: ${tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento).toLocaleString('es-AR') : 'Sin fecha'}`;

                    const notifResponse = await fetch(
                        `${supabaseUrl}/rest/v1/notificaciones_tareas`,
                        {
                            method: 'POST',
                            headers: commonHeaders,
                            body: JSON.stringify({
                                tarea_id: tarea.id,
                                tipo: 'recordatorio_automatico',
                                mensaje,
                                usuario_destino_nombre: tarea.asignada_a_nombre,
                                usuario_destino_id: tarea.asignada_a_id,
                                leido: false,
                            }),
                        },
                    );

                    if (notifResponse.ok) {
                        notificacionesEnviadas.push({
                            tarea: tarea.titulo,
                            asignado_a: tarea.asignada_a_nombre ?? null,
                            prioridad: tarea.prioridad,
                        });
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                errores.push(`Error procesando tarea ${tarea.titulo}: ${errorMessage}`);
            }
        }

        return ok(
            {
                tareas_procesadas: tareas.length,
                notificaciones_enviadas: notificacionesEnviadas.length,
                notificaciones: notificacionesEnviadas,
                tareas_metricas_refresh: refreshStatus,
                errores,
                timestamp: new Date().toISOString(),
            },
            200,
            responseHeaders,
            { requestId },
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('NOTIFICACIONES_ERROR', { ...requestLog, error: errorMessage });

        return fail(
            'NOTIFICATION_ERROR',
            errorMessage,
            500,
            responseHeaders,
            { requestId },
        );
    }
});
