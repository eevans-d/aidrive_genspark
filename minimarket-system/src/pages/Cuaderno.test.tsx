import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Cuaderno from './Cuaderno'

// Mock all external dependencies
vi.mock('../hooks/queries', () => ({
  useFaltantesByProveedor: vi.fn(),
  useUpdateFaltante: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

vi.mock('../utils/cuadernoParser', () => ({
  generatePurchaseSummary: vi.fn(() => 'PEDIDO PARA: Test'),
}))

vi.mock('../components/Skeleton', () => ({
  SkeletonCard: () => <div data-testid="skeleton-card" />,
  SkeletonText: ({ width }: { width?: string }) => <div data-testid="skeleton-text" className={width} />,
  SkeletonList: () => <div data-testid="skeleton-list" />,
}))

vi.mock('../components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => <div data-testid="error-message">{message}</div>,
}))

vi.mock('../components/errorMessageUtils', () => ({
  parseErrorMessage: (e: unknown) => e instanceof Error ? e.message : 'Error',
  detectErrorType: () => 'generic',
}))

import { useFaltantesByProveedor } from '../hooks/queries'
const mockedUseFaltantesByProveedor = vi.mocked(useFaltantesByProveedor)

const renderCuaderno = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Cuaderno />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Cuaderno', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton', () => {
    mockedUseFaltantesByProveedor.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any)
    const { container } = renderCuaderno()
    expect(container.querySelector('[data-testid="skeleton-card"]')).toBeTruthy()
  })

  it('renders error state', () => {
    mockedUseFaltantesByProveedor.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: vi.fn(),
      isFetching: false,
    } as any)
    renderCuaderno()
    expect(screen.getByTestId('error-message')).toBeTruthy()
  })

  it('renders heading and tabs', () => {
    mockedUseFaltantesByProveedor.mockReturnValue({
      data: { groups: {}, sinProveedor: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any)
    renderCuaderno()
    expect(screen.getByText('Cuaderno')).toBeInTheDocument()
    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText('Por Proveedor')).toBeInTheDocument()
    expect(screen.getByText('Resueltos')).toBeInTheDocument()
  })

  it('shows empty state when no pendientes', () => {
    mockedUseFaltantesByProveedor.mockReturnValue({
      data: { groups: {}, sinProveedor: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any)
    renderCuaderno()
    expect(screen.getByText('No hay faltantes pendientes')).toBeInTheDocument()
  })

  it('shows pending count badge when total > 0', () => {
    mockedUseFaltantesByProveedor.mockReturnValue({
      data: {
        groups: {
          'prov-1': {
            proveedorNombre: 'MaxiConsumo',
            faltantes: [
              {
                id: 'f1', producto_nombre: 'Leche', prioridad: 'alta',
                cantidad_faltante: 3, proveedor_asignado_id: 'prov-1',
                proveedor_nombre: 'MaxiConsumo', resuelto: false,
                created_at: new Date().toISOString(),
                producto_id: null, estado: 'pendiente', observaciones: null,
                reportado_por_id: null, reportado_por_nombre: 'Admin',
                fecha_reporte: null, fecha_resolucion: null,
                fecha_deteccion: null, updated_at: null,
              },
            ],
          },
        },
        sinProveedor: [],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any)
    renderCuaderno()
    expect(screen.getByText('1 pendiente')).toBeInTheDocument()
    expect(screen.getByText('Leche')).toBeInTheDocument()
  })

  it('renders faltante card with priority badge', () => {
    mockedUseFaltantesByProveedor.mockReturnValue({
      data: {
        groups: {},
        sinProveedor: [
          {
            id: 'f2', producto_nombre: 'Pan Lactal', prioridad: 'normal',
            cantidad_faltante: null, proveedor_asignado_id: null,
            proveedor_nombre: null, resuelto: false,
            created_at: new Date().toISOString(),
            producto_id: null, estado: 'pendiente', observaciones: 'para mañana',
            reportado_por_id: null, reportado_por_nombre: 'Juan',
            fecha_reporte: null, fecha_resolucion: null,
            fecha_deteccion: null, updated_at: null,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any)
    renderCuaderno()
    expect(screen.getByText('Pan Lactal')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('"para mañana"')).toBeInTheDocument()
  })
})
