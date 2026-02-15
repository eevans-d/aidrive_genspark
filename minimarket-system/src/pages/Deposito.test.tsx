import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Deposito from './Deposito'

vi.mock('../lib/apiClient', () => ({
  default: {
    productos: { dropdown: vi.fn().mockResolvedValue([]) },
    proveedores: { dropdown: vi.fn().mockResolvedValue([]) },
  },
  depositoApi: { movimiento: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(m: string) { super(m) }
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((cb: any) => cb({ data: [], error: null })),
    })),
  },
}))

vi.mock('../hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true, role: 'admin' }),
}))

const renderWithQC = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Deposito', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    renderWithQC(<Deposito />)
    expect(screen.getByText(/gesti[oó]n de dep[oó]sito/i)).toBeInTheDocument()
  })

  it('renders tab toggle buttons', () => {
    renderWithQC(<Deposito />)
    expect(screen.getAllByText(/ingreso r[aá]pido/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/movimiento normal/i)).toBeInTheDocument()
  })

  it('starts in quick entry mode', () => {
    renderWithQC(<Deposito />)
    // Quick entry mode shows REGISTRAR ENTRADA button
    expect(screen.getByText(/registrar entrada/i)).toBeInTheDocument()
  })

  it('shows product search input in quick mode', () => {
    renderWithQC(<Deposito />)
    expect(screen.getByPlaceholderText(/nombre|codigo/i)).toBeInTheDocument()
  })

  it('switches to normal mode and shows movement type buttons', () => {
    renderWithQC(<Deposito />)
    const normalTab = screen.getByText(/movimiento normal/i)
    fireEvent.click(normalTab)
    expect(screen.getByText('ENTRADA')).toBeInTheDocument()
    expect(screen.getByText('SALIDA')).toBeInTheDocument()
  })

  it('REGISTRAR ENTRADA button is disabled when no product selected', () => {
    renderWithQC(<Deposito />)
    const submitBtn = screen.getByText(/registrar entrada/i).closest('button')
    expect(submitBtn).toBeDisabled()
  })
})
