import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppRoutes } from './App'

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, loading: false }),
}))

vi.mock('./hooks/useUserRole', () => ({
  useUserRole: () => ({ canAccess: () => true, loading: false }),
}))

vi.mock('./components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('App routing', () => {
  it('muestra pantalla controlada para ruta inválida', async () => {
    render(
      <MemoryRouter initialEntries={['/ruta-que-no-existe']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
    expect(screen.getByText('Volver al dashboard')).toBeInTheDocument()
  })
})
