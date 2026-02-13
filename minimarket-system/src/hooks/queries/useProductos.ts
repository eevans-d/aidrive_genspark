/**
 * React Query hook para la página de Productos
 * @description Maneja fetching con paginación, búsqueda por código de barras y historial de precios
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { Producto, Proveedor } from '../../types/database';

type ProductoResumen = Pick<
        Producto,
        | 'id'
        | 'nombre'
        | 'categoria'
        | 'codigo_barras'
        | 'precio_actual'
        | 'precio_costo'
        | 'proveedor_principal_id'
        | 'margen_ganancia'
>;

type PrecioHistoricoResumen = {
        id: string;
        producto_id: string;
        precio: number;
        fuente: string | null;
        fecha: string;
        cambio_porcentaje: number | null;
};

export interface ProductoConHistorial extends ProductoResumen {
        historial?: PrecioHistoricoResumen[];
        proveedor?: Proveedor;
}

export interface ProductosResult {
        productos: ProductoConHistorial[];
        total: number;
}

export interface UseProductosOptions {
        page: number;
        pageSize?: number;
        barcodeSearch?: string;
}

/**
 * Fetcher para productos con paginación y datos relacionados
 */
export async function fetchProductos(options: UseProductosOptions): Promise<ProductosResult> {
        const { page, pageSize = 20, barcodeSearch } = options;
        const trimmedBarcode = barcodeSearch?.trim() ?? '';
        const isBarcodeSearch = trimmedBarcode.length > 0;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Construir query base
        let query = supabase
                .from('productos')
                .select(
                        'id,nombre,categoria,codigo_barras,precio_actual,precio_costo,proveedor_principal_id,margen_ganancia',
                        { count: 'exact' }
                )
                .eq('activo', true)
                .order('nombre');

        if (isBarcodeSearch) {
                query = query.eq('codigo_barras', trimmedBarcode).limit(pageSize);
        } else {
                query = query.range(from, to);
        }

        const { data: productosData, count, error: productosError } = await query;

        if (productosError) throw productosError;
        if (!productosData || productosData.length === 0) {
                return { productos: [], total: count ?? 0 };
        }

        const productoIds = productosData.map((prod) => prod.id);
        const proveedorIds = Array.from(
                new Set(
                        productosData
                                .map((prod) => prod.proveedor_principal_id)
                                .filter((id): id is string => Boolean(id))
                )
        );

        // Batch query: proveedores
        let proveedoresMap: Record<string, Proveedor> = {};
        if (proveedorIds.length > 0) {
                const { data: proveedoresData } = await supabase
                        .from('proveedores')
                        .select('id,nombre,contacto,email,telefono,productos_ofrecidos,activo,created_at,updated_at')
                        .in('id', proveedorIds)
                        .eq('activo', true);

                proveedoresMap = Object.fromEntries(
                        (proveedoresData || []).map((prov) => [prov.id, prov])
                );
        }

        // Batch query: historial de precios
        let historialPorProducto: Record<string, PrecioHistoricoResumen[]> = {};
        const { data: historialData } = await supabase
                .from('precios_historicos')
                .select('id,producto_id,precio_nuevo,motivo_cambio,fecha_cambio,cambio_porcentaje')
                .in('producto_id', productoIds)
                .order('fecha_cambio', { ascending: false });

        if (historialData) {
                historialPorProducto = historialData.reduce<Record<string, PrecioHistoricoResumen[]>>(
                        (acc, item) => {
                                const key = item.producto_id;
                                if (!acc[key]) acc[key] = [];
                                if (acc[key].length < 5) {
                                        acc[key].push({
                                                id: item.id,
                                                producto_id: item.producto_id,
                                                precio: item.precio_nuevo ?? 0,
                                                fuente: item.motivo_cambio ?? null,
                                                fecha: item.fecha_cambio,
                                                cambio_porcentaje: item.cambio_porcentaje ?? null,
                                        });
                                }
                                return acc;
                        },
                        {}
                );
        }

        // Combinar datos
        const productos = productosData.map((prod) => ({
                ...prod,
                historial: historialPorProducto[prod.id] || [],
                proveedor: prod.proveedor_principal_id
                        ? proveedoresMap[prod.proveedor_principal_id]
                        : undefined,
        }));

        return { productos, total: count ?? 0 };
}

/**
 * Hook para obtener productos con paginación y búsqueda
 */
export function useProductos(options: UseProductosOptions) {
        const { page, pageSize = 20, barcodeSearch } = options;

        return useQuery({
                queryKey: [...queryKeys.productos, { page, pageSize, barcodeSearch }],
                queryFn: () => fetchProductos(options),
                staleTime: 1000 * 60 * 2, // 2 minutos
        });
}

export default useProductos;
