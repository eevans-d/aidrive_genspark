/**
 * TanStack Query Configuration
 * @description Configuración global del cliente de queries con caché optimizado para Mini Market
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient global con configuración optimizada para aplicación de inventario
 * - staleTime: 5 min → datos frescos sin refetch innecesario
 * - gcTime: 30 min → caché persistente durante sesión típica
 * - retry: 1 → un reintento automático ante fallo de red
 * - refetchOnWindowFocus: false → evita refetch al cambiar pestañas (offline-friendly)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutos
      gcTime: 1000 * 60 * 30,         // 30 minutos (antes cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Query Keys tipadas para invalidación y prefetching consistente
 * @example queryClient.invalidateQueries({ queryKey: queryKeys.productos })
 */
export const queryKeys = {
  // Productos
  productos: ['productos'] as const,
  productosPaginated: (page: number, limit: number) => 
    ['productos', 'paginated', { page, limit }] as const,
  productoById: (id: string) => 
    ['productos', 'detail', id] as const,

  // Stock
  stock: ['stock'] as const,
  stockFiltered: (filtro: string) => 
    ['stock', 'filtered', filtro] as const,
  stockByDeposito: (depositoId: string) => 
    ['stock', 'deposito', depositoId] as const,

  // Tareas
  tareas: ['tareas'] as const,
  tareasByEstado: (estado: string) => 
    ['tareas', 'estado', estado] as const,
  tareaById: (id: string) => 
    ['tareas', 'detail', id] as const,

  // Proveedores
  proveedores: ['proveedores'] as const,
  proveedorById: (id: string) => 
    ['proveedores', 'detail', id] as const,

  // Dashboard (agregaciones)
  dashboard: ['dashboard'] as const,
  dashboardStats: ['dashboard', 'stats'] as const,
} as const;

// Tipo inferido para autocompletado
export type QueryKeys = typeof queryKeys;
