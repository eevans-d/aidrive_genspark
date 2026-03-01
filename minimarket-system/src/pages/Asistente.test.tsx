import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Asistente from './Asistente'
import { assistantApi } from '../lib/assistantApi'
import type { AssistantResponseData } from '../lib/assistantApi'

vi.mock('../lib/assistantApi', () => ({
  assistantApi: {
    sendMessage: vi.fn(),
    confirmAction: vi.fn(),
  },
}))

function renderAsistente() {
  return render(
    <MemoryRouter initialEntries={['/asistente']}>
      <Asistente />
    </MemoryRouter>,
  )
}

function baseResponse(overrides: Partial<AssistantResponseData> = {}): AssistantResponseData {
  return {
    intent: 'consultar_stock_bajo',
    confidence: 0.9,
    mode: 'answer',
    answer: 'Hay 2 productos con stock bajo.',
    data: [],
    request_id: 'req-1',
    suggestions: ['stock bajo'],
    ...overrides,
  }
}

describe('Asistente', () => {
  const sendMessageMock = vi.mocked(assistantApi.sendMessage)

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      writable: true,
      value: vi.fn(),
    })
  })

  it('renders quick prompts and handles loading + response with navigation', async () => {
    let resolveRequest!: (value: AssistantResponseData) => void
    sendMessageMock.mockImplementation(
      () =>
        new Promise<AssistantResponseData>((resolve) => {
          resolveRequest = resolve
        }),
    )

    renderAsistente()

    fireEvent.change(screen.getByPlaceholderText(/Ej:/i), {
      target: { value: 'stock bajo' },
    })
    fireEvent.click(screen.getByTitle('Enviar'))

    expect(await screen.findByText('Consultando...')).toBeInTheDocument()
    expect(sendMessageMock).toHaveBeenCalledWith(
      'stock bajo',
      expect.objectContaining({
        ui_route: '/asistente',
        timezone: expect.any(String),
      }),
    )

    resolveRequest(
      baseResponse({
        navigation: [{ label: 'Ver Stock', path: '/stock' }],
      }),
    )

    expect(await screen.findByText('Hay 2 productos con stock bajo.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver Stock/i })).toHaveAttribute('href', '/stock')
  })

  it('shows retry button on error and retries the failed message', async () => {
    sendMessageMock
      .mockRejectedValueOnce(new Error('Fallo de red'))
      .mockResolvedValueOnce(baseResponse({ answer: 'Reintento exitoso.' }))

    renderAsistente()

    fireEvent.change(screen.getByPlaceholderText(/Ej:/i), {
      target: { value: 'ventas del dia' },
    })
    fireEvent.click(screen.getByTitle('Enviar'))

    expect(await screen.findByText(/Error: Fallo de red/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Reintento exitoso.')).toBeInTheDocument()
    expect(sendMessageMock).toHaveBeenNthCalledWith(
      2,
      'ventas del dia',
      expect.objectContaining({ ui_route: '/asistente' }),
    )
  })

  it('loads stored chat and resets it with "Nuevo chat"', async () => {
    localStorage.setItem(
      'assistant_chat_history_v1',
      JSON.stringify([
        {
          role: 'assistant',
          content: 'Mensaje persistido',
          timestamp: '2026-03-01T00:00:00.000Z',
        },
      ]),
    )

    renderAsistente()

    expect(screen.getByText('Mensaje persistido')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo chat' }))

    expect(await screen.findByText(/Hola! Soy el asistente operativo/i)).toBeInTheDocument()

    await waitFor(() => {
      const raw = localStorage.getItem('assistant_chat_history_v1')
      expect(raw).toBeTruthy()
      expect(raw).toContain('Hola! Soy el asistente operativo')
    })
  })

  // -----------------------------------------------------------------------
  // Sprint 2 — plan + confirm flow tests
  // -----------------------------------------------------------------------

  it('shows plan card with Confirmar/Cancelar buttons on plan mode response', async () => {
    sendMessageMock.mockResolvedValueOnce(
      baseResponse({
        intent: 'crear_tarea',
        mode: 'plan',
        answer: 'Voy a crear esta tarea:\n\n- Titulo: Comprar harina\n- Prioridad: normal\n\n¿Confirmas?',
        confirm_token: 'tok-abc-123',
        action_plan: {
          intent: 'crear_tarea',
          label: 'Crear tarea',
          payload: { titulo: 'Comprar harina', prioridad: 'normal' },
          summary: 'Crear tarea "Comprar harina" con prioridad normal',
          risk: 'bajo',
        },
      }),
    )

    renderAsistente()

    fireEvent.change(screen.getByPlaceholderText(/Ej:/i), {
      target: { value: 'crear tarea comprar harina' },
    })
    fireEvent.click(screen.getByTitle('Enviar'))

    // Plan card should appear
    expect(await screen.findByText(/Accion a confirmar/i)).toBeInTheDocument()
    expect(screen.getByText(/Crear tarea "Comprar harina"/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
  })

  it('executes confirm and shows success result', async () => {
    const confirmMock = vi.mocked(assistantApi.confirmAction)

    sendMessageMock.mockResolvedValueOnce(
      baseResponse({
        intent: 'crear_tarea',
        mode: 'plan',
        answer: 'Voy a crear esta tarea',
        confirm_token: 'tok-confirm-1',
        action_plan: {
          intent: 'crear_tarea',
          label: 'Crear tarea',
          payload: { titulo: 'Test task' },
          summary: 'Crear tarea "Test task"',
          risk: 'bajo',
        },
      }),
    )

    confirmMock.mockResolvedValueOnce({
      executed: true,
      operation: 'crear_tarea',
      answer: 'Tarea creada exitosamente:\n- Titulo: Test task\n- ID: uuid-1',
      result: { id: 'uuid-1', titulo: 'Test task' },
      request_id: 'req-2',
    })

    renderAsistente()

    fireEvent.change(screen.getByPlaceholderText(/Ej:/i), {
      target: { value: 'crear tarea test' },
    })
    fireEvent.click(screen.getByTitle('Enviar'))

    const confirmBtn = await screen.findByRole('button', { name: /Confirmar/i })
    fireEvent.click(confirmBtn)

    expect(await screen.findByText(/Tarea creada exitosamente/i)).toBeInTheDocument()
    expect(confirmMock).toHaveBeenCalledWith('tok-confirm-1')
  })

  it('cancels action plan and shows cancellation message', async () => {
    sendMessageMock.mockResolvedValueOnce(
      baseResponse({
        intent: 'registrar_pago_cc',
        mode: 'plan',
        answer: 'Voy a registrar este pago',
        confirm_token: 'tok-cancel-1',
        action_plan: {
          intent: 'registrar_pago_cc',
          label: 'Registrar pago',
          payload: { cliente_id: 'c1', monto: 5000 },
          summary: 'Registrar pago de $5.000 para Juan',
          risk: 'medio',
        },
      }),
    )

    renderAsistente()

    fireEvent.change(screen.getByPlaceholderText(/Ej:/i), {
      target: { value: 'registrar pago' },
    })
    fireEvent.click(screen.getByTitle('Enviar'))

    const cancelBtn = await screen.findByRole('button', { name: /Cancelar/i })
    fireEvent.click(cancelBtn)

    expect(await screen.findByText(/Accion cancelada/i)).toBeInTheDocument()
    // Confirm button should no longer be active
    expect(screen.getByText(/Accion ya procesada/i)).toBeInTheDocument()
  })

  it('shows quick prompts for creating tasks and registering payments', () => {
    renderAsistente()

    expect(screen.getByRole('button', { name: /Crear tarea/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrar pago/i })).toBeInTheDocument()
  })
})
