import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Rentabilidad from './Rentabilidad'

vi.mock('../hooks/queries', () => ({
  useRentabilidad: vi.fn(() => ({
    data: { productos: [], promedios: { margenPromedio: 0, precioPromedioVenta: 0, precioPromedioCosto: 0 } },
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
  default: { proveedores: { dropdown: vi.fn().mockResolvedValue([]) } },
}))

describe('Rentabilidad smoke', () => {
  it('renderiza vista principal', () => {
    render(<Rentabilidad />)
    expect(screen.getByText('Panel de Rentabilidad')).toBeInTheDocument()
  })
})
