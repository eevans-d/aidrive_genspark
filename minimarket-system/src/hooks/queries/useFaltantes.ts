/**
 * React Query hook for Cuaderno Inteligente (productos_faltantes)
 * Direct Supabase queries — RLS already protects all operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryClient'

export interface FaltanteRow {
  id: string
  producto_id: string | null
  producto_nombre: string | null
  cantidad_faltante: number | null
  prioridad: string | null
  estado: string | null
  observaciones: string | null
  proveedor_asignado_id: string | null
  reportado_por_id: string | null
  reportado_por_nombre: string | null
  resuelto: boolean | null
  fecha_reporte: string | null
  fecha_resolucion: string | null
  fecha_deteccion: string | null
  created_at: string | null
  updated_at: string | null
  // joined
  proveedor_nombre?: string | null
}

export interface FaltantesResult {
  faltantes: FaltanteRow[]
  total: number
}

export interface CreateFaltanteParams {
  producto_id?: string | null
  producto_nombre: string | null
  cantidad_faltante?: number | null
  prioridad?: string | null
  estado?: string | null
  observaciones?: string | null
  proveedor_asignado_id?: string | null
  reportado_por_nombre?: string | null
}

export interface UseFaltantesOptions {
  resuelto?: boolean
  proveedorId?: string | null
  limit?: number
}

async function createAutoReminderTaskForCriticalFaltante(
  faltanteId: string,
  params: CreateFaltanteParams,
  reporterName: string | null,
) {
  const productName = (params.producto_nombre ?? '').trim() || 'Producto faltante'
  const safeProductName = productName.slice(0, 80)
  const dueDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()

  const descriptionParts = [
    `Generado automaticamente desde Cuaderno.`,
    `Producto: ${productName}.`,
    params.cantidad_faltante ? `Cantidad estimada: ${params.cantidad_faltante}.` : null,
    params.observaciones ? `Nota: ${params.observaciones.slice(0, 180)}.` : null,
  ].filter(Boolean)

  const { data, error } = await supabase
    .from('tareas_pendientes')
    .insert({
      titulo: `Reponer urgente: ${safeProductName}`,
      descripcion: descriptionParts.join(' '),
      prioridad: 'urgente',
      estado: 'pendiente',
      creada_por_nombre: reporterName,
      fecha_vencimiento: dueDate,
      tipo: 'reposicion',
      datos: {
        origen: 'cuaderno',
        faltante_id: faltanteId,
      },
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

async function fetchFaltantes(options: UseFaltantesOptions = {}): Promise<FaltantesResult> {
  const { resuelto = false, proveedorId, limit = 200 } = options

  let query = supabase
    .from('productos_faltantes')
    .select('*, proveedores!productos_faltantes_proveedor_id_fkey(nombre)', { count: 'exact' })
    .eq('resuelto', resuelto)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (proveedorId === 'sin_proveedor') {
    query = query.is('proveedor_asignado_id', null)
  } else if (proveedorId) {
    query = query.eq('proveedor_asignado_id', proveedorId)
  }

  const { data, count, error } = await query

  if (error) throw error

  const faltantes: FaltanteRow[] = (data || []).map((row: any) => ({
    ...row,
    proveedor_nombre: row.proveedores?.nombre ?? null,
    proveedores: undefined,
  }))

  return { faltantes, total: count ?? 0 }
}

async function fetchRecentFaltantes(): Promise<FaltanteRow[]> {
  const { data, error } = await supabase
    .from('productos_faltantes')
    .select('id,producto_id,producto_nombre,created_at,resuelto')
    .eq('resuelto', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data || []) as FaltanteRow[]
}

export function useFaltantes(options: UseFaltantesOptions = {}) {
  const { resuelto = false, proveedorId, limit = 200 } = options

  return useQuery({
    queryKey: [...queryKeys.faltantes, { resuelto, proveedorId, limit }],
    queryFn: () => fetchFaltantes(options),
    staleTime: 1000 * 60 * 2,
  })
}

export function useRecentFaltantes() {
  return useQuery({
    queryKey: [...queryKeys.faltantes, 'recent'],
    queryFn: fetchRecentFaltantes,
    staleTime: 1000 * 60 * 2,
  })
}

export function useFaltantesByProveedor() {
  return useQuery({
    queryKey: [...queryKeys.faltantes, 'by-proveedor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos_faltantes')
        .select('*, proveedores!productos_faltantes_proveedor_id_fkey(nombre)')
        .eq('resuelto', false)
        .order('prioridad', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(300)

      if (error) throw error

      const rows: FaltanteRow[] = (data || []).map((row: any) => ({
        ...row,
        proveedor_nombre: row.proveedores?.nombre ?? null,
        proveedores: undefined,
      }))

      // Group by proveedor
      const groups: Record<string, { proveedorNombre: string; faltantes: FaltanteRow[] }> = {}
      const sinProveedor: FaltanteRow[] = []

      for (const row of rows) {
        if (row.proveedor_asignado_id) {
          const key = row.proveedor_asignado_id
          if (!groups[key]) {
            groups[key] = {
              proveedorNombre: row.proveedor_nombre || 'Proveedor desconocido',
              faltantes: [],
            }
          }
          const group = groups[key]
          if (group) group.faltantes.push(row)
        } else {
          sinProveedor.push(row)
        }
      }

      return { groups, sinProveedor, total: rows.length }
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateFaltante() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateFaltanteParams) => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id ?? null

      const insertData: Record<string, unknown> = {
        producto_id: params.producto_id || null,
        producto_nombre: params.producto_nombre,
        cantidad_faltante: params.cantidad_faltante || null,
        prioridad: params.prioridad || 'normal',
        estado: params.estado || 'pendiente',
        observaciones: params.observaciones || null,
        proveedor_asignado_id: params.proveedor_asignado_id || null,
        reportado_por_id: userId,
        reportado_por_nombre: params.reportado_por_nombre || null,
        resuelto: false,
        fecha_reporte: new Date().toISOString(),
        fecha_deteccion: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('productos_faltantes')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      if (insertData.prioridad === 'alta') {
        try {
          await createAutoReminderTaskForCriticalFaltante(data.id, params, params.reportado_por_nombre || null)
        } catch {
          // Non-blocking: the faltante was created successfully even if task creation fails.
        }
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.faltantes })
    },
  })
}

export function useUpdateFaltante() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      resuelto: boolean
      estado: string
      proveedor_asignado_id: string | null
      observaciones: string
      prioridad: string
      fecha_resolucion: string
    }>) => {
      // If marking as resolved, set fecha_resolucion automatically
      if (updates.resuelto === true && !updates.fecha_resolucion) {
        updates.fecha_resolucion = new Date().toISOString()
        updates.estado = 'resuelto'
      }

      const { data, error } = await supabase
        .from('productos_faltantes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.faltantes })
    },
  })
}

export function useFaltantesCountByProveedor(proveedorId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.faltantes, 'count', proveedorId],
    queryFn: async () => {
      if (!proveedorId) return 0
      const { count, error } = await supabase
        .from('productos_faltantes')
        .select('*', { count: 'exact', head: true })
        .eq('proveedor_asignado_id', proveedorId)
        .eq('resuelto', false)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!proveedorId,
    staleTime: 1000 * 60 * 2,
  })
}
