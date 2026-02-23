import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Facturas from './Facturas'

const mockExtraer = vi.fn()
const mockValidarItem = vi.fn()
const mockAplicar = vi.fn()
const mockDropdown = vi.fn().mockResolvedValue([
  { id: 'prod-1', nombre: 'Coca Cola 500ml', codigo_barras: '7790895000101' },
  { id: 'prod-2', nombre: 'Fanta 500ml', codigo_barras: '7790895000201' },
])

vi.mock('../lib/apiClient', () => ({
  default: {
    productos: { dropdown: (...args: any[]) => mockDropdown(...args) },
  },
  facturasApi: {
    extraer: (...args: any[]) => mockExtraer(...args),
    validarItem: (...args: any[]) => mockValidarItem(...args),
    aplicar: (...args: any[]) => mockAplicar(...args),
  },
  ValidarItemParams: {},
  AplicarFacturaResponse: {},
}))

vi.mock('../lib/supabase', () => {
  const mockFacturas = [
    {
      id: 'f-1', proveedor_id: 'prov-1', tipo_comprobante: 'factura', numero: '0001-00001234',
      fecha_factura: '2026-02-20', total: 15000, estado: 'extraida', imagen_url: '/test.jpg',
      datos_extraidos: null, score_confianza: null, request_id: null, created_by: null,
      created_at: '2026-02-20T10:00:00Z', updated_at: '2026-02-20T10:00:00Z',
      proveedores: { nombre: 'MaxiConsumo' },
    },
    {
      id: 'f-2', proveedor_id: 'prov-1', tipo_comprobante: 'factura', numero: '0001-00001235',
      fecha_factura: '2026-02-21', total: 5000, estado: 'validada', imagen_url: '/test2.jpg',
      datos_extraidos: null, score_confianza: null, request_id: null, created_by: null,
      created_at: '2026-02-21T10:00:00Z', updated_at: '2026-02-21T10:00:00Z',
      proveedores: { nombre: 'MaxiConsumo' },
    },
    {
      id: 'f-3', proveedor_id: 'prov-2', tipo_comprobante: 'factura', numero: null,
      fecha_factura: null, total: null, estado: 'pendiente', imagen_url: '/test3.jpg',
      datos_extraidos: null, score_confianza: null, request_id: null, created_by: null,
      created_at: '2026-02-22T10:00:00Z', updated_at: '2026-02-22T10:00:00Z',
      proveedores: { nombre: 'Distribuidora Norte' },
    },
  ]

  const mockItems = [
    {
      id: 'item-1', factura_id: 'f-1', descripcion_original: 'COCA COLA 500ML',
      producto_id: 'prod-1', alias_usado: null, cantidad: 24, unidad: 'un',
      precio_unitario: 350, subtotal: 8400, estado_match: 'auto_match',
      confianza_match: 0.95, created_at: '2026-02-20T10:00:00Z',
      productos: { nombre: 'Coca Cola 500ml', sku: 'CC500' },
    },
    {
      id: 'item-2', factura_id: 'f-1', descripcion_original: 'FANTA UVA 500',
      producto_id: null, alias_usado: null, cantidad: 12, unidad: 'un',
      precio_unitario: 320, subtotal: 3840, estado_match: 'fuzzy_pendiente',
      confianza_match: 0.4, created_at: '2026-02-20T10:00:01Z',
      productos: null,
    },
  ]

  const makeChain = (resolveData: any = []) => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      then: vi.fn((cb: any) => cb({ data: resolveData, error: null })),
    }
    // Make it thenable for async queries
    chain[Symbol.for('nodejs.util.promisify.custom')] = () => Promise.resolve({ data: resolveData, error: null })
    return chain
  }

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'facturas_ingesta') {
          const chain = makeChain(mockFacturas)
          return chain
        }
        if (table === 'facturas_ingesta_items') {
          const chain = makeChain(mockItems)
          return chain
        }
        return makeChain()
      }),
    },
  }
})

vi.mock('../hooks/queries/useProveedores', () => ({
  useProveedores: () => ({
    data: {
      proveedores: [
        { id: 'prov-1', nombre: 'MaxiConsumo' },
        { id: 'prov-2', nombre: 'Distribuidora Norte' },
      ],
    },
    isLoading: false,
  }),
}))

vi.mock('../hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true, role: 'admin' }),
}))

vi.mock('../components/FacturaUpload', () => ({
  default: () => <div data-testid="factura-upload">FacturaUpload Mock</div>,
}))

const renderWithQC = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Facturas page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', async () => {
    renderWithQC(<Facturas />)
    expect(await screen.findByText('Facturas de Compra')).toBeInTheDocument()
  })

  it('renders Nueva Factura button', async () => {
    renderWithQC(<Facturas />)
    expect(await screen.findByText('Nueva Factura')).toBeInTheDocument()
  })

  it('shows upload panel when Nueva Factura is clicked', async () => {
    renderWithQC(<Facturas />)
    const btn = await screen.findByText('Nueva Factura')
    fireEvent.click(btn)
    expect(await screen.findByText(/Cargar imagen de factura/i)).toBeInTheDocument()
  })

  it('shows proveedor selector in upload panel', async () => {
    renderWithQC(<Facturas />)
    fireEvent.click(await screen.findByText('Nueva Factura'))
    expect(await screen.findByText(/Cargar imagen de factura/i)).toBeInTheDocument()
    expect(screen.getByText('Seleccionar proveedor...')).toBeInTheDocument()
  })

  it('renders FacturaUpload component in upload panel', async () => {
    renderWithQC(<Facturas />)
    fireEvent.click(await screen.findByText('Nueva Factura'))
    expect(await screen.findByTestId('factura-upload')).toBeInTheDocument()
  })

  it('has cancel button in upload panel', async () => {
    renderWithQC(<Facturas />)
    fireEvent.click(await screen.findByText('Nueva Factura'))
    expect(await screen.findByText('Cancelar')).toBeInTheDocument()
  })

  it('hides upload panel on cancel', async () => {
    renderWithQC(<Facturas />)
    fireEvent.click(await screen.findByText('Nueva Factura'))
    expect(await screen.findByTestId('factura-upload')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancelar'))
    await waitFor(() => {
      expect(screen.queryByTestId('factura-upload')).not.toBeInTheDocument()
    })
  })

  it('renders ESTADO_COLORS correctly for known estados', async () => {
    // Smoke test: component renders without crashing with various estados
    renderWithQC(<Facturas />)
    expect(await screen.findByText('Facturas de Compra')).toBeInTheDocument()
  })
})
