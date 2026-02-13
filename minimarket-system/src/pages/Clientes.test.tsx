import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Clientes from './Clientes'

vi.mock('../lib/apiClient', () => ({
  clientesApi: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn() },
  cuentasCorrientesApi: {
    resumen: vi.fn().mockResolvedValue({ dinero_en_la_calle: 50000, clientes_con_deuda: 3, as_of: '2026-02-12' }),
    registrarPago: vi.fn(),
  },
}))

vi.mock('../hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true, role: 'admin' }),
}))

vi.mock('../utils/currency', () => ({
  money: (n: number) => n.toFixed(2),
}))

const renderWithQC = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    renderWithQC(<Clientes />)
    expect(screen.getByText('Clientes')).toBeInTheDocument()
  })

  it('renders search input with placeholder', () => {
    renderWithQC(<Clientes />)
    expect(screen.getByPlaceholderText(/buscar por nombre/i)).toBeInTheDocument()
  })

  it('renders Nuevo cliente button', () => {
    renderWithQC(<Clientes />)
    expect(screen.getByText(/nuevo cliente/i)).toBeInTheDocument()
  })

  it('renders Dinero en la calle card', async () => {
    renderWithQC(<Clientes />)
    expect(await screen.findByText(/dinero en la calle/i)).toBeInTheDocument()
  })

  it('renders clientes con deuda count', async () => {
    renderWithQC(<Clientes />)
    expect(await screen.findByText(/clientes con deuda/i)).toBeInTheDocument()
  })

  it('renders currency amounts from resumen', async () => {
    renderWithQC(<Clientes />)
    // The resumen query will resolve with total_deuda: 50000
    expect(await screen.findByText(/50000\.00/)).toBeInTheDocument()
  })
})
