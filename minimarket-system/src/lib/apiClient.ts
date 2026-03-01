/**
 * API Client for minimarket gateway
 * @description Handles authenticated requests to the api-minimarket gateway with timeout support
 */

import { supabase } from './supabase';
import { authEvents } from './authEvents';

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
                public details?: unknown,
                public requestId?: string
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
                public endpoint: string,
                public requestId?: string
        ) {
                super(`La solicitud a ${endpoint} excedió el tiempo límite (${timeoutMs / 1000}s). Por favor, intente de nuevo.`);
                this.name = 'TimeoutError';
        }
}

/**
 * Generate a unique request ID for correlation across frontend and backend.
 */
function generateRequestId(): string {
        try {
                return crypto.randomUUID();
        } catch {
                return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
                authEvents.emit('auth_required');
                throw new ApiError('AUTH_REQUIRED', 'Authentication required', 401);
        }

        const requestId = generateRequestId();

        const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-request-id': requestId,
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

                // Prefer server's x-request-id (may differ if gateway regenerated)
                const serverRequestId = response.headers.get('x-request-id') || requestId;

                const json: ApiResponse<T> = await response.json();

                if (!response.ok || !json.success) {
                        if (response.status === 401) {
                                authEvents.emit('auth_required');
                        }
                        throw new ApiError(
                                json.error?.code || 'API_ERROR',
                                json.error?.message || 'Request failed',
                                response.status,
                                json.error?.details,
                                serverRequestId
                        );
                }

                return json.data as T;
        } catch (error) {
                // Re-throw ApiError as-is (already has requestId)
                if (error instanceof ApiError) {
                        throw error;
                }
                // Handle abort/timeout
                if (error instanceof Error && error.name === 'AbortError') {
                        if (externalSignal?.aborted) {
                                throw new ApiError('REQUEST_CANCELLED', 'La solicitud fue cancelada', 0, undefined, requestId);
                        }
                        throw new TimeoutError(timeoutMs, endpoint, requestId);
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
        sku?: string | null;
        codigo_barras?: string | null;
        precio_actual?: number | null;
}

// =============================================================================
// PRODUCTOS API
// =============================================================================

export interface CreateProductoParams {
        nombre: string;
        sku?: string | null;
        codigo_barras?: string | null;
        categoria_id?: string | null;
        marca?: string | null;
        contenido_neto?: string | null;
        precio_costo?: number | null;
        margen_ganancia?: number | null;
}

export const productosApi = {
        async dropdown(): Promise<DropdownItem[]> {
                return apiRequest<DropdownItem[]>('/productos/dropdown');
        },

        async create(params: CreateProductoParams): Promise<Record<string, unknown>> {
                return apiRequest<Record<string, unknown>>('/productos', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },
};

// =============================================================================
// PROVEEDORES API
// =============================================================================

export interface CreateProveedorParams {
        nombre: string;
        contacto?: string | null;
        email?: string | null;
        telefono?: string | null;
        direccion?: string | null;
        cuit?: string | null;
        sitio_web?: string | null;
        productos_ofrecidos?: string[] | null;
}

export const proveedoresApi = {
        async dropdown(): Promise<DropdownItem[]> {
                return apiRequest<DropdownItem[]>('/proveedores/dropdown');
        },

        async create(params: CreateProveedorParams): Promise<Record<string, unknown>> {
                return apiRequest<Record<string, unknown>>('/proveedores', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },

        async update(id: string, params: Partial<CreateProveedorParams>): Promise<Record<string, unknown>> {
                return apiRequest<Record<string, unknown>>(`/proveedores/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(params),
                });
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
        tipo: 'entrada' | 'salida' | 'ajuste';
        cantidad: number;
        motivo?: string;
        destino?: string | null;
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

export interface IngresoParams {
        producto_id: string;
        cantidad: number;
        proveedor_id?: string | null;
        precio_compra?: number | null;
        deposito?: string;
}

export interface RecepcionCompraParams {
        orden_compra_id: string;
        cantidad: number;
        deposito?: string;
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

        /**
         * Register merchandise ingress (with optional precio_compra)
         */
        async ingreso(params: IngresoParams): Promise<MovimientoResponse> {
                return apiRequest<MovimientoResponse>('/deposito/ingreso', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },

        /**
         * Register purchase order reception (atomic via SP)
         */
        async recepcionCompra(params: RecepcionCompraParams): Promise<MovimientoResponse> {
                return apiRequest<MovimientoResponse>('/compras/recepcion', {
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
                return apiRequest<PedidoItem>(`/pedidos/items/${itemId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ preparado }),
                });
        },
};

// =============================================================================
// CLIENTES API (Cuenta Corriente)
// =============================================================================

export interface ClienteSaldoItem {
        cliente_id: string;
        nombre: string;
        telefono: string | null;
        email: string | null;
        direccion_default: string | null;
        whatsapp_e164: string | null;
        link_pago: string | null;
        limite_credito: number | null;
        saldo: number;
        ultimo_movimiento: string | null;
}

export interface ClienteCreateParams {
        nombre: string;
        telefono?: string | null;
        email?: string | null;
        direccion_default?: string | null;
        edificio?: string | null;
        piso?: string | null;
        departamento?: string | null;
        observaciones?: string | null;
        whatsapp_e164?: string | null;
        link_pago?: string | null;
        limite_credito?: number | null;
        activo?: boolean;
}

export type ClienteUpdateParams = Partial<ClienteCreateParams>;

export const clientesApi = {
        async list(params: { q?: string; limit?: number; offset?: number } = {}): Promise<ClienteSaldoItem[]> {
                const sp = new URLSearchParams();
                if (params.q) sp.set('q', params.q);
                if (params.limit != null) sp.set('limit', String(params.limit));
                if (params.offset != null) sp.set('offset', String(params.offset));
                const qs = sp.toString();
                return apiRequest<ClienteSaldoItem[]>(qs ? `/clientes?${qs}` : '/clientes');
        },

        async create(params: ClienteCreateParams): Promise<Record<string, unknown>> {
                return apiRequest<Record<string, unknown>>('/clientes', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },

        async update(id: string, params: ClienteUpdateParams): Promise<Record<string, unknown>> {
                return apiRequest<Record<string, unknown>>(`/clientes/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(params),
                });
        },
};

export interface CuentaCorrienteResumen {
        dinero_en_la_calle: number;
        clientes_con_deuda: number;
        as_of: string;
}

export interface RegistrarPagoCCParams {
        cliente_id: string;
        monto: number;
        descripcion?: string | null;
}

export const cuentasCorrientesApi = {
        async resumen(): Promise<CuentaCorrienteResumen> {
                return apiRequest<CuentaCorrienteResumen>('/cuentas-corrientes/resumen');
        },

        async saldos(params: { q?: string; solo_deuda?: boolean; limit?: number; offset?: number } = {}): Promise<ClienteSaldoItem[]> {
                const sp = new URLSearchParams();
                if (params.q) sp.set('q', params.q);
                if (params.solo_deuda) sp.set('solo_deuda', 'true');
                if (params.limit != null) sp.set('limit', String(params.limit));
                if (params.offset != null) sp.set('offset', String(params.offset));
                const qs = sp.toString();
                return apiRequest<ClienteSaldoItem[]>(qs ? `/cuentas-corrientes/saldos?${qs}` : '/cuentas-corrientes/saldos');
        },

        async registrarPago(params: RegistrarPagoCCParams): Promise<{ cliente_id: string; saldo: number }> {
                return apiRequest<{ cliente_id: string; saldo: number }>('/cuentas-corrientes/pagos', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },
};

// =============================================================================
// VENTAS API (POS)
// =============================================================================

export interface VentaItemInput {
        producto_id: string;
        cantidad: number;
}

export interface CreateVentaParams {
        metodo_pago: 'efectivo' | 'tarjeta' | 'cuenta_corriente';
        cliente_id?: string | null;
        confirmar_riesgo?: boolean;
        items: VentaItemInput[];
}

export interface VentaItemRow {
        id: string;
        producto_id: string;
        producto_nombre: string;
        producto_sku: string | null;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
}

export interface VentaResponse {
        id: string;
        idempotency_key: string;
        metodo_pago: string;
        cliente_id: string | null;
        monto_total: number;
        created_at: string;
        status: 'created' | 'existing';
        items: VentaItemRow[];
}

export const ventasApi = {
        async create(params: CreateVentaParams, idempotencyKey: string): Promise<VentaResponse> {
                if (!idempotencyKey || !idempotencyKey.trim()) {
                        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key es requerido', 400);
                }

                return apiRequest<VentaResponse>('/ventas', {
                        method: 'POST',
                        headers: {
                                'Idempotency-Key': idempotencyKey.trim(),
                        },
                        body: JSON.stringify(params),
                });
        },

        async list(params: { limit?: number; offset?: number; fecha_desde?: string; fecha_hasta?: string } = {}): Promise<unknown[]> {
                const sp = new URLSearchParams();
                if (params.limit != null) sp.set('limit', String(params.limit));
                if (params.offset != null) sp.set('offset', String(params.offset));
                if (params.fecha_desde) sp.set('fecha_desde', params.fecha_desde);
                if (params.fecha_hasta) sp.set('fecha_hasta', params.fecha_hasta);
                const qs = sp.toString();
                return apiRequest<unknown[]>(qs ? `/ventas?${qs}` : '/ventas');
        },

        async get(id: string): Promise<unknown> {
                return apiRequest<unknown>(`/ventas/${id}`);
        },
};

// =============================================================================
// INSIGHTS API — Arbitraje de Precios
// =============================================================================

export interface ArbitrajeItem {
	producto_id: string;
	nombre_producto: string;
	sku: string | null;
	costo_proveedor_actual: number;
	costo_proveedor_prev: number | null;
	delta_costo_pct: number | null;
	precio_venta_actual: number | null;
	margen_vs_reposicion: number | null;
	riesgo_perdida: boolean;
	margen_bajo: boolean;
	fecha_ultima_comparacion: string;
}

export interface OportunidadCompraItem extends ArbitrajeItem {
	cantidad_actual: number;
	stock_minimo: number;
	nivel_stock: string;
}

export const insightsApi = {
	/**
	 * Productos con riesgo de pérdida o margen bajo
	 */
	async arbitraje(): Promise<ArbitrajeItem[]> {
		return apiRequest<ArbitrajeItem[]>('/insights/arbitraje');
	},

	/**
	 * Oportunidades de compra: stock bajo + caída de costo >= 10%
	 */
	async compras(): Promise<OportunidadCompraItem[]> {
		return apiRequest<OportunidadCompraItem[]>('/insights/compras');
	},

	/**
	 * Payload unificado de arbitraje para un producto
	 */
	async producto(id: string): Promise<ArbitrajeItem> {
		return apiRequest<ArbitrajeItem>(`/insights/producto/${id}`);
	},
};

// =============================================================================
// PRECIOS API
// =============================================================================

export interface AplicarPrecioParams {
	producto_id: string;
	precio_compra: number;
	margen_ganancia?: number | null;
}

export interface AplicarPrecioResponse {
	precio_venta: number;
	precio_compra: number;
	margen_ganancia: number;
}

export const preciosApi = {
	/**
	 * Aplicar precio a producto con redondeo automático
	 */
	async aplicar(params: AplicarPrecioParams): Promise<AplicarPrecioResponse> {
		return apiRequest<AplicarPrecioResponse>('/precios/aplicar', {
			method: 'POST',
			body: JSON.stringify(params),
		});
	},
};

// =============================================================================
// OFERTAS API (Anti-mermas)
// =============================================================================

export interface OfertaSugeridaItem {
        stock_id: string;
        producto_id: string;
        producto_nombre: string;
        sku: string | null;
        codigo_barras: string | null;
        ubicacion: string | null;
        fecha_vencimiento: string | null;
        dias_hasta_vencimiento: number;
        cantidad_actual: number;
        descuento_sugerido_pct: number;
        precio_base: number;
        precio_oferta_sugerido: number;
        as_of: string;
}

export type AplicarOfertaParams = {
        stock_id: string;
        descuento_pct?: number;
};

export type AplicarOfertaResponse = Record<string, unknown>;

export const ofertasApi = {
        async sugeridas(): Promise<OfertaSugeridaItem[]> {
                return apiRequest<OfertaSugeridaItem[]>('/ofertas/sugeridas');
        },

        async aplicar(params: AplicarOfertaParams): Promise<AplicarOfertaResponse> {
                return apiRequest<AplicarOfertaResponse>('/ofertas/aplicar', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },

        async desactivar(ofertaId: string): Promise<Record<string, unknown>> {
                return apiRequest<Record<string, unknown>>(`/ofertas/${ofertaId}/desactivar`, {
                        method: 'POST',
                });
        },
};

// =============================================================================
// BITÁCORA API (Notas de turno)
// =============================================================================

export type CrearBitacoraParams = {
        nota: string;
        usuario_nombre?: string | null;
};

export type BitacoraItem = {
        id: string;
        usuario_nombre: string | null;
        usuario_email: string | null;
        usuario_rol: string | null;
        nota: string;
        created_at: string;
};

export const bitacoraApi = {
        async create(params: CrearBitacoraParams): Promise<BitacoraItem> {
                return apiRequest<BitacoraItem>('/bitacora', {
                        method: 'POST',
                        body: JSON.stringify(params),
                });
        },

        async list(params: { limit?: number; offset?: number } = {}): Promise<BitacoraItem[]> {
                const sp = new URLSearchParams();
                if (params.limit != null) sp.set('limit', String(params.limit));
                if (params.offset != null) sp.set('offset', String(params.offset));
                const qs = sp.toString();
                return apiRequest<BitacoraItem[]>(qs ? `/bitacora?${qs}` : '/bitacora');
        },
};

// =============================================================================
// SEARCH API
// =============================================================================

export interface SearchResultItem {
        id: string;
        nombre?: string;
        titulo?: string;
        sku?: string;
        marca?: string;
        codigo_barras?: string;
        precio_actual?: number;
        contacto?: string;
        email?: string;
        telefono?: string;
        estado?: string;
        prioridad?: string;
        // Pedidos fields
        numero_pedido?: number;
        cliente_nombre?: string;
        cliente_telefono?: string;
        estado_pago?: string;
        monto_total?: number;
        fecha_pedido?: string;
        // Clientes fields
        direccion_default?: string;
}

export interface GlobalSearchResponse {
        productos: SearchResultItem[];
        proveedores: SearchResultItem[];
        tareas: SearchResultItem[];
        pedidos: SearchResultItem[];
        clientes: SearchResultItem[];
}

export const searchApi = {
        /**
         * Global search across productos, proveedores, tareas, pedidos, clientes
         */
        async global(query: string, limit = 10): Promise<GlobalSearchResponse> {
                const params = new URLSearchParams({ q: query, limit: String(limit) });
                return apiRequest<GlobalSearchResponse>(`/search?${params.toString()}`);
        },
};

// =============================================================================
// FACTURAS INGESTA API (OCR Pipeline)
// =============================================================================

export interface FacturaIngestaResponse {
        id: string;
        proveedor_id: string;
        tipo_comprobante: string;
        numero: string | null;
        fecha_factura: string | null;
        total: number | null;
        estado: 'pendiente' | 'extraida' | 'validada' | 'aplicada' | 'error' | 'rechazada';
        imagen_url: string | null;
        datos_extraidos: Record<string, unknown> | null;
        score_confianza: number | null;
        created_at: string;
}

export interface FacturaIngestaItemResponse {
        id: string;
        factura_id: string;
        descripcion_original: string;
        producto_id: string | null;
        alias_usado: string | null;
        cantidad: number;
        unidad: string;
        precio_unitario: number | null;
        subtotal: number | null;
        estado_match: 'auto_match' | 'alias_match' | 'fuzzy_pendiente' | 'confirmada' | 'rechazada';
        confianza_match: number | null;
}

export interface ValidarItemParams {
        estado_match: 'confirmada' | 'rechazada';
        producto_id?: string | null;
        guardar_alias?: boolean;
        alias_texto?: string;
}

export interface AplicarFacturaResponse {
        factura_id: string;
        items_aplicados: number;
        items_ya_aplicados: number;
        items_errores: number;
        results: Array<{ item_id: string; status: string; movimiento_id?: string }>;
        errors: Array<{ item_id: string; error: string }>;
}

export interface ExtraerFacturaResponse {
        factura_id: string;
        items_count: number;
        estado: string;
        items_failed_count?: number;
        items_failed?: Array<{ descripcion_original: string; error: string }>;
        insert_mode?: 'batch' | 'fallback';
        items_previos_eliminados?: number;
}

export const facturasApi = {
        async extraer(facturaId: string): Promise<ExtraerFacturaResponse> {
                return apiRequest<ExtraerFacturaResponse>(`/facturas/${facturaId}/extraer`, {
                        method: 'POST',
                });
        },

        async validarItem(itemId: string, params: ValidarItemParams): Promise<Record<string, unknown>> {
                return apiRequest<Record<string, unknown>>(`/facturas/items/${itemId}/validar`, {
                        method: 'PUT',
                        body: JSON.stringify(params),
                });
        },

        async aplicar(facturaId: string): Promise<AplicarFacturaResponse> {
                return apiRequest<AplicarFacturaResponse>(`/facturas/${facturaId}/aplicar`, {
                        method: 'POST',
                });
        },
};

export default {
        tareas: tareasApi,
        deposito: depositoApi,
        productos: productosApi,
        proveedores: proveedoresApi,
        pedidos: pedidosApi,
        clientes: clientesApi,
        cuentasCorrientes: cuentasCorrientesApi,
        ventas: ventasApi,
        insights: insightsApi,
        precios: preciosApi,
        ofertas: ofertasApi,
        bitacora: bitacoraApi,
        search: searchApi,
        facturas: facturasApi,
};
