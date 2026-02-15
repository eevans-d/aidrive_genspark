import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Ventas from './Ventas'

// Mock apiClient - ventasApi.list is called inside useQuery
vi.mock('../lib/apiClient', () => ({
  ventasApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}))

// Mock ErrorMessage component so it renders the message text
vi.mock('../components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => (
    <div data-testid="error-message">{message}</div>
  ),
}))

vi.mock('../components/errorMessageUtils', () => ({
  parseErrorMessage: (err: Error) => err?.message || 'Error desconocido',
  detectErrorType: () => 'generic',
}))

vi.mock('../utils/currency', () => ({
  money: (n: number) => n.toFixed(2),
}))

// Helper to wrap component with QueryClient
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// Mock ventas data
const mockVentas = [
  {
    id: 'v1',
    created_at: '2026-02-15T10:30:00Z',
    metodo_pago: 'efectivo',
    monto_total: 2500,
    cliente_id: 'c1',
    clientes: { nombre: 'Juan Perez', telefono: '1155556666' },
  },
  {
    id: 'v2',
    created_at: '2026-02-15T12:00:00Z',
    metodo_pago: 'tarjeta_debito',
    monto_total: 4200,
    cliente_id: null,
    clientes: null,
  },
]

// We need to control useQuery return values per test, so we override the module
const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  )
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  }
})

describe('Ventas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    const { container } = renderWithQueryClient(<Ventas />)

    // Loading uses Loader2 with animate-spin
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('renders error state correctly', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('No se pudo cargar ventas'),
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Ventas />)

    // Title still shows in error state
    expect(screen.getByText('Reporte de Ventas')).toBeInTheDocument()
    // Error message rendered via mocked ErrorMessage
    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(
      screen.getByText('No se pudo cargar ventas'),
    ).toBeInTheDocument()
  })

  it('renders ventas data with table rows', () => {
    mockUseQuery.mockReturnValue({
      data: mockVentas,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Ventas />)

    // Page title
    expect(screen.getByText('Reporte de Ventas')).toBeInTheDocument()

    // Summary cards
    expect(screen.getByText('Total Vendido')).toBeInTheDocument()
    expect(screen.getByText('Cantidad de Ventas')).toBeInTheDocument()

    // Table headers
    expect(screen.getByText('Fecha/Hora')).toBeInTheDocument()
    expect(screen.getByText('Metodo')).toBeInTheDocument()
    expect(screen.getByText('Monto')).toBeInTheDocument()
    expect(screen.getByText('Cliente')).toBeInTheDocument()

    // Venta rows - client name
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    // Money amounts appear in both table rows and summary, so use getAllByText
    const amounts2500 = screen.getAllByText(/2500\.00/)
    expect(amounts2500.length).toBeGreaterThanOrEqual(1)
    const amounts4200 = screen.getAllByText(/4200\.00/)
    expect(amounts4200.length).toBeGreaterThanOrEqual(1)

    // Payment methods in summary section
    expect(screen.getAllByText('Efectivo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Tarjeta Debito').length).toBeGreaterThanOrEqual(1)
  })

  it('renders date range filter buttons', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Ventas />)

    expect(screen.getByText('Hoy')).toBeInTheDocument()
    expect(screen.getByText('Semana')).toBeInTheDocument()
    expect(screen.getByText('Mes')).toBeInTheDocument()
    expect(screen.getByText('Personalizado')).toBeInTheDocument()
  })

  it('shows empty state message when no ventas in period', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Ventas />)

    expect(
      screen.getByText('No hay ventas en el periodo seleccionado'),
    ).toBeInTheDocument()
  })
})
