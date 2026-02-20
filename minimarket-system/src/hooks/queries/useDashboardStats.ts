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
  totalTareasPendientes: number;
  tareasUrgentes: number;
  stockBajo: number;
  totalProductos: number;
}

/**
 * Fetcher que ejecuta las 3 consultas del dashboard en paralelo
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Ejecutar consultas en paralelo para mejor performance
  const [tareasResult, tareasCountResult, tareasUrgentesResult, stockResult, productosResult] = await Promise.all([
    // 1. Tareas pendientes (top 5 por prioridad, para display)
    supabase
      .from('tareas_pendientes')
      .select('*')
      .eq('estado', 'pendiente')
      .order('prioridad', { ascending: false })
      .limit(5),

    // 2. Total tareas pendientes (count real, no truncado)
    supabase
      .from('tareas_pendientes')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),

    // 3. Tareas urgentes (count real sobre todos los datos)
    supabase
      .from('tareas_pendientes')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente')
      .eq('prioridad', 'urgente'),

    // 4. Stock bajo (sin limit para conteo preciso)
    supabase
      .from('stock_deposito')
      .select('cantidad_actual, stock_minimo'),

    // 5. Total productos (count only)
    supabase
      .from('productos')
      .select('id', { count: 'exact', head: true }),
  ]);

  // Manejar errores de cualquier consulta
  if (tareasResult.error) throw tareasResult.error;
  if (tareasCountResult.error) throw tareasCountResult.error;
  if (tareasUrgentesResult.error) throw tareasUrgentesResult.error;
  if (stockResult.error) throw stockResult.error;
  if (productosResult.error) throw productosResult.error;

  const tareas = tareasResult.data ?? [];
  const stock = stockResult.data ?? [];

  // Calcular stock bajo sobre datos completos
  const stockBajoCount = stock.filter(
    (s: { cantidad_actual: number; stock_minimo: number }) => s.cantidad_actual <= s.stock_minimo
  ).length;

  return {
    tareasPendientes: tareas,
    totalTareasPendientes: tareasCountResult.count ?? 0,
    tareasUrgentes: tareasUrgentesResult.count ?? 0,
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
