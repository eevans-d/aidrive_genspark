/**
 * React Query hook para la página de Rentabilidad
 * @description Maneja fetching de datos de rentabilidad por producto
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface ProductoRentabilidad {
        id: string;
        nombre: string;
        categoria: string | null;
        precio_actual: number | null;
        precio_costo: number | null;
        margen_ganancia: number | null;
        margen_porcentaje: number;
}

export interface RentabilidadResult {
        productos: ProductoRentabilidad[];
        total: number;
        promedios: {
                margenPromedio: number;
                precioPromedioVenta: number;
                precioPromedioCosto: number;
        };
}

/**
 * Fetcher para rentabilidad
 */
async function fetchRentabilidad(): Promise<RentabilidadResult> {
        const { data, count, error } = await supabase
                .from('productos')
                .select('id, nombre, categoria, precio_actual, precio_costo, margen_ganancia', { count: 'exact' })
                .eq('activo', true)
                .not('precio_actual', 'is', null)
                .not('precio_costo', 'is', null)
                .order('margen_ganancia', { ascending: false });

        if (error) throw error;

        const productos: ProductoRentabilidad[] = (data || []).map(p => ({
                ...p,
                margen_porcentaje: p.precio_costo && p.precio_costo > 0
                        ? ((p.precio_actual! - p.precio_costo) / p.precio_costo) * 100
                        : 0,
        }));

        // Calcular promedios
        const productosValidos = productos.filter(p => p.precio_actual && p.precio_costo);
        const margenPromedio = productosValidos.length > 0
                ? productosValidos.reduce((sum, p) => sum + p.margen_porcentaje, 0) / productosValidos.length
                : 0;
        const precioPromedioVenta = productosValidos.length > 0
                ? productosValidos.reduce((sum, p) => sum + (p.precio_actual || 0), 0) / productosValidos.length
                : 0;
        const precioPromedioCosto = productosValidos.length > 0
                ? productosValidos.reduce((sum, p) => sum + (p.precio_costo || 0), 0) / productosValidos.length
                : 0;

        return {
                productos,
                total: count ?? 0,
                promedios: { margenPromedio, precioPromedioVenta, precioPromedioCosto },
        };
}

/**
 * Hook para obtener datos de rentabilidad
 */
export function useRentabilidad() {
        return useQuery({
                queryKey: ['rentabilidad'],
                queryFn: fetchRentabilidad,
                staleTime: 1000 * 60 * 5, // 5 minutos
        });
}

export default useRentabilidad;
