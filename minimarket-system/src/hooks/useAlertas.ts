import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { insightsApi, ofertasApi, type ArbitrajeItem, type OportunidadCompraItem, type OfertaSugeridaItem } from '../lib/apiClient'

export interface StockBajoItem {
  stock_id: string
  producto_id: string
  producto_nombre: string
  sku: string | null
  codigo_barras: string | null
  cantidad_actual: number
  stock_minimo: number
  stock_maximo: number | null
  nivel_stock: 'sin_stock' | 'critico' | 'bajo' | 'normal'
  porcentaje_stock_minimo: number
  categoria_id: string | null
  categoria_nombre: string | null
  ubicacion: string | null
}

export interface VencimientoItem {
  stock_id: string
  producto_id: string
  producto_nombre: string
  sku: string | null
  codigo_barras: string | null
  cantidad_actual: number
  fecha_vencimiento: string
  dias_hasta_vencimiento: number
  nivel_alerta: 'vencido' | 'urgente' | 'proximo' | 'normal'
  ubicacion: string | null
}

export interface AlertaPrecioItem {
  id: string
  producto_id: string
  nombre_producto: string
  tipo_cambio: 'aumento' | 'disminucion'
  valor_anterior: number
  valor_nuevo: number
  porcentaje_cambio: number
  severidad: string
  mensaje: string
  accion_recomendada: string
  fecha_alerta: string
  procesada: boolean
}

export interface TareaPendienteItem {
  id: string
  titulo: string
  estado: string
  prioridad: string
  fecha_vencimiento: string
  asignada_a_nombre: string
}

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

export function useAlertas() {
  const stockBajoQuery = useQuery<StockBajoItem[]>({
    queryKey: ['alertas', 'stock-bajo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_stock_bajo')
        .select('*')
        .neq('nivel_stock', 'normal')
        .order('nivel_stock', { ascending: true })
        .limit(10)

      if (error) throw error
      return data ?? []
    },
    staleTime: STALE_TIME,
  })

  const vencimientosQuery = useQuery<VencimientoItem[]>({
    queryKey: ['alertas', 'vencimientos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_productos_proximos_vencer')
        .select('*')
        .neq('nivel_alerta', 'normal')
        .order('dias_hasta_vencimiento', { ascending: true })
        .limit(10)

      if (error) throw error
      return data ?? []
    },
    staleTime: STALE_TIME,
  })

  const alertasPreciosQuery = useQuery<AlertaPrecioItem[]>({
    queryKey: ['alertas', 'precios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vista_alertas_activas')
        .select('*')
        .order('fecha_alerta', { ascending: false })
        .limit(10)

      if (error) throw error
      return data ?? []
    },
    staleTime: STALE_TIME,
  })

  const tareasVencidasQuery = useQuery<TareaPendienteItem[]>({
    queryKey: ['alertas', 'tareas-vencidas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tareas_pendientes')
        .select('*')
        .eq('estado', 'pendiente')
        .lt('fecha_vencimiento', new Date().toISOString())
        .limit(5)

      if (error) throw error
      return data ?? []
    },
    staleTime: STALE_TIME,
  })

  // Insights: Arbitraje (riesgo pérdida + margen bajo)
  const arbitrajeQuery = useQuery<ArbitrajeItem[]>({
    queryKey: ['alertas', 'arbitraje'],
    queryFn: () => insightsApi.arbitraje(),
    staleTime: STALE_TIME,
  })

  // Insights: Oportunidades de compra (stock bajo + caída costo >= 10%)
  const oportunidadesQuery = useQuery<OportunidadCompraItem[]>({
    queryKey: ['alertas', 'oportunidades-compra'],
    queryFn: () => insightsApi.compras(),
    staleTime: STALE_TIME,
  })

  // Ofertas sugeridas (anti-mermas)
  const ofertasSugeridasQuery = useQuery<OfertaSugeridaItem[]>({
    queryKey: ['alertas', 'ofertas-sugeridas'],
    queryFn: () => ofertasApi.sugeridas(),
    staleTime: STALE_TIME,
  })

  const stockBajo = stockBajoQuery.data ?? []
  const vencimientos = vencimientosQuery.data ?? []
  const alertasPrecios = alertasPreciosQuery.data ?? []
  const tareasVencidas = tareasVencidasQuery.data ?? []
  const riesgoPerdida = (arbitrajeQuery.data ?? []).filter(r => r.riesgo_perdida)
  const margenBajo = (arbitrajeQuery.data ?? []).filter(r => r.margen_bajo && !r.riesgo_perdida)
  const oportunidadesCompra = oportunidadesQuery.data ?? []
  const ofertasSugeridas = ofertasSugeridasQuery.data ?? []

  const totalAlertas =
    stockBajo.length +
    vencimientos.length +
    alertasPrecios.length +
    tareasVencidas.length +
    riesgoPerdida.length +
    oportunidadesCompra.length

  const isLoading =
    stockBajoQuery.isLoading ||
    vencimientosQuery.isLoading ||
    alertasPreciosQuery.isLoading ||
    tareasVencidasQuery.isLoading ||
    arbitrajeQuery.isLoading ||
    oportunidadesQuery.isLoading ||
    ofertasSugeridasQuery.isLoading

  return {
    stockBajo,
    vencimientos,
    alertasPrecios,
    tareasVencidas,
    riesgoPerdida,
    margenBajo,
    oportunidadesCompra,
    ofertasSugeridas,
    totalAlertas,
    isLoading,
  }
}
