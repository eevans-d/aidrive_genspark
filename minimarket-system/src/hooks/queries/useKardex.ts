/**
 * React Query hook para la página de Kardex
 * @description Maneja fetching de movimientos de inventario para Kardex
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { MovimientoDeposito } from '../../types/database';

export interface KardexMovimiento extends MovimientoDeposito {
        producto_nombre?: string;
        proveedor_nombre?: string;
}

export interface KardexResult {
        movimientos: KardexMovimiento[];
        total: number;
        resumen: {
                entradas: number;
                salidas: number;
                ajustes: number;
        };
}

export interface UseKardexOptions {
        productoId?: string;
        fechaDesde?: string;
        fechaHasta?: string;
        limit?: number;
}

/**
 * Fetcher para Kardex
 */
export async function fetchKardex(options: UseKardexOptions = {}): Promise<KardexResult> {
        const { productoId, fechaDesde, fechaHasta, limit = 100 } = options;

        let query = supabase
                .from('movimientos_deposito')
                .select('*, productos(nombre), proveedores(nombre)', { count: 'exact' })
                .order('fecha_movimiento', { ascending: false })
                .limit(limit);

        if (productoId) {
                query = query.eq('producto_id', productoId);
        }
        if (fechaDesde) {
                query = query.gte('fecha_movimiento', fechaDesde);
        }
        if (fechaHasta) {
                query = query.lte('fecha_movimiento', fechaHasta);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        const movimientos: KardexMovimiento[] = (data || []).map((item: any) => ({
                ...item,
                producto_nombre: item.productos?.nombre,
                proveedor_nombre: item.proveedores?.nombre,
        }));

        // Calcular resumen
        const entradas = movimientos.filter(m => m.tipo_movimiento === 'entrada').length;
        const salidas = movimientos.filter(m => m.tipo_movimiento === 'salida').length;
        const ajustes = movimientos.filter(m => m.tipo_movimiento === 'ajuste').length;

        return {
                movimientos,
                total: count ?? 0,
                resumen: { entradas, salidas, ajustes },
        };
}

/**
 * Hook para obtener movimientos Kardex
 */
export function useKardex(options: UseKardexOptions = {}) {
        return useQuery({
                queryKey: ['kardex', options],
                queryFn: () => fetchKardex(options),
                staleTime: 1000 * 60 * 2,
        });
}

export default useKardex;
