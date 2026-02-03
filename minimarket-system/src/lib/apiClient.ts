/**
 * API Client for minimarket gateway
 * @description Handles authenticated requests to the api-minimarket gateway
 */

import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '/api-minimarket';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.VITE_USE_MOCKS === '1';

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

/**
 * Make authenticated request to the gateway
 */
async function apiRequest<T>(
        endpoint: string,
        options: RequestInit = {}
): Promise<T> {
        const token = await getAuthToken();

        if (!token) {
                throw new ApiError('AUTH_REQUIRED', 'Authentication required', 401);
        }

        const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers as Record<string, string> || {}),
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
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

export default {
        tareas: tareasApi,
        deposito: depositoApi,
        productos: productosApi,
        proveedores: proveedoresApi,
};
