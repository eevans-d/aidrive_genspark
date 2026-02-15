import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Productos from './Productos'

vi.mock('../hooks/queries', () => ({
  useProductos: vi.fn(),
}))

vi.mock('../lib/apiClient', () => ({
  productosApi: { create: vi.fn() },
  preciosApi: { aplicar: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(m: string) { super(m) }
  },
}))

vi.mock('../lib/queryClient', () => ({
  queryKeys: { productos: ['productos'] },
}))

vi.mock('../utils/currency', () => ({
  money: (n: number) => n.toFixed(2),
}))

import { useProductos } from '../hooks/queries'
const mockedUseProductos = vi.mocked(useProductos)

const renderWithQC = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const mockProductos = [
  { id: '1', nombre: 'Coca Cola 500ml', categoria: 'Bebidas', codigo_barras: '123', precio_actual: 1500, precio_costo: 1000, proveedor_principal_id: null, margen_ganancia: 50, historial: [] },
  { id: '2', nombre: 'Pan Lactal', categoria: 'Panaderia', codigo_barras: '456', precio_actual: 800, precio_costo: 500, proveedor_principal_id: null, margen_ganancia: 60, historial: [] },
]

describe('Productos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton', () => {
    mockedUseProductos.mockReturnValue({
      data: undefined, isLoading: true, isError: false, error: null, refetch: vi.fn(), isFetching: false,
    } as any)
    const { container } = renderWithQC(<Productos />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders error state', () => {
    mockedUseProductos.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error('fail'), refetch: vi.fn(), isFetching: false,
    } as any)
    renderWithQC(<Productos />)
    expect(screen.getByText(/error|fail/i)).toBeInTheDocument()
  })

  it('renders product list with names', () => {
    mockedUseProductos.mockReturnValue({
      data: { productos: mockProductos, total: 2 }, isLoading: false, isError: false, error: null, refetch: vi.fn(), isFetching: false,
    } as any)
    renderWithQC(<Productos />)
    expect(screen.getByText('Coca Cola 500ml')).toBeInTheDocument()
    expect(screen.getByText('Pan Lactal')).toBeInTheDocument()
  })

  it('shows Nuevo producto button', () => {
    mockedUseProductos.mockReturnValue({
      data: { productos: [], total: 0 }, isLoading: false, isError: false, error: null, refetch: vi.fn(), isFetching: false,
    } as any)
    renderWithQC(<Productos />)
    expect(screen.getByText(/nuevo producto/i)).toBeInTheDocument()
  })

  it('shows pagination controls', () => {
    mockedUseProductos.mockReturnValue({
      data: { productos: mockProductos, total: 40 }, isLoading: false, isError: false, error: null, refetch: vi.fn(), isFetching: false,
    } as any)
    renderWithQC(<Productos />)
    expect(screen.getByText(/anterior/i)).toBeInTheDocument()
    expect(screen.getByText(/siguiente/i)).toBeInTheDocument()
  })

  it('shows barcode search input', () => {
    mockedUseProductos.mockReturnValue({
      data: { productos: [], total: 0 }, isLoading: false, isError: false, error: null, refetch: vi.fn(), isFetching: false,
    } as any)
    renderWithQC(<Productos />)
    expect(screen.getByPlaceholderText(/escanear|codigo/i)).toBeInTheDocument()
  })

  it('renders page title', () => {
    mockedUseProductos.mockReturnValue({
      data: { productos: [], total: 0 }, isLoading: false, isError: false, error: null, refetch: vi.fn(), isFetching: false,
    } as any)
    renderWithQC(<Productos />)
    expect(screen.getByText(/gesti[oó]n de productos/i)).toBeInTheDocument()
  })
})
