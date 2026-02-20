import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Tareas from './Tareas'

// Mock apiClient - tareasApi is called inside mutations
vi.mock('../lib/apiClient', () => ({
  tareasApi: {
    create: vi.fn().mockResolvedValue({}),
    completar: vi.fn().mockResolvedValue({}),
    cancelar: vi.fn().mockResolvedValue({}),
  },
  ApiError: class ApiError extends Error {},
}))

// Mock ErrorMessage component so it renders the message text
vi.mock('../components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => (
    <div data-testid="error-message">{message}</div>
  ),
}))

vi.mock('../components/errorMessageUtils', () => ({
  parseErrorMessage: (err: Error) => err?.message || 'Error desconocido',
  detectErrorType: () => 'generic',
  extractRequestId: () => undefined,
}))

// Mock Skeleton components
vi.mock('../components/Skeleton', () => ({
  SkeletonList: () => <div data-testid="skeleton-list" className="animate-pulse">Loading list...</div>,
  SkeletonText: ({ width, className }: { width?: string; className?: string }) => (
    <div data-testid="skeleton-text" className={`animate-pulse ${width ?? ''} ${className ?? ''}`} />
  ),
}))

// Helper to wrap component with QueryClient
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// Mock tareas data following the TareasResult shape
const mockTareasData = {
  tareas: [
    {
      id: 't1',
      titulo: 'Revisar inventario',
      descripcion: 'Contar items del depósito',
      asignada_a_id: null,
      asignada_a_nombre: 'Carlos',
      prioridad: 'urgente',
      estado: 'pendiente',
      fecha_creacion: '2026-02-15T10:00:00Z',
      fecha_vencimiento: '2026-02-16T18:00:00Z',
      fecha_completada: null,
      completada_por_id: null,
      completada_por_nombre: null,
      fecha_cancelada: null,
      cancelada_por_id: null,
      cancelada_por_nombre: null,
      razon_cancelacion: null,
      creada_por_id: null,
      creada_por_nombre: null,
      created_at: '2026-02-15T10:00:00Z',
      updated_at: '2026-02-15T10:00:00Z',
    },
    {
      id: 't2',
      titulo: 'Llamar proveedor',
      descripcion: null,
      asignada_a_id: null,
      asignada_a_nombre: null,
      prioridad: 'normal',
      estado: 'pendiente',
      fecha_creacion: '2026-02-15T11:00:00Z',
      fecha_vencimiento: null,
      fecha_completada: null,
      completada_por_id: null,
      completada_por_nombre: null,
      fecha_cancelada: null,
      cancelada_por_id: null,
      cancelada_por_nombre: null,
      razon_cancelacion: null,
      creada_por_id: null,
      creada_por_nombre: null,
      created_at: '2026-02-15T11:00:00Z',
      updated_at: '2026-02-15T11:00:00Z',
    },
    {
      id: 't3',
      titulo: 'Ordenar góndolas',
      descripcion: 'Todo terminado',
      asignada_a_id: null,
      asignada_a_nombre: 'María',
      prioridad: 'baja',
      estado: 'completada',
      fecha_creacion: '2026-02-14T09:00:00Z',
      fecha_vencimiento: null,
      fecha_completada: '2026-02-14T15:00:00Z',
      completada_por_id: null,
      completada_por_nombre: 'María',
      fecha_cancelada: null,
      cancelada_por_id: null,
      cancelada_por_nombre: null,
      razon_cancelacion: null,
      creada_por_id: null,
      creada_por_nombre: null,
      created_at: '2026-02-14T09:00:00Z',
      updated_at: '2026-02-14T15:00:00Z',
    },
  ],
  total: 3,
  urgentes: 1,
  pendientes: 2,
  completadas: 1,
}

// We need to control useQuery return values per test, so we override the module
const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  )
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    }),
    useQueryClient: vi.fn().mockReturnValue({
      cancelQueries: vi.fn(),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }),
  }
})

describe('Tareas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    const { container } = renderWithQueryClient(<Tareas />)

    // Loading uses SkeletonList + SkeletonText with animate-pulse
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it('renders error state correctly', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('No se pudieron cargar tareas'),
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Tareas />)

    // Title still shows in error state
    expect(screen.getByText('Gestión de Tareas')).toBeInTheDocument()
    // Error message rendered via mocked ErrorMessage
    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(
      screen.getByText('No se pudieron cargar tareas'),
    ).toBeInTheDocument()
  })

  it('renders tasks data with pending and completed sections', () => {
    mockUseQuery.mockReturnValue({
      data: mockTareasData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Tareas />)

    // Page title
    expect(screen.getByText('Gestión de Tareas')).toBeInTheDocument()

    // Pending tasks section header with count
    expect(screen.getByText('Tareas Pendientes (2)')).toBeInTheDocument()

    // Task titles
    expect(screen.getByText('Revisar inventario')).toBeInTheDocument()
    expect(screen.getByText('Llamar proveedor')).toBeInTheDocument()

    // Task description
    expect(screen.getByText('Contar items del depósito')).toBeInTheDocument()

    // Assigned person
    expect(screen.getByText('Asignado: Carlos')).toBeInTheDocument()

    // Priority badges
    expect(screen.getByText('URGENTE')).toBeInTheDocument()
    expect(screen.getByText('NORMAL')).toBeInTheDocument()
  })

  it('shows "Nueva Tarea" button', () => {
    mockUseQuery.mockReturnValue({
      data: mockTareasData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Tareas />)

    expect(screen.getByText('Nueva Tarea')).toBeInTheDocument()
  })

  it('shows empty state message when no pending tasks', () => {
    const emptyData = {
      tareas: [],
      total: 0,
      urgentes: 0,
      pendientes: 0,
      completadas: 0,
    }

    mockUseQuery.mockReturnValue({
      data: emptyData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Tareas />)

    expect(
      screen.getByText('No hay tareas pendientes'),
    ).toBeInTheDocument()
  })

  it('renders completed tasks section with completada_por_nombre', () => {
    mockUseQuery.mockReturnValue({
      data: mockTareasData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    })

    renderWithQueryClient(<Tareas />)

    // Completed tasks section header with count
    expect(screen.getByText('Tareas Completadas (1)')).toBeInTheDocument()

    // Completed task title
    expect(screen.getByText('Ordenar góndolas')).toBeInTheDocument()

    // Shows who completed the task
    expect(screen.getByText(/Completada por María/)).toBeInTheDocument()
  })
})
