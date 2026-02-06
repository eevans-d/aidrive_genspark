/**
 * API Client for minimarket gateway
 * @description Handles authenticated requests to the api-minimarket gateway with timeout support
 */

import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '/api-minimarket';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.VITE_USE_MOCKS === '1';

/** Default request timeout in milliseconds (30 seconds) */
const DEFAULT_TIMEOUT_MS = 30_000;

export interface ApiResponse<T = unknown> {
        success: boolean;
        data?: T;
        error?: {
                code: string;
                message: string;
                details?: unknown;
        };
        meta?: {
                total?: number;
                page?: number;
                limit?: number;
        };
}

export class ApiError extends Error {
        constructor(
                public code: string,
                message: string,
                public status: number,
                public details?: unknown
        ) {
                super(message);
                this.name = 'ApiError';
        }
}

/**
 * Error thrown when a request times out
 */
export class TimeoutError extends Error {
        constructor(
                public timeoutMs: number,
                public endpoint: string
        ) {
                super(`La solicitud a ${endpoint} excedió el tiempo límite (${timeoutMs / 1000}s). Por favor, intente de nuevo.`);
                this.name = 'TimeoutError';
        }
}

const ensureArray = <T>(value: unknown): T[] => {
        return Array.isArray(value) ? (value as T[]) : [];
};

/**
 * Get current user's JWT token for API authentication
 */
async function getAuthToken(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'signal'> {
        /** Request timeout in milliseconds. Defaults to 30s. Set to 0 to disable. */
        timeoutMs?: number;
        /** Custom AbortSignal for manual cancellation */
        signal?: AbortSignal;
}

/**
 * Make authenticated request to the gateway with timeout support
 */
async function apiRequest<T>(
        endpoint: string,
        options: ApiRequestOptions = {}
): Promise<T> {
        const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...fetchOptions } = options;

        const token = await getAuthToken();

        if (!token) {
                throw new ApiError('AUTH_REQUIRED', 'Authentication required', 401);
        }

        const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(fetchOptions.headers as Record<string, string> || {}),
        };

        // Setup timeout with AbortController
        const controller = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        // Combine external signal with timeout signal
        const handleExternalAbort = () => controller.abort();
        if (externalSignal) {
                externalSignal.addEventListener('abort', handleExternalAbort);
        }

        if (timeoutMs > 0) {
                timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        }

        try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                        ...fetchOptions,
                        headers,
                        signal: controller.signal,
                });

                const json: ApiResponse<T> = await response.json();

                if (!response.ok || !json.success) {
                        throw new ApiError(
                                json.error?.code || 'API_ERROR',
                                json.error?.message || 'Request failed',
                                response.status,
                                json.error?.details
                        );
                }

                return json.data as T;
        } catch (error) {
                // Handle abort/timeout
                if (error instanceof Error && error.name === 'AbortError') {
                        if (externalSignal?.aborted) {
                                throw new ApiError('REQUEST_CANCELLED', 'La solicitud fue cancelada', 0);
                        }
                        throw new TimeoutError(timeoutMs, endpoint);
                }
                throw error;
        } finally {
                // Cleanup
                if (timeoutId !== undefined) {
                        clearTimeout(timeoutId);
                }
                if (externalSignal) {
                        externalSignal.removeEventListener('abort', handleExternalAbort);
                }
        }
}

export interface DropdownItem {
        id: string;
        nombre: string;
        codigo_barras?: string | null;
}

// =============================================================================
// PRODUCTOS API
// =============================================================================

export const productosApi = {
        async dropdown(): Promise<DropdownItem[]> {
                return apiRequest<DropdownItem[]>('/productos/dropdown');
        },
};

// =============================================================================
// PROVEEDORES API
// =============================================================================

export const proveedoresApi = {
        async dropdown(): Promise<DropdownItem[]> {
                return apiRequest<DropdownItem[]>('/proveedores/dropdown');
        },
};

// =============================================================================
// TAREAS API
// =============================================================================

export interface CreateTareaParams {
        titulo: string;
        descripcion?: string;
        asignada_a_nombre?: string;
        prioridad: 'baja' | 'normal' | 'urgente';
        fecha_vencimiento?: string | null;
}

