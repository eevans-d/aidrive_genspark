import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Proveedores from './Proveedores'

vi.mock('../hooks/queries', () => ({
  useProveedores: vi.fn(() => ({
    data: { proveedores: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  })),
}))

vi.mock('../lib/apiClient', () => ({
  proveedoresApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => (
    <div data-testid="error-message">{message}</div>
  ),
}))

vi.mock('../components/errorMessageUtils', () => ({
  parseErrorMessage: (err: Error) => err?.message || 'Error desconocido',
  detectErrorType: () => 'generic',
  extractRequestId: () => undefined,
}))

vi.mock('../utils/currency', () => ({
  money: (n: number) => n.toFixed(2),
}))

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('Proveedores smoke', () => {
  it('renderiza vista principal', () => {
    renderWithQueryClient(<Proveedores />)
    expect(screen.getByText('Gestión de Proveedores')).toBeInTheDocument()
  })
})
