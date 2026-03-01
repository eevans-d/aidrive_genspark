import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryClient'
import { facturasApi, ValidarItemParams, AplicarFacturaResponse } from '../../lib/apiClient'

export interface FacturaIngesta {
  id: string
  proveedor_id: string
  tipo_comprobante: string
  numero: string | null
  fecha_factura: string | null
  total: number | null
  estado: string
  imagen_url: string | null
  datos_extraidos: Record<string, unknown> | null
  score_confianza: number | null
  request_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  proveedores?: { nombre: string; cuit: string | null } | null
}

export interface FacturaIngestaItem {
  id: string
  factura_id: string
  descripcion_original: string
  producto_id: string | null
  alias_usado: string | null
  cantidad: number
  unidad: string
  precio_unitario: number | null
  subtotal: number | null
  estado_match: string
  confianza_match: number | null
  unidades_por_bulto: number | null
  precio_unitario_costo: number | null
  validacion_subtotal: 'ok' | 'warning' | 'error' | null
  notas_calculo: string | null
  created_at: string
  productos?: { nombre: string; sku: string | null } | null
}

async function fetchFacturas(): Promise<FacturaIngesta[]> {
  const { data, error } = await supabase
    .from('facturas_ingesta')
    .select('*, proveedores(nombre, cuit)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []) as unknown as FacturaIngesta[]
}

async function fetchFacturaItems(facturaId: string): Promise<FacturaIngestaItem[]> {
  const { data, error } = await supabase
    .from('facturas_ingesta_items')
    .select('*, productos(nombre, sku)')
    .eq('factura_id', facturaId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as FacturaIngestaItem[]
}

export function useFacturas() {
  return useQuery({
    queryKey: queryKeys.facturas,
    queryFn: fetchFacturas,
    staleTime: 1000 * 60 * 2,
  })
}

export function useFacturaItems(facturaId: string | null) {
  return useQuery({
    queryKey: facturaId ? queryKeys.facturaItems(facturaId) : ['facturas', 'items', 'none'],
    queryFn: () => fetchFacturaItems(facturaId!),
    enabled: !!facturaId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateFactura() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      proveedor_id: string
      imagen_url: string
      tipo_comprobante?: string
    }) => {
      const { data, error } = await supabase
        .from('facturas_ingesta')
        .insert({
          proveedor_id: params.proveedor_id,
          imagen_url: params.imagen_url,
          tipo_comprobante: params.tipo_comprobante ?? 'factura',
          estado: 'pendiente',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.facturas })
    },
  })
}

export function useValidarFacturaItem(facturaId: string | null) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, params }: { itemId: string; params: ValidarItemParams }) => {
      return facturasApi.validarItem(itemId, params)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.facturas })
      if (facturaId) {
        qc.invalidateQueries({ queryKey: queryKeys.facturaItems(facturaId) })
      }
    },
  })
}

export function useAplicarFactura() {
  const qc = useQueryClient()

  return useMutation<AplicarFacturaResponse, Error, string>({
    mutationFn: (facturaId: string) => facturasApi.aplicar(facturaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.facturas })
      qc.invalidateQueries({ queryKey: ['kardex'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}
