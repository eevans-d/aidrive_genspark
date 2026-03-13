import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import type { AxeMatchers } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import type { ReactElement } from 'react'

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

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const

const renderWithProviders = (ui: ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const renderResult = render(
    <MemoryRouter future={ROUTER_FUTURE}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )

  return { queryClient, ...renderResult }
}

const waitForQueryIdle = async (queryClient: QueryClient) => {
  await waitFor(() => expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0))
  await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  await waitFor(() => expect(queryClient.isMutating()).toBe(0))
}

describe('Accessibility (a11y)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('Dashboard has no critical a11y violations', async () => {
    const { container, queryClient } = renderWithProviders(<Dashboard />)
    await waitForQueryIdle(queryClient)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Clientes has no critical a11y violations', async () => {
    const { container, queryClient } = renderWithProviders(<Clientes />)
    await waitForQueryIdle(queryClient)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
