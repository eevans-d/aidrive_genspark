import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import AlertsDrawer from '../AlertsDrawer'

const useAlertasMock = vi.fn()

vi.mock('../../hooks/useAlertas', () => ({
  useAlertas: () => useAlertasMock(),
}))

vi.mock('../../lib/apiClient', () => ({
  ofertasApi: { aplicar: vi.fn(), sugeridas: vi.fn() },
  tareasApi: { create: vi.fn() },
  preciosApi: { aplicar: vi.fn() },
  insightsApi: { arbitraje: vi.fn(), compras: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderDrawer(props: { isOpen: boolean; onClose: () => void }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AlertsDrawer {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AlertsDrawer smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAlertasMock.mockReturnValue({
      stockBajo: [
        {
          stock_id: 'stock-1',
          producto_id: 'prod-1',
          producto_nombre: 'Harina 000',
          sku: 'HAR-000',
          codigo_barras: null,
          cantidad_actual: 1,
          stock_minimo: 5,
          stock_maximo: null,
          nivel_stock: 'critico',
          porcentaje_stock_minimo: 20,
          categoria_id: null,
          categoria_nombre: null,
          ubicacion: null,
        },
      ],
      vencimientos: [],
      alertasPrecios: [],
      tareasVencidas: [],
      riesgoPerdida: [],
      oportunidadesCompra: [],
      ofertasSugeridas: [],
      totalAlertas: 1,
      isLoadingCritical: false,
      isLoadingInsights: false,
    })
  })

  it('does not render when closed', () => {
    renderDrawer({ isOpen: false, onClose: vi.fn() })
    expect(screen.queryByText('Alertas')).not.toBeInTheDocument()
  })

  it('renders panel and stock row when open', () => {
    renderDrawer({ isOpen: true, onClose: vi.fn() })

    expect(screen.getByText('Alertas')).toBeInTheDocument()
    expect(screen.getByText('Stock Bajo')).toBeInTheDocument()
    expect(screen.getByText('Harina 000')).toBeInTheDocument()
  })

  it('calls onClose from close button', () => {
    const onClose = vi.fn()
    renderDrawer({ isOpen: true, onClose })

    fireEvent.click(screen.getByRole('button', { name: /cerrar alertas/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
