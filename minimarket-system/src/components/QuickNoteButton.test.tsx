import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import QuickNoteButton from './QuickNoteButton'

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com' },
    profile: { nombre: 'Admin' },
  })),
}))

vi.mock('../hooks/queries', () => ({
  useCreateFaltante: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useRecentFaltantes: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

const renderQuickNote = (props = {}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <QuickNoteButton {...props} />
    </QueryClientProvider>
  )
}

describe('QuickNoteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders FAB button', () => {
    renderQuickNote()
    const fab = screen.getByRole('button', { name: /anotar faltante/i })
    expect(fab).toBeInTheDocument()
  })

  it('opens modal on FAB click', async () => {
    renderQuickNote()
    const fab = screen.getByRole('button', { name: /anotar faltante/i })
    fireEvent.click(fab)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ej.*Falta pan/i)).toBeInTheDocument()
    })
  })

  it('opens modal automatically with autoOpen prop', () => {
    renderQuickNote({ autoOpen: true })
    expect(screen.getByPlaceholderText(/Ej.*Falta pan/i)).toBeInTheDocument()
  })

  it('closes modal on X button click', async () => {
    renderQuickNote()
    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /anotar faltante/i }))
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ej.*Falta pan/i)).toBeInTheDocument()
    })
    // Close modal
    const closeBtn = screen.getByLabelText('Cerrar')
    fireEvent.click(closeBtn)
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Ej.*Falta pan/i)).not.toBeInTheDocument()
    })
  })

  it('prefills text when prefillText prop provided', () => {
    renderQuickNote({ autoOpen: true, prefillText: 'leche entera' })
    const textarea = screen.getByPlaceholderText(/Ej.*Falta pan/i) as HTMLTextAreaElement
    expect(textarea.value).toBe('leche entera')
  })

  it('has Ctrl+Enter hint visible', () => {
    renderQuickNote({ autoOpen: true })
    expect(screen.getByText(/ctrl.*enter/i)).toBeInTheDocument()
  })

  it('shows Guardar button in modal', () => {
    renderQuickNote({ autoOpen: true })
    expect(screen.getByText('Guardar')).toBeInTheDocument()
  })
})
