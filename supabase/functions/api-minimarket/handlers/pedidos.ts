// ============================================================================
// HANDLER: Pedidos
// ============================================================================
// CRUD de pedidos de clientes
// Incluye transcripción de audio con Web Speech API
// ============================================================================

import { fail, ok } from '../../_shared/response.ts';
import { toAppError } from '../../_shared/errors.ts';
import { createLogger } from '../../_shared/logger.ts';
import {
        queryTable,
        queryTableWithCount,
        insertTable,
        updateTable,
        callFunction,
} from '../helpers/supabase.ts';
import { isUuid, sanitizeTextParam } from '../helpers/validation.ts';

const logger = createLogger('api-pedidos');

// Type for headers - using Record for compatibility
type ApiHeaders = Record<string, string>;

// ============================================================================
// TYPES
// ============================================================================

interface PedidoItem {
        producto_id?: string;
        producto_nombre: string;
        producto_sku?: string;
        cantidad: number;
        precio_unitario: number;
        observaciones?: string;
}

interface CreatePedidoPayload {
        cliente_nombre: string;
        cliente_telefono?: string;
        cliente_id?: string;
        tipo_entrega: 'retiro' | 'domicilio';
        direccion_entrega?: string;
        edificio?: string;
        piso?: string;
        departamento?: string;
        horario_entrega_preferido?: string;
        observaciones?: string;
        items: PedidoItem[];
        transcripcion_texto?: string;
}

// ============================================================================
// LISTAR PEDIDOS (con filtros)
// ============================================================================

export async function handleListarPedidos(
        supabaseUrl: string,
        headers: ApiHeaders,
        responseHeaders: Record<string, string>,
        requestId: string,
        params: {
                estado?: string;
                estado_pago?: string;
                fecha_desde?: string;
                fecha_hasta?: string;
                limit: number;
                offset: number;
        }
): Promise<Response> {
        try {
                const queryParams = new URLSearchParams();
                queryParams.set('select', '*,detalle_pedidos(*)');
                queryParams.set('order', 'fecha_pedido.desc');
                queryParams.set('limit', String(params.limit));
                queryParams.set('offset', String(params.offset));

                if (params.estado) {
                        queryParams.append('estado', `eq.${params.estado}`);
                }
                if (params.estado_pago) {
                        queryParams.append('estado_pago', `eq.${params.estado_pago}`);
                }
                if (params.fecha_desde) {
                        queryParams.append('fecha_pedido', `gte.${params.fecha_desde}`);
                }
                if (params.fecha_hasta) {
                        queryParams.append('fecha_pedido', `lte.${params.fecha_hasta}`);
                }

                const url = `${supabaseUrl}/rest/v1/pedidos?${queryParams.toString()}`;
                const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                                ...headers,
                                'Prefer': 'count=exact',
                        } as HeadersInit,
                });

                if (!response.ok) {
                        const error = await response.text();
                        throw toAppError(new Error(error), 'DB_ERROR', response.status);
                }

                const pedidos = await response.json();
                const count = response.headers.get('content-range')?.split('/')[1] || pedidos.length;

                return ok(pedidos, 200, responseHeaders, {
                        requestId,
                        extra: { count: Number(count) },
                });
        } catch (error) {
                logger.error('LISTAR_PEDIDOS_ERROR', { requestId, error });
                throw error;
        }
}

// ============================================================================
// OBTENER PEDIDO POR ID
// ============================================================================

export async function handleObtenerPedido(
        supabaseUrl: string,
        headers: Record<string, string>,
        responseHeaders: Record<string, string>,
        requestId: string,
        pedidoId: string
): Promise<Response> {
        try {
                const queryParams = new URLSearchParams();
                queryParams.set('select', '*,detalle_pedidos(*),clientes(*)');
                queryParams.set('id', `eq.${pedidoId}`);

                const url = `${supabaseUrl}/rest/v1/pedidos?${queryParams.toString()}`;
                const response = await fetch(url, { headers });

                if (!response.ok) {
                        const error = await response.text();
                        throw toAppError(new Error(error), 'DB_ERROR', response.status);
                }

                const pedidos = await response.json();
                if (pedidos.length === 0) {
                        return fail('NOT_FOUND', 'Pedido no encontrado', 404, responseHeaders, { requestId });
                }

                return ok(pedidos[0], 200, responseHeaders, { requestId });
        } catch (error) {
                logger.error('OBTENER_PEDIDO_ERROR', { requestId, pedidoId, error });
                throw error;
        }
}

