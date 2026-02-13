import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Pos from './Pos'

vi.mock('../lib/apiClient', () => ({
  productosApi: { dropdown: vi.fn().mockResolvedValue([]) },
  searchApi: { global: vi.fn().mockResolvedValue([]) },
  ventasApi: { create: vi.fn().mockResolvedValue({}) },
  clientesApi: { list: vi.fn().mockResolvedValue([]) },
  ApiError: class ApiError extends Error {
    constructor(m: string) { super(m) }
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((cb: any) => cb({ data: [], error: null })),
    })),
  },
}))

vi.mock('../hooks/useUserRole', () => ({
  useUserRole: () => ({ role: 'admin', isAdmin: true }),
}))

vi.mock('../utils/currency', () => ({
  money: (n: number) => n.toFixed(2),
  calcTotal: (items: any[]) => items.reduce((a: number, i: any) => a + i.precio_unitario * i.cantidad, 0),
}))

const renderWithProviders = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Pos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders POS title', async () => {
    renderWithProviders(<Pos />)
    expect(await screen.findByText('POS')).toBeInTheDocument()
  })

  it('renders scan input', async () => {
    renderWithProviders(<Pos />)
    const input = await screen.findByPlaceholderText(/escanear/i)
    expect(input).toBeInTheDocument()
  })

  it('renders empty cart message', async () => {
    renderWithProviders(<Pos />)
    expect(await screen.findByText('Escanea un producto para comenzar')).toBeInTheDocument()
  })

  it('displays payment method buttons', async () => {
    renderWithProviders(<Pos />)
    expect(await screen.findByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('Tarjeta')).toBeInTheDocument()
    expect(screen.getByText('Fiado')).toBeInTheDocument()
  })

  it('renders Cobrar button', async () => {
    renderWithProviders(<Pos />)
    expect(await screen.findByText('Cobrar')).toBeInTheDocument()
  })

  it('Cobrar button is disabled when cart is empty', async () => {
    renderWithProviders(<Pos />)
    const cobrarBtn = (await screen.findByText('Cobrar')).closest('button')
    expect(cobrarBtn).toBeDisabled()
  })

  it('renders Limpiar button', async () => {
    renderWithProviders(<Pos />)
    expect(await screen.findByText('Limpiar')).toBeInTheDocument()
  })

  it('renders idempotency key prefix', async () => {
    renderWithProviders(<Pos />)
    expect(await screen.findByText(/Idempotency-Key/)).toBeInTheDocument()
  })
})
