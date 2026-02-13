import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Kardex from './Kardex'

vi.mock('../hooks/queries', () => ({
  useKardex: vi.fn(() => ({
    data: { movimientos: [], resumen: { entradas: 0, salidas: 0, ajustes: 0 } },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  })),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: [] })),
}))

vi.mock('../lib/apiClient', () => ({
  default: { productos: { dropdown: vi.fn().mockResolvedValue([]) } },
}))

describe('Kardex smoke', () => {
  it('renderiza vista principal', () => {
    render(<Kardex />)
    expect(screen.getByText('Kardex de Movimientos')).toBeInTheDocument()
  })
})