// ============================================================================
// CREAR PEDIDO
// ============================================================================

export async function handleCrearPedido(
        supabaseUrl: string,
        headers: Record<string, string>,
        responseHeaders: Record<string, string>,
        requestId: string,
        payload: CreatePedidoPayload
): Promise<Response> {
        try {
                // Validar payload
                if (!payload.cliente_nombre?.trim()) {
                        return fail('VALIDATION_ERROR', 'cliente_nombre es requerido', 400, responseHeaders, { requestId });
                }

                if (!payload.items || payload.items.length === 0) {
                        return fail('VALIDATION_ERROR', 'Se requiere al menos un item en el pedido', 400, responseHeaders, { requestId });
                }

                if (payload.tipo_entrega !== 'retiro' && payload.tipo_entrega !== 'domicilio') {
                        return fail('VALIDATION_ERROR', 'tipo_entrega debe ser "retiro" o "domicilio"', 400, responseHeaders, { requestId });
                }

                if (payload.tipo_entrega === 'domicilio' && !payload.direccion_entrega?.trim()) {
                        return fail('VALIDATION_ERROR', 'direccion_entrega es requerida para envío a domicilio', 400, responseHeaders, { requestId });
                }

                // Validar items
                for (let i = 0; i < payload.items.length; i++) {
                        const item = payload.items[i];
                        if (!item.producto_nombre?.trim()) {
                                return fail('VALIDATION_ERROR', `Item ${i + 1}: producto_nombre es requerido`, 400, responseHeaders, { requestId });
                        }
                        if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
                                return fail('VALIDATION_ERROR', `Item ${i + 1}: cantidad debe ser mayor a 0`, 400, responseHeaders, { requestId });
                        }
                        if (typeof item.precio_unitario !== 'number' || item.precio_unitario < 0) {
                                return fail('VALIDATION_ERROR', `Item ${i + 1}: precio_unitario inválido`, 400, responseHeaders, { requestId });
                        }
                }

                // Usar stored procedure para transacción atómica
                const result = await callFunction(supabaseUrl, 'sp_crear_pedido', headers, {
                        p_cliente_nombre: payload.cliente_nombre.trim(),
                        p_tipo_entrega: payload.tipo_entrega,
                        p_direccion_entrega: payload.direccion_entrega?.trim() || null,
                        p_edificio: payload.edificio?.trim() || null,
                        p_piso: payload.piso?.trim() || null,
                        p_departamento: payload.departamento?.trim() || null,
                        p_horario_preferido: payload.horario_entrega_preferido?.trim() || null,
                        p_observaciones: payload.observaciones?.trim() || null,
                        p_cliente_telefono: payload.cliente_telefono?.trim() || null,
                        p_cliente_id: payload.cliente_id || null,
                        p_items: JSON.stringify(payload.items),
                });

                const resultData = result as { success: boolean; pedido_id?: string; numero_pedido?: number; error?: string };

                if (!resultData.success) {
                        return fail('CREATE_ERROR', resultData.error || 'Error al crear pedido', 500, responseHeaders, { requestId });
                }

                logger.info('PEDIDO_CREADO', {
                        requestId,
                        pedido_id: resultData.pedido_id,
                        numero_pedido: resultData.numero_pedido,
                        items_count: payload.items.length,
                });

                return ok(resultData, 201, responseHeaders, {
                        requestId,
                        message: 'Pedido creado exitosamente',
                });
        } catch (error) {
                logger.error('CREAR_PEDIDO_ERROR', { requestId, error });
                throw error;
        }
}

// ============================================================================
// ACTUALIZAR ESTADO DEL PEDIDO
// ============================================================================

