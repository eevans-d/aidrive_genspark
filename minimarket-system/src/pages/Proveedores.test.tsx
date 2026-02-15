import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('Proveedores smoke', () => {
  it('renderiza vista principal', () => {
    render(<Proveedores />)
    expect(screen.getByText('Gestión de Proveedores')).toBeInTheDocument()
  })
})
