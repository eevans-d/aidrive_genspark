/**
 * Query Hooks barrel export
 * @description Re-exporta todos los hooks de queries para imports limpios
 */

// Dashboard
export { useDashboardStats } from './useDashboardStats';
export type { DashboardStats } from './useDashboardStats';

// Productos
export { useProductos } from './useProductos';
export type { ProductoConHistorial, ProductosResult, UseProductosOptions } from './useProductos';

// Proveedores
export { useProveedores } from './useProveedores';
export type { ProveedorConProductos, ProveedoresResult, ProductoProveedor, UseProveedoresOptions } from './useProveedores';

// Stock
export { useStock } from './useStock';
export type { StockConProducto, StockResult } from './useStock';

// Tareas
export { useTareas } from './useTareas';
export type { TareasResult, UseTareasOptions } from './useTareas';
// Re-export TareaPendiente from database types for convenience
export type { TareaPendiente } from '../../types/database';

// Kardex
export { useKardex } from './useKardex';
export type { KardexMovimiento, KardexResult, UseKardexOptions } from './useKardex';

// Rentabilidad
export { useRentabilidad } from './useRentabilidad';
export type { ProductoRentabilidad, RentabilidadResult } from './useRentabilidad';

// Deposito
export { useDeposito } from './useDeposito';
export type { StockDepositoConProducto, DepositoResult } from './useDeposito';

// Pedidos
export { usePedidos, usePedido, useCreatePedido, useUpdateEstadoPedido, useUpdatePagoPedido, useUpdateItemPreparado } from './usePedidos';
export type { PedidosFilters, PedidosResult } from './usePedidos';

// Faltantes (Cuaderno Inteligente)
export { useFaltantes, useRecentFaltantes, useFaltantesByProveedor, useCreateFaltante, useUpdateFaltante, useFaltantesCountByProveedor } from './useFaltantes';
export type { FaltanteRow, FaltantesResult, CreateFaltanteParams, UseFaltantesOptions } from './useFaltantes';