export async function handleActualizarEstadoPedido(
        supabaseUrl: string,
        headers: Record<string, string>,
        responseHeaders: Record<string, string>,
        requestId: string,
        pedidoId: string,
        estado: string,
        userId: string
): Promise<Response> {
        const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];

        if (!estadosValidos.includes(estado)) {
                return fail(
                        'VALIDATION_ERROR',
                        `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`,
                        400,
                        responseHeaders,
                        { requestId }
                );
        }

        try {
                const updates: Record<string, unknown> = {
                        estado,
                        updated_at: new Date().toISOString(),
                };

                // Campos específicos según estado
                if (estado === 'preparando') {
                        updates.preparado_por_id = userId;
                } else if (estado === 'listo') {
                        updates.fecha_preparado = new Date().toISOString();
                } else if (estado === 'entregado') {
                        updates.fecha_entregado = new Date().toISOString();
                        updates.entregado_por_id = userId;
                }

                const result = await updateTable(supabaseUrl, 'pedidos', pedidoId, headers, updates);

                if ((result as unknown[]).length === 0) {
                        return fail('NOT_FOUND', 'Pedido no encontrado', 404, responseHeaders, { requestId });
                }

                logger.info('PEDIDO_ESTADO_ACTUALIZADO', { requestId, pedidoId, estado });

                return ok((result as unknown[])[0], 200, responseHeaders, {
                        requestId,
                        message: `Pedido actualizado a estado: ${estado}`,
                });
        } catch (error) {
                logger.error('ACTUALIZAR_ESTADO_PEDIDO_ERROR', { requestId, pedidoId, estado, error });
                throw error;
        }
}

// ============================================================================
// ACTUALIZAR ITEM DEL PEDIDO (marcar como preparado)
// ============================================================================

export async function handleMarcarItemPreparado(
        supabaseUrl: string,
        headers: Record<string, string>,
        responseHeaders: Record<string, string>,
        requestId: string,
        itemId: string,
        preparado: boolean,
        userId: string
): Promise<Response> {
        try {
                const updates: Record<string, unknown> = {
                        preparado,
                };

                if (preparado) {
                        updates.fecha_preparado = new Date().toISOString();
                        updates.preparado_por_id = userId;
                } else {
                        updates.fecha_preparado = null;
                        updates.preparado_por_id = null;
                }

                const result = await updateTable(supabaseUrl, 'detalle_pedidos', itemId, headers, updates);

                if ((result as unknown[]).length === 0) {
                        return fail('NOT_FOUND', 'Item de pedido no encontrado', 404, responseHeaders, { requestId });
                }

                return ok((result as unknown[])[0], 200, responseHeaders, {
                        requestId,
                        message: preparado ? 'Item marcado como preparado' : 'Item desmarcado',
                });
        } catch (error) {
                logger.error('MARCAR_ITEM_ERROR', { requestId, itemId, preparado, error });
                throw error;
        }
}

// ============================================================================
// ACTUALIZAR PAGO DEL PEDIDO
// ============================================================================

export async function handleActualizarPagoPedido(
        supabaseUrl: string,
        headers: Record<string, string>,
        responseHeaders: Record<string, string>,
        requestId: string,
        pedidoId: string,
        monto_pagado: number
): Promise<Response> {
        try {
                // Obtener pedido actual
                const pedidos = await queryTable(supabaseUrl, 'pedidos', headers, { id: pedidoId }, 'id,monto_total');
                if (pedidos.length === 0) {
                        return fail('NOT_FOUND', 'Pedido no encontrado', 404, responseHeaders, { requestId });
                }

                const pedido = pedidos[0] as { monto_total: number };
                const montoTotal = Number(pedido.monto_total) || 0;

                let estado_pago: string;
                if (monto_pagado >= montoTotal) {
                        estado_pago = 'pagado';
                } else if (monto_pagado > 0) {
                        estado_pago = 'parcial';
                } else {
                        estado_pago = 'pendiente';
                }

                const result = await updateTable(supabaseUrl, 'pedidos', pedidoId, headers, {
                        monto_pagado,
                        estado_pago,
                        updated_at: new Date().toISOString(),
                });

                logger.info('PEDIDO_PAGO_ACTUALIZADO', { requestId, pedidoId, monto_pagado, estado_pago });

                return ok((result as unknown[])[0], 200, responseHeaders, {
                        requestId,
                        message: `Pago registrado. Estado: ${estado_pago}`,
                });
        } catch (error) {
                logger.error('ACTUALIZAR_PAGO_ERROR', { requestId, pedidoId, monto_pagado, error });
                throw error;
        }
}
