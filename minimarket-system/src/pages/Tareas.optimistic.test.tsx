import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}))

vi.mock('../lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/apiClient')>()
  return {
    ...actual,
    tareasApi: {
      ...actual.tareasApi,
      create: createMock,
      completar: vi.fn(),
      cancelar: vi.fn(),
    },
  }
})

import Tareas from './Tareas'

function renderWithQueryClient(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Tareas optimistic UI', () => {
  it('shows optimistic task immediately on create', async () => {
    const user = userEvent.setup()

    let resolvePromise: (v: any) => void = () => {}
    const deferred = new Promise((res) => { resolvePromise = res })
    createMock.mockReturnValueOnce(deferred)

    renderWithQueryClient(<Tareas />)

    // open form
    await user.click(await screen.findByText('Nueva Tarea'))
    await user.type(screen.getByLabelText('Título'), 'Tarea Optimista')

    await user.click(screen.getByRole('button', { name: 'Crear Tarea' }))

    // optimistic: should appear before promise resolves
    expect(await screen.findByText('Tarea Optimista')).toBeInTheDocument()

    // resolve server response
    resolvePromise({
      id: 't-real',
      titulo: 'Tarea Optimista',
      descripcion: null,
      estado: 'pendiente',
      prioridad: 'normal',
      asignada_a_nombre: null,
      fecha_vencimiento: null,
      created_at: new Date().toISOString(),
    })

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
  })
})
