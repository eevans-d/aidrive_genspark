/**
 * React Query hook para la página de Depósito
 * @description Maneja fetching de stock y operaciones de depósito
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { StockDeposito, MovimientoDeposito, Producto } from '../../types/database';

export interface StockDepositoConProducto extends StockDeposito {
        producto?: Pick<Producto, 'id' | 'nombre' | 'categoria' | 'codigo_barras'>;
}

export interface DepositoResult {
        stock: StockDepositoConProducto[];
        ultimosMovimientos: MovimientoDeposito[];
        resumen: {
                totalItems: number;
                stockBajo: number;
                sinStock: number;
                movimientosHoy: number;
        };
}

/**
 * Fetcher para datos de depósito
 */
async function fetchDeposito(): Promise<DepositoResult> {
        // Obtener stock con productos
        const { data: stockData, error: stockError } = await supabase
                .from('stock_deposito')
                .select('*, productos(id, nombre, categoria, codigo_barras)')
                .order('cantidad_actual', { ascending: true });

        if (stockError) throw stockError;

        const stock: StockDepositoConProducto[] = (stockData || []).map((item: any) => ({
                ...item,
                producto: item.productos,
        }));

        // Obtener últimos movimientos (últimas 24h)
        const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: movimientosData, error: movError } = await supabase
                .from('movimientos_deposito')
                .select('*')
                .gte('fecha_movimiento', ayer)
                .order('fecha_movimiento', { ascending: false })
                .limit(20);

        if (movError) throw movError;

        // Calcular resumen
        const stockBajo = stock.filter(s => s.cantidad_actual <= s.stock_minimo && s.cantidad_actual > 0).length;
        const sinStock = stock.filter(s => s.cantidad_actual === 0).length;

        return {
                stock,
                ultimosMovimientos: movimientosData || [],
                resumen: {
                        totalItems: stock.length,
                        stockBajo,
                        sinStock,
                        movimientosHoy: (movimientosData || []).length,
                },
        };
}

/**
 * Hook para obtener datos del depósito
 */
export function useDeposito() {
        return useQuery({
                queryKey: ['deposito'],
                queryFn: fetchDeposito,
                staleTime: 1000 * 60 * 1, // 1 minuto (depósito cambia frecuentemente)
        });
}

export default useDeposito;
