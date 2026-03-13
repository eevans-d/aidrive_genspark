import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Pedidos from './Pedidos'

vi.mock('../hooks/queries/usePedidos', () => ({
  usePedidos: vi.fn(),
  useCreatePedido: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateEstadoPedido: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateItemPreparado: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('../lib/apiClient', () => ({
  productosApi: { dropdown: vi.fn().mockResolvedValue([]) },
  ApiError: class ApiError extends Error {
    constructor(m: string) { super(m) }
  },
  PedidoResponse: {},
  CreatePedidoParams: {},
  DropdownItem: {},
}))

vi.mock('../utils/currency', () => ({
  money: (n: number) => n.toFixed(2),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}))

import { usePedidos } from '../hooks/queries/usePedidos'
const mockedUsePedidos = vi.mocked(usePedidos)
type PedidosResult = ReturnType<typeof usePedidos>

const createPedidosResult = (
  overrides: Partial<PedidosResult>,
): PedidosResult => ({
  data: undefined,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
} as PedidosResult)

const renderWithQC = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const mockPedido = {
  id: 'p1',
  numero_pedido: 42,
  cliente_nombre: 'Juan Perez',
  estado: 'pendiente' as const,
  items: [],
  monto_total: 5000,
  monto_pagado: 0,
  tipo_entrega: 'retiro' as const,
  estado_pago: 'pendiente' as const,
  fecha_pedido: '2026-02-12T10:00:00Z',
  fecha_creacion: '2026-02-12T10:00:00Z',
}

describe('Pedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton', () => {
    mockedUsePedidos.mockReturnValue(createPedidosResult({
      isLoading: true,
    }))
    const { container } = renderWithQC(<Pedidos />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders error state', () => {
    mockedUsePedidos.mockReturnValue(createPedidosResult({
      error: new Error('fail'),
    }))
    renderWithQC(<Pedidos />)
    expect(screen.getByText(/error|fail/i)).toBeInTheDocument()
  })

  it('renders filter buttons', () => {
    mockedUsePedidos.mockReturnValue(createPedidosResult({
      data: { pedidos: [], total: 0, pendientes: 0, preparando: 0, listos: 0 },
    }))
    renderWithQC(<Pedidos />)
    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('renders Nuevo Pedido button', () => {
    mockedUsePedidos.mockReturnValue(createPedidosResult({
      data: { pedidos: [], total: 0, pendientes: 0, preparando: 0, listos: 0 },
    }))
    renderWithQC(<Pedidos />)
    expect(screen.getByText(/nuevo pedido/i)).toBeInTheDocument()
  })

  it('renders empty list message when no pedidos', () => {
    mockedUsePedidos.mockReturnValue(createPedidosResult({
      data: { pedidos: [], total: 0, pendientes: 0, preparando: 0, listos: 0 },
    }))
    renderWithQC(<Pedidos />)
    expect(screen.getByText(/no hay pedidos/i)).toBeInTheDocument()
  })

  it('renders pedido card with order number', () => {
    mockedUsePedidos.mockReturnValue(createPedidosResult({
      data: { pedidos: [mockPedido], total: 1, pendientes: 1, preparando: 0, listos: 0 },
    }))
    renderWithQC(<Pedidos />)
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
  })

  it('renders pedido status badge', () => {
    mockedUsePedidos.mockReturnValue(createPedidosResult({
      data: { pedidos: [mockPedido], total: 1, pendientes: 1, preparando: 0, listos: 0 },
    }))
    renderWithQC(<Pedidos />)
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
  })
})
