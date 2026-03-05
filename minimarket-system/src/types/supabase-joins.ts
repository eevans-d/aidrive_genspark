// =============================================================================
// Types for Supabase .select() queries with joins
// These shapes are NOT covered by database.types.ts (which lacks join types)
// =============================================================================

/** Row from: movimientos_deposito?select=*,productos(nombre,codigo_barras),proveedores(nombre),facturas_ingesta_items(...) */
export interface KardexJoinedRow {
  id: string;
  producto_id: string;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  fecha_movimiento: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  destino: string | null;
  proveedor_id: string | null;
  lote: string | null;
  motivo: string | null;
  observaciones: string | null;
  factura_ingesta_item_id: string | null;
  created_at: string;
  productos?: { nombre: string; codigo_barras?: string | null } | null;
  proveedores?: { nombre: string } | null;
  facturas_ingesta_items?: {
    factura_id?: string;
    facturas_ingesta?: {
      numero?: string;
      proveedores?: { nombre: string } | null;
    } | null;
  } | null;
}

/** Row from: productos_faltantes?select=*,proveedores!productos_faltantes_proveedor_id_fkey(nombre) */
export interface FaltanteWithProveedor {
  id: string;
  producto_id: string | null;
  producto_nombre: string | null;
  cantidad_faltante: number | null;
  prioridad: string | null;
  estado: string | null;
  observaciones: string | null;
  proveedor_asignado_id: string | null;
  reportado_por_id: string | null;
  reportado_por_nombre: string | null;
  resuelto: boolean | null;
  fecha_reporte: string | null;
  fecha_resolucion: string | null;
  fecha_deteccion: string | null;
  created_at: string | null;
  updated_at: string | null;
  proveedores?: { nombre: string } | null;
}

/** Row from: stock_deposito?select=*,productos(id,nombre,categoria,codigo_barras) */
export interface StockDepositoJoinedRow {
  id: string;
  producto_id: string;
  cantidad_actual: number;
  stock_minimo: number;
  stock_maximo?: number;
  ubicacion: string | null;
  lote: string | null;
  fecha_vencimiento: string | null;
  created_at: string;
  updated_at: string;
  productos?: {
    id: string;
    nombre: string;
    categoria: string | null;
    codigo_barras: string | null;
  } | null;
}
