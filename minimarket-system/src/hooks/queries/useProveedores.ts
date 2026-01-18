/**
 * React Query hook para la página de Proveedores
 * @description Maneja fetching de proveedores con sus productos asociados
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { Proveedor, Producto } from '../../types/database';

export type ProductoProveedor = Pick<
        Producto,
        'id' | 'nombre' | 'categoria' | 'precio_actual' | 'margen_ganancia' | 'proveedor_principal_id'
>;

export interface ProveedorConProductos extends Proveedor {
        productos: ProductoProveedor[];
}

export interface ProveedoresResult {
        proveedores: ProveedorConProductos[];
        total: number;
}

export interface UseProveedoresOptions {
        page?: number;
        pageSize?: number;
}

/**
 * Fetcher para proveedores con paginación y productos
 */
async function fetchProveedores(options: UseProveedoresOptions = {}): Promise<ProveedoresResult> {
        const { page = 1, pageSize = 20 } = options;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: proveedoresData, count, error: proveedoresError } = await supabase
                .from('proveedores')
                .select(
                        'id,nombre,contacto,email,telefono,productos_ofrecidos,activo,created_at,updated_at',
                        { count: 'exact' }
                )
                .eq('activo', true)
                .order('nombre')
                .range(from, to);

        if (proveedoresError) throw proveedoresError;

        if (!proveedoresData || proveedoresData.length === 0) {
                return { proveedores: [], total: count ?? 0 };
        }

        // Batch query: obtener productos de todos los proveedores
        const proveedorIds = proveedoresData.map((prov) => prov.id);
        let productosPorProveedor: Record<string, ProductoProveedor[]> = {};

        if (proveedorIds.length > 0) {
                const { data: productosData, error: productosError } = await supabase
                        .from('productos')
                        .select('id,nombre,categoria,precio_actual,margen_ganancia,proveedor_principal_id')
                        .in('proveedor_principal_id', proveedorIds)
                        .eq('activo', true);

                if (productosError) throw productosError;

                productosPorProveedor = (productosData || []).reduce<Record<string, ProductoProveedor[]>>(
                        (acc, producto) => {
                                const key = producto.proveedor_principal_id || 'sin_proveedor';
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(producto);
                                return acc;
                        },
                        {}
                );
        }

        const proveedores = proveedoresData.map((prov) => ({
                ...prov,
                productos: productosPorProveedor[prov.id] || [],
        }));

        return { proveedores, total: count ?? 0 };
}

/**
 * Hook para obtener proveedores con productos
 */
export function useProveedores(options: UseProveedoresOptions = {}) {
        const { page = 1, pageSize = 20 } = options;

        return useQuery({
                queryKey: [...queryKeys.proveedores, { page, pageSize }],
                queryFn: () => fetchProveedores(options),
                staleTime: 1000 * 60 * 5, // 5 minutos
        });
}

export default useProveedores;
