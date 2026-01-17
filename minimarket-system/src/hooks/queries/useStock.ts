/**
 * React Query hook para la página de Stock
 * @description Maneja fetching de stock con productos relacionados
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { StockDeposito } from '../../types/database';

export interface StockConProducto extends StockDeposito {
        producto_nombre?: string;
        producto_categoria?: string;
}

export interface StockResult {
        items: StockConProducto[];
        total: number;
        alertas: {
                stockBajo: number;
                sinStock: number;
        };
}

/**
 * Fetcher para stock
 */
async function fetchStock(): Promise<StockResult> {
        const { data, count, error } = await supabase
                .from('stock_deposito')
                .select('*, productos(nombre, categoria)', { count: 'exact' })
                .order('cantidad_actual', { ascending: true });

        if (error) throw error;

        const items: StockConProducto[] = (data || []).map((item: any) => ({
                ...item,
                producto_nombre: item.productos?.nombre,
                producto_categoria: item.productos?.categoria,
        }));

        // Calcular alertas
        const stockBajo = items.filter(
                i => i.cantidad_actual <= i.stock_minimo && i.cantidad_actual > 0
        ).length;
        const sinStock = items.filter(i => i.cantidad_actual === 0).length;

        return {
                items,
                total: count ?? 0,
                alertas: { stockBajo, sinStock },
        };
}

/**
 * Hook para obtener stock
 */
export function useStock() {
        return useQuery({
                queryKey: queryKeys.stock,
                queryFn: fetchStock,
                staleTime: 1000 * 60 * 2, // 2 minutos (stock cambia frecuentemente)
        });
}

export default useStock;
