/**
 * Hook para estadísticas del Dashboard usando TanStack Query
 * @description Centraliza el fetching de métricas principales con caché automático
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { TareaPendiente, StockDeposito } from '../../types/database';

export interface DashboardStats {
  tareasPendientes: TareaPendiente[];
  tareasUrgentes: number;
  stockBajo: number;
  totalProductos: number;
}

/**
 * Fetcher que ejecuta las 3 consultas del dashboard en paralelo
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  // Ejecutar consultas en paralelo para mejor performance
  const [tareasResult, stockResult, productosResult] = await Promise.all([
    // 1. Tareas pendientes (top 5 por prioridad)
    supabase
      .from('tareas_pendientes')
      .select('*')
      .eq('estado', 'pendiente')
      .order('prioridad', { ascending: false })
      .limit(5),

    // 2. Stock bajo (items con cantidad <= mínimo)
    supabase
      .from('stock_deposito')
      .select('cantidad_actual, stock_minimo')
      .limit(100), // Suficiente para contar

    // 3. Total productos (count only)
    supabase
      .from('productos')
      .select('id', { count: 'exact', head: true }),
  ]);

  // Manejar errores de cualquier consulta
  if (tareasResult.error) throw tareasResult.error;
  if (stockResult.error) throw stockResult.error;
  if (productosResult.error) throw productosResult.error;

  const tareas = tareasResult.data ?? [];
  const stock = stockResult.data ?? [];

  // Calcular métricas derivadas
  const stockBajoCount = stock.filter(
    (s: StockDeposito) => s.cantidad_actual <= s.stock_minimo
  ).length;

  const tareasUrgentesCount = tareas.filter(
    (t: TareaPendiente) => t.prioridad === 'urgente'
  ).length;

  return {
    tareasPendientes: tareas,
    tareasUrgentes: tareasUrgentesCount,
    stockBajo: stockBajoCount,
    totalProductos: productosResult.count ?? 0,
  };
}

/**
 * Hook principal para consumir estadísticas del dashboard
 * @returns Query result con data, isLoading, isError, error, refetch
 * 
 * @example
 * const { data, isLoading, isError, error, refetch } = useDashboardStats();
 * if (isLoading) return <Spinner />;
 * if (isError) return <ErrorMessage message={error.message} onRetry={refetch} />;
 * return <StatsGrid stats={data} />;
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
    // Override específico: dashboard puede ser más fresco
    staleTime: 1000 * 60 * 2, // 2 minutos (más frecuente que default)
  });
}

export default useDashboardStats;
