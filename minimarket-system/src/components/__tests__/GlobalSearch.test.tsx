import React from 'react'
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import GlobalSearch from '../GlobalSearch'

const navigateMock = vi.fn()
const useGlobalSearchMock = vi.fn()
const originalScrollIntoView = Element.prototype.scrollIntoView

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../hooks/useGlobalSearch', () => ({
  useGlobalSearch: (query: string, enabled: boolean) => useGlobalSearchMock(query, enabled),
}))

vi.mock('../../hooks/useUserRole', () => ({
  useUserRole: () => ({ canAccess: () => true }),
}))

vi.mock('../../lib/apiClient', () => ({
  insightsApi: {
    producto: vi.fn().mockResolvedValue(null),
  },
}))

function renderSearch(props: { isOpen: boolean; onClose: () => void; initialQuery?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GlobalSearch {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('GlobalSearch smoke', () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  })

  afterAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: originalScrollIntoView,
    })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useGlobalSearchMock.mockReturnValue({
      data: {
        productos: [],
        pedidos: [],
        clientes: [],
        proveedores: [],
        tareas: [],
      },
      isLoading: false,
    })
  })

  it('does not render when closed', () => {
    renderSearch({ isOpen: false, onClose: vi.fn() })
    expect(screen.queryByPlaceholderText(/buscar productos/i)).not.toBeInTheDocument()
  })

  it('renders quick actions when open without query', () => {
    renderSearch({ isOpen: true, onClose: vi.fn(), initialQuery: '' })

    expect(screen.getByPlaceholderText(/buscar productos, pedidos, clientes/i)).toBeInTheDocument()
    expect(screen.getByText('Anotar faltante')).toBeInTheDocument()
    expect(screen.getByText('Nueva tarea')).toBeInTheDocument()
  })

  it('renders search results when query has enough characters', () => {
    useGlobalSearchMock.mockReturnValue({
      data: {
        productos: [
          {
            id: 'prod-1',
            nombre: 'Coca Cola 2.25L',
            sku: 'COCA-225',
            marca: 'Coca Cola',
            precio_actual: 1999,
          },
        ],
        pedidos: [],
        clientes: [],
        proveedores: [],
        tareas: [],
      },
      isLoading: false,
    })

    renderSearch({ isOpen: true, onClose: vi.fn(), initialQuery: 'co' })

    expect(screen.getByText(/Productos/)).toBeInTheDocument()
    expect(screen.getByText('Coca Cola 2.25L')).toBeInTheDocument()
  })
})
