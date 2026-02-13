import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Stock from './Stock'

vi.mock('../hooks/queries', () => ({
  useStock: vi.fn(() => ({
    data: { items: [], alertas: { stockBajo: 0, sinStock: 0 } },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  })),
}))

describe('Stock smoke', () => {
  it('renderiza vista principal', () => {
    render(<Stock />)
    expect(screen.getByText('Control de Stock')).toBeInTheDocument()
  })
})
