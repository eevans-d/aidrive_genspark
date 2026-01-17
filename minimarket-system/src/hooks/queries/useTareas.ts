/**
 * React Query hook para la página de Tareas
 * @description Maneja fetching de tareas pendientes
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { TareaPendiente } from '../../types/database';

export interface TareasResult {
        tareas: TareaPendiente[];
        total: number;
        urgentes: number;
        pendientes: number;
        completadas: number;
}

export interface UseTareasOptions {
        estado?: 'pendiente' | 'en_progreso' | 'completada' | 'todos';
}

/**
 * Fetcher para tareas
 */
async function fetchTareas(options: UseTareasOptions = {}): Promise<TareasResult> {
        const { estado = 'todos' } = options;

        let query = supabase
                .from('tareas_pendientes')
                .select('*', { count: 'exact' })
                .order('prioridad', { ascending: false })
                .order('created_at', { ascending: false });

        if (estado !== 'todos') {
                query = query.eq('estado', estado);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        const tareas = data || [];

        return {
                tareas,
                total: count ?? 0,
                urgentes: tareas.filter(t => t.prioridad === 'urgente').length,
                pendientes: tareas.filter(t => t.estado === 'pendiente').length,
                completadas: tareas.filter(t => t.estado === 'completada').length,
        };
}

/**
 * Hook para obtener tareas
 */
export function useTareas(options: UseTareasOptions = {}) {
        const { estado = 'todos' } = options;

        return useQuery({
                queryKey: estado === 'todos' ? queryKeys.tareas : queryKeys.tareasByEstado(estado),
                queryFn: () => fetchTareas(options),
                staleTime: 1000 * 60 * 2, // 2 minutos
        });
}

export default useTareas;
