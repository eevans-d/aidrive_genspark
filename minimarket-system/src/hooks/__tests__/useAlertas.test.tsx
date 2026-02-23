import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAlertas } from '../useAlertas'

const fromMock = vi.fn()
const arbitrajeMock = vi.fn()
const comprasMock = vi.fn()
const sugeridasMock = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}))

vi.mock('../../lib/apiClient', () => ({
  insightsApi: {
    arbitraje: (...args: unknown[]) => arbitrajeMock(...args),
    compras: (...args: unknown[]) => comprasMock(...args),
  },
  ofertasApi: {
    sugeridas: (...args: unknown[]) => sugeridasMock(...args),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function makeBuilder(table: string) {
  const tableRows: Record<string, unknown[]> = {
    mv_stock_bajo: [
      {
        stock_id: 's1',
        producto_id: 'p1',
        producto_nombre: 'Harina',
        sku: null,
        codigo_barras: null,
        cantidad_actual: 1,
        stock_minimo: 4,
        stock_maximo: null,
        nivel_stock: 'critico',
        porcentaje_stock_minimo: 25,
        categoria_id: null,
        categoria_nombre: null,
        ubicacion: null,
      },
    ],
    mv_productos_proximos_vencer: [
      {
        stock_id: 's2',
        producto_id: 'p2',
        producto_nombre: 'Leche',
        sku: null,
        codigo_barras: null,
        cantidad_actual: 3,
        fecha_vencimiento: new Date().toISOString(),
        dias_hasta_vencimiento: 2,
        nivel_alerta: 'urgente',
        ubicacion: null,
      },
    ],
    vista_alertas_activas: [
      {
        id: 'a1',
        producto_id: 'p3',
        nombre_producto: 'Aceite',
        tipo_cambio: 'aumento',
        valor_anterior: 1000,
        valor_nuevo: 1200,
        porcentaje_cambio: 20,
        severidad: 'alta',
        mensaje: 'Suba detectada',
        accion_recomendada: 'Revisar',
        fecha_alerta: new Date().toISOString(),
        procesada: false,
      },
    ],
    tareas_pendientes: [
      {
        id: 't1',
        titulo: 'Comprar yerba',
        estado: 'pendiente',
        prioridad: 'alta',
        fecha_vencimiento: new Date(Date.now() - 60_000).toISOString(),
        asignada_a_nombre: 'Ana',
      },
    ],
  }

  const rows = tableRows[table] ?? []

  const builder: any = {
    select: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    then: (resolve: (value: { data: unknown[]; error: null }) => unknown) => resolve({ data: rows, error: null }),
  }

  return builder
}

describe('useAlertas', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    fromMock.mockImplementation((table: string) => makeBuilder(table))
    arbitrajeMock.mockResolvedValue([
      {
        producto_id: 'p1',
        nombre_producto: 'Harina',
        costo_proveedor_actual: 900,
        precio_venta_actual: 850,
        margen_vs_reposicion: -5,
        riesgo_perdida: true,
        margen_bajo: false,
      },
    ] as any)
    comprasMock.mockResolvedValue([
      {
        producto_id: 'p2',
        nombre_producto: 'Leche',
        cantidad_actual: 3,
        stock_minimo: 8,
        costo_proveedor_actual: 1000,
        delta_costo_pct: -12,
        nivel_stock: 'bajo',
      },
    ] as any)
    sugeridasMock.mockResolvedValue([{ stock_id: 's2' }] as any)
  })

  it('combines critical alerts and insights with total count', async () => {
    const { result } = renderHook(() => useAlertas(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stockBajo).toHaveLength(1)
    expect(result.current.vencimientos).toHaveLength(1)
    expect(result.current.alertasPrecios).toHaveLength(1)
    expect(result.current.tareasVencidas).toHaveLength(1)
    expect(result.current.riesgoPerdida).toHaveLength(1)
    expect(result.current.oportunidadesCompra).toHaveLength(1)
    expect(result.current.ofertasSugeridas).toHaveLength(1)
    expect(result.current.totalAlertas).toBe(6)
  })
})
