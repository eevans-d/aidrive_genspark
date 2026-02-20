import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import type { AxeMatchers } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend(matchers)
import Dashboard from './Dashboard'
import Clientes from './Clientes'

vi.mock('../hooks/queries', () => ({
  useDashboardStats: vi.fn().mockReturnValue({
    data: {
      ventasHoy: { total: 0, cantidad: 0 },
      ventasSemana: { total: 0, cantidad: 0 },
      ventasMes: { total: 0, cantidad: 0 },
      stockBajo: 0,
      totalProductos: 0,
      pedidosPendientes: 0,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('../hooks/useUserRole', () => ({
  useUserRole: () => ({ role: 'admin', isAdmin: true, canAccess: () => true }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then: vi.fn((cb: any) => cb({ data: [], count: 0, error: null })),
    })),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}))

vi.mock('../lib/apiClient', () => ({
  default: {
    productos: { dropdown: vi.fn().mockResolvedValue([]) },
    search: { global: vi.fn().mockResolvedValue({ productos: [] }) },
  },
  clientesApi: { list: vi.fn().mockResolvedValue([]) },
  cuentasCorrientesApi: {
    resumen: vi.fn().mockResolvedValue({ dinero_en_la_calle: 0, clientes_con_deuda: 0, as_of: '' }),
  },
  ApiError: class ApiError extends Error { requestId?: string },
}))

vi.mock('../utils/currency', () => ({
  money: (n: number) => n.toFixed(2),
}))

const renderWithProviders = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('Accessibility (a11y)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Dashboard has no critical a11y violations', async () => {
    const { container } = renderWithProviders(<Dashboard />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Clientes has no critical a11y violations', async () => {
    const { container } = renderWithProviders(<Clientes />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
