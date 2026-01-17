/**
 * React Query hook para la página de Proveedores
 * @description Maneja fetching de proveedores con sus productos asociados
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { Proveedor } from '../../types/database';

export interface ProveedorConProductos extends Proveedor {
        productosCount?: number;
}

export interface ProveedoresResult {
        proveedores: ProveedorConProductos[];
        total: number;
}

/**
 * Fetcher para proveedores
 */
async function fetchProveedores(): Promise<ProveedoresResult> {
        const { data, count, error } = await supabase
                .from('proveedores')
                .select('*', { count: 'exact' })
                .eq('activo', true)
                .order('nombre');

        if (error) throw error;

        // Obtener conteo de productos por proveedor
        const proveedorIds = (data || []).map(p => p.id);
        let productosCountMap: Record<string, number> = {};

        if (proveedorIds.length > 0) {
                const { data: productosData } = await supabase
                        .from('productos')
                        .select('proveedor_principal_id')
                        .in('proveedor_principal_id', proveedorIds)
                        .eq('activo', true);

                if (productosData) {
                        productosCountMap = productosData.reduce<Record<string, number>>((acc, item) => {
                                const id = item.proveedor_principal_id;
                                if (id) acc[id] = (acc[id] || 0) + 1;
                                return acc;
                        }, {});
                }
        }

        const proveedores = (data || []).map(prov => ({
                ...prov,
                productosCount: productosCountMap[prov.id] || 0,
        }));

        return { proveedores, total: count ?? 0 };
}

/**
 * Hook para obtener proveedores
 */
export function useProveedores() {
        return useQuery({
                queryKey: queryKeys.proveedores,
                queryFn: fetchProveedores,
                staleTime: 1000 * 60 * 5, // 5 minutos
        });
}

export default useProveedores;
