/**
 * React Query hook para la página de Pedidos
 * @description Maneja fetching y mutaciones de pedidos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pedidosApi, PedidoResponse, CreatePedidoParams, UpdateEstadoParams, UpdatePagoParams, UpdateItemPreparadoParams } from '../../lib/apiClient';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const pedidosQueryKeys = {
        all: ['pedidos'] as const,
        lists: () => [...pedidosQueryKeys.all, 'list'] as const,
        list: (filters: PedidosFilters) => [...pedidosQueryKeys.lists(), filters] as const,
        details: () => [...pedidosQueryKeys.all, 'detail'] as const,
        detail: (id: string) => [...pedidosQueryKeys.details(), id] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export interface PedidosFilters {
        estado?: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado' | 'todos';
        estado_pago?: 'pendiente' | 'pagado' | 'parcial' | 'todos';
        fecha_desde?: string;
        fecha_hasta?: string;
        limit?: number;
        offset?: number;
}

export interface PedidosResult {
        pedidos: PedidoResponse[];
        total: number;
        pendientes: number;
        preparando: number;
        listos: number;
}

// ============================================================================
// HOOK: Lista de pedidos
// ============================================================================

export function usePedidos(filters: PedidosFilters = {}) {
        const { estado = 'todos', estado_pago = 'todos', ...rest } = filters;

        return useQuery({
                queryKey: pedidosQueryKeys.list(filters),
                queryFn: async (): Promise<PedidosResult> => {
                        const params: Record<string, string> = {};

                        if (estado !== 'todos') params.estado = estado;
                        if (estado_pago !== 'todos') params.estado_pago = estado_pago;
                        if (rest.fecha_desde) params.fecha_desde = rest.fecha_desde;
                        if (rest.fecha_hasta) params.fecha_hasta = rest.fecha_hasta;
                        if (rest.limit) params.limit = String(rest.limit);
                        if (rest.offset) params.offset = String(rest.offset);

                        const result = await pedidosApi.list(params);
                        const pedidos = result.pedidos || [];

                        return {
                                pedidos,
                                total: result.total || pedidos.length,
                                pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
                                preparando: pedidos.filter(p => p.estado === 'preparando').length,
                                listos: pedidos.filter(p => p.estado === 'listo').length,
                        };
                },
                staleTime: 1000 * 30, // 30 segundos
        });
}

// ============================================================================
// HOOK: Detalle de pedido
// ============================================================================

export function usePedido(id: string | null) {
        return useQuery({
                queryKey: pedidosQueryKeys.detail(id || ''),
                queryFn: () => pedidosApi.get(id!),
                enabled: !!id,
                staleTime: 1000 * 60, // 1 minuto
        });
}

// ============================================================================
// HOOK: Crear pedido
// ============================================================================

export function useCreatePedido() {
        const queryClient = useQueryClient();

        return useMutation({
                mutationFn: (params: CreatePedidoParams) => pedidosApi.create(params),
                onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: pedidosQueryKeys.all });
                },
        });
}

// ============================================================================
// HOOK: Actualizar estado
// ============================================================================

export function useUpdateEstadoPedido() {
        const queryClient = useQueryClient();

        return useMutation({
                mutationFn: ({ id, estado }: UpdateEstadoParams) => pedidosApi.updateEstado(id, estado),
                onSuccess: (_, variables) => {
                        queryClient.invalidateQueries({ queryKey: pedidosQueryKeys.all });
                        queryClient.invalidateQueries({ queryKey: pedidosQueryKeys.detail(variables.id) });
                },
        });
}

// ============================================================================
// HOOK: Actualizar pago
// ============================================================================

export function useUpdatePagoPedido() {
        const queryClient = useQueryClient();

        return useMutation({
                mutationFn: ({ id, monto_pagado }: UpdatePagoParams) => pedidosApi.updatePago(id, monto_pagado),
                onSuccess: (_, variables) => {
                        queryClient.invalidateQueries({ queryKey: pedidosQueryKeys.all });
                        queryClient.invalidateQueries({ queryKey: pedidosQueryKeys.detail(variables.id) });
                },
        });
}

// ============================================================================
// HOOK: Marcar item como preparado
// ============================================================================

export function useUpdateItemPreparado() {
        const queryClient = useQueryClient();

        return useMutation({
                mutationFn: ({ itemId, preparado }: UpdateItemPreparadoParams) =>
                        pedidosApi.updateItemPreparado(itemId, preparado),
                onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: pedidosQueryKeys.all });
                },
        });
}

export default usePedidos;
