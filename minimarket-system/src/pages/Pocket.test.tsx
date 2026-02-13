import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Pocket from './Pocket'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock('../components/BarcodeScanner', () => ({
  default: () => <div>BarcodeScannerMock</div>,
}))

vi.mock('../lib/apiClient', () => ({
  __esModule: true,
  default: {
    productos: { dropdown: vi.fn().mockResolvedValue([]) },
    search: { global: vi.fn().mockResolvedValue({ productos: [] }) },
  },
  depositoApi: { movimiento: vi.fn() },
  insightsApi: { producto: vi.fn() },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
          }),
        }),
      }),
    }),
  },
}))

describe('Pocket smoke', () => {
  it('renderiza vista principal', () => {
    render(
      <MemoryRouter>
        <Pocket />
      </MemoryRouter>
    )
    expect(screen.getByText('Pocket Manager')).toBeInTheDocument()
    expect(screen.getByText('BarcodeScannerMock')).toBeInTheDocument()
  })
})
