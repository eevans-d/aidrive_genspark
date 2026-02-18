/**
 * Router de Tareas - api-minimarket
 * Handlers para gestión de tareas
 * @module api-minimarket/routers/tareas
 */

import { queryTable, insertTable, updateTable, fetchWithParams } from '../helpers/supabase.ts';
import { isUuid, sanitizeTextParam, VALID_TAREA_PRIORIDADES } from '../helpers/validation.ts';
import { parsePagination } from '../helpers/pagination.ts';
import { BASE_ROLES } from '../helpers/auth.ts';
import type { RouteHandler } from './types.ts';

// POST /tareas
export const createTareaHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, parseJsonBody, user, logAudit } = ctx;
        checkRole(['admin', 'deposito']);

        const bodyResult = await parseJsonBody();
        if (bodyResult instanceof Response) return bodyResult;

        const body = bodyResult as Record<string, unknown>;
        const { titulo, descripcion, prioridad, fecha_vencimiento, asignado_a } = body;

        if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
                return respondFail('VALIDATION_ERROR', 'titulo es requerido', 400);
        }

        if (prioridad && !VALID_TAREA_PRIORIDADES.has(String(prioridad))) {
                return respondFail('VALIDATION_ERROR', `prioridad debe ser: ${[...VALID_TAREA_PRIORIDADES].join(', ')}`, 400);
        }

        const tarea: Record<string, unknown> = {
                titulo: titulo.trim(),
                estado: 'pendiente',
                creado_por: user!.id,
                fecha_creacion: new Date().toISOString(),
        };

        if (descripcion) {
                tarea.descripcion = sanitizeTextParam(String(descripcion));
        }

        if (prioridad) {
                tarea.prioridad = String(prioridad);
        }

        if (fecha_vencimiento) {
                tarea.fecha_vencimiento = String(fecha_vencimiento);
        }

        if (asignado_a && isUuid(String(asignado_a))) {
                tarea.asignado_a = String(asignado_a);
        }

        const result = await insertTable(supabaseUrl, 'tareas', requestHeaders(), tarea);
        const tareaCreada = (result as unknown[])[0] as Record<string, unknown>;

        await logAudit(
                'tarea_creada',
                'tareas',
                String(tareaCreada.id),
                { titulo: tarea.titulo, prioridad: tarea.prioridad },
                'info'
        );

        return respondOk(tareaCreada, 201, { message: 'Tarea creada exitosamente' });
};

// PUT /tareas/:id/completar
export const completarTareaHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, user, logAudit, pathParams } = ctx;
        const id = pathParams?.id;

        checkRole(['admin', 'deposito']);

        if (!id || !isUuid(id)) {
                return respondFail('VALIDATION_ERROR', 'id de tarea invalido', 400);
        }

        const tarea = await updateTable(supabaseUrl, 'tareas', id, requestHeaders(), {
                estado: 'completada',
                fecha_completado: new Date().toISOString(),
                completado_por: user!.id,
        });

        if ((tarea as unknown[]).length === 0) {
                return respondFail('NOT_FOUND', 'Tarea no encontrada', 404);
        }

        const tareaCompletada = (tarea as unknown[])[0] as Record<string, unknown>;

        await logAudit(
                'tarea_completada',
                'tareas',
                id,
                { titulo: tareaCompletada.titulo },
                'info'
        );

        return respondOk(tareaCompletada, 200, { message: 'Tarea completada exitosamente' });
};

// PUT /tareas/:id/cancelar
export const cancelarTareaHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, user, logAudit, pathParams } = ctx;
        const id = pathParams?.id;

        checkRole(['admin']);

        if (!id || !isUuid(id)) {
                return respondFail('VALIDATION_ERROR', 'id de tarea invalido', 400);
        }

        const tarea = await updateTable(supabaseUrl, 'tareas', id, requestHeaders(), {
                estado: 'cancelada',
                fecha_cancelado: new Date().toISOString(),
                cancelado_por: user!.id,
        });

        if ((tarea as unknown[]).length === 0) {
                return respondFail('NOT_FOUND', 'Tarea no encontrada', 404);
        }

        const tareaCancelada = (tarea as unknown[])[0] as Record<string, unknown>;

        await logAudit(
                'tarea_cancelada',
                'tareas',
                id,
                { titulo: tareaCancelada.titulo },
                'warning'
        );

        return respondOk(tareaCancelada, 200, { message: 'Tarea cancelada' });
};

// GET /reportes/efectividad-tareas
export const getEfectividadTareasHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, checkRole } = ctx;
        checkRole(BASE_ROLES);

        const tareas = await queryTable(
                supabaseUrl,
                'tareas',
                requestHeaders(),
                {},
                'id,estado,prioridad,fecha_creacion,fecha_completado',
                { limit: 1000 }
        );

        interface TareaStats {
                id: string;
                estado: string;
                prioridad: string;
                fecha_creacion: string;
                fecha_completado?: string;
        }

        const tareasTyped = tareas as TareaStats[];
        const total = tareasTyped.length;
        const completadas = tareasTyped.filter(t => t.estado === 'completada').length;
        const pendientes = tareasTyped.filter(t => t.estado === 'pendiente').length;
        const canceladas = tareasTyped.filter(t => t.estado === 'cancelada').length;
        const efectividad = total > 0 ? Math.round((completadas / total) * 100) : 0;

        const porPrioridad = {
                urgente: tareasTyped.filter(t => t.prioridad === 'urgente').length,
                alta: tareasTyped.filter(t => t.prioridad === 'alta').length,
                media: tareasTyped.filter(t => t.prioridad === 'media').length,
                baja: tareasTyped.filter(t => t.prioridad === 'baja').length,
        };

        return respondOk({
                total,
                completadas,
                pendientes,
                canceladas,
                efectividad_porcentaje: efectividad,
                por_prioridad: porPrioridad,
        });
};