export interface TareaResponse {
        id: string;
        titulo: string;
        descripcion?: string;
        estado: string;
        prioridad: string;
        asignada_a_nombre?: string;
        fecha_vencimiento?: string;
        created_at: string;
}

export const tareasApi = {
        /**
         * Create a new task
         */
        async create(params: CreateTareaParams): Promise<TareaResponse> {
                if (USE_MOCKS) {
                        const { data, error } = await supabase
                                .from('tareas_pendientes')
                                .insert({
                                        titulo: params.titulo,
                                        descripcion: params.descripcion ?? null,
                                        asignada_a_nombre: params.asignada_a_nombre ?? null,
                                        prioridad: params.prioridad,
                                        estado: 'pendiente',
                                        fecha_vencimiento: params.fecha_vencimiento ?? null
                                });

                        const rows = ensureArray<TareaResponse>(data);
                        if (error || rows.length === 0) {
                                throw new ApiError('MOCK_ERROR', error?.message || 'Mock insert failed', 500);
                        }

                        const tarea = rows[0] as TareaResponse;
                        return {
                                id: tarea.id,
                                titulo: tarea.titulo,
                                descripcion: tarea.descripcion,
                                estado: tarea.estado,
                                prioridad: tarea.prioridad,
                                asignada_a_nombre: tarea.asignada_a_nombre,
                                fecha_vencimiento: tarea.fecha_vencimiento,
                                created_at: tarea.created_at
                        };
                }

                return apiRequest<TareaResponse>('/tareas', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },

        /**
         * Mark task as completed
         */
        async completar(id: string): Promise<TareaResponse> {
                if (USE_MOCKS) {
                        const { data, error } = await supabase
                                .from('tareas_pendientes')
                                .update({
                                        estado: 'completada',
                                        fecha_completada: new Date().toISOString(),
                                        completada_por_nombre: 'Mock User'
                                })
                                .eq('id', id);

                        const rows = ensureArray<TareaResponse>(data);
                        if (error || rows.length === 0) {
                                throw new ApiError('MOCK_ERROR', error?.message || 'Mock update failed', 500);
                        }

                        const tarea = rows[0] as TareaResponse;
                        return {
                                id: tarea.id,
                                titulo: tarea.titulo,
                                descripcion: tarea.descripcion,
                                estado: tarea.estado,
                                prioridad: tarea.prioridad,
                                asignada_a_nombre: tarea.asignada_a_nombre,
                                fecha_vencimiento: tarea.fecha_vencimiento,
                                created_at: tarea.created_at
                        };
                }

                return apiRequest<TareaResponse>(`/tareas/${id}/completar`, {
                        method: 'PUT',
                });
        },

        /**
         * Cancel task with reason
         */
        async cancelar(id: string, razon: string): Promise<TareaResponse> {
                if (USE_MOCKS) {
                        const { data, error } = await supabase
                                .from('tareas_pendientes')
                                .update({
                                        estado: 'cancelada',
                                        razon_cancelacion: razon,
                                        fecha_cancelada: new Date().toISOString(),
                                        cancelada_por_nombre: 'Mock User'
                                })
                                .eq('id', id);

                        const rows = ensureArray<TareaResponse>(data);
                        if (error || rows.length === 0) {
                                throw new ApiError('MOCK_ERROR', error?.message || 'Mock cancel failed', 500);
                        }

                        const tarea = rows[0] as TareaResponse;
                        return {
                                id: tarea.id,
                                titulo: tarea.titulo,
                                descripcion: tarea.descripcion,
                                estado: tarea.estado,
                                prioridad: tarea.prioridad,
                                asignada_a_nombre: tarea.asignada_a_nombre,
                                fecha_vencimiento: tarea.fecha_vencimiento,
                                created_at: tarea.created_at
                        };
                }

                return apiRequest<TareaResponse>(`/tareas/${id}/cancelar`, {
                        method: 'PUT',
                        body: JSON.stringify({ razon }),
                });
        },
};

// =============================================================================
// DEPOSITO API
// =============================================================================

export interface MovimientoParams {
        producto_id: string;
        tipo: 'entrada' | 'salida';
        cantidad: number;
        motivo?: string;
        proveedor_id?: string | null;
        observaciones?: string | null;
}

export interface MovimientoResponse {
        id: string;
        producto_id: string;
        tipo_movimiento: string;
        cantidad: number;
        fecha_movimiento: string;
}

export const depositoApi = {
        /**
         * Register inventory movement
         */
        async movimiento(params: MovimientoParams): Promise<MovimientoResponse> {
                return apiRequest<MovimientoResponse>('/deposito/movimiento', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },
};

// =============================================================================
// PEDIDOS API
// =============================================================================

export interface PedidoItem {
        id?: string;
        producto_id?: string;
        producto_nombre: string;
        producto_sku?: string;
        cantidad: number;
        precio_unitario: number;
        subtotal?: number;
        preparado?: boolean;
        observaciones?: string;
}

export interface PedidoResponse {
        id: string;
        numero_pedido: number;
        cliente_id?: string;
        cliente_nombre: string;
        cliente_telefono?: string;
        tipo_entrega: 'retiro' | 'domicilio';
        direccion_entrega?: string;
        edificio?: string;
        piso?: string;
        departamento?: string;
        horario_entrega_preferido?: string;
        estado: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
        estado_pago: 'pendiente' | 'pagado' | 'parcial';
        monto_total: number;
        monto_pagado: number;
        observaciones?: string;
        fecha_pedido: string;
        fecha_entrega_estimada?: string;
        fecha_entregado?: string;
        detalle_pedidos?: PedidoItem[];
}

export interface CreatePedidoParams {
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
        items: Omit<PedidoItem, 'id' | 'subtotal' | 'preparado'>[];
}

export interface UpdateEstadoParams {
        id: string;
        estado: PedidoResponse['estado'];
}

export interface UpdatePagoParams {
        id: string;
        monto_pagado: number;
}

export interface UpdateItemPreparadoParams {
        itemId: string;
        preparado: boolean;
}

export interface PedidosListResponse {
        pedidos: PedidoResponse[];
        total: number;
}

export const pedidosApi = {
        /**
         * Listar pedidos con filtros
         */
        async list(params: Record<string, string> = {}): Promise<PedidosListResponse> {
                const queryString = new URLSearchParams(params).toString();
                const endpoint = queryString ? `/pedidos?${queryString}` : '/pedidos';
                const pedidos = await apiRequest<PedidoResponse[]>(endpoint);
                return { pedidos, total: pedidos.length };
        },

        /**
         * Obtener pedido por ID
         */
        async get(id: string): Promise<PedidoResponse> {
                return apiRequest<PedidoResponse>(`/pedidos/${id}`);
        },

        /**
         * Crear nuevo pedido
         */
        async create(params: CreatePedidoParams): Promise<{ pedido_id: string; numero_pedido: number }> {
                return apiRequest<{ pedido_id: string; numero_pedido: number }>('/pedidos', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },

        /**
         * Actualizar estado del pedido
         */
        async updateEstado(id: string, estado: PedidoResponse['estado']): Promise<PedidoResponse> {
                return apiRequest<PedidoResponse>(`/pedidos/${id}/estado`, {
                        method: 'PUT',
                        body: JSON.stringify({ estado }),
                });
        },

        /**
         * Registrar pago
         */
        async updatePago(id: string, monto_pagado: number): Promise<PedidoResponse> {
                return apiRequest<PedidoResponse>(`/pedidos/${id}/pago`, {
                        method: 'PUT',
                        body: JSON.stringify({ monto_pagado }),
                });
        },

        /**
         * Marcar item como preparado/no preparado
         */
        async updateItemPreparado(itemId: string, preparado: boolean): Promise<PedidoItem> {
                return apiRequest<PedidoItem>(`/pedidos/items/${itemId}/preparado`, {
                        method: 'PUT',
                        body: JSON.stringify({ preparado }),
                });
        },
};

export default {
        tareas: tareasApi,
        deposito: depositoApi,
        productos: productosApi,
        proveedores: proveedoresApi,
        pedidos: pedidosApi,
};
