import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast, Toaster } from 'sonner'
import { ArrowLeft, Banknote, CreditCard, Loader2, Search, Trash2, User, AlertTriangle } from 'lucide-react'

import {
  ApiError,
  productosApi,
  searchApi,
  ventasApi,
  clientesApi,
  type DropdownItem,
  type ClienteSaldoItem,
  type CreateVentaParams,
} from '../lib/apiClient'
import { supabase } from '../lib/supabase'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import { SkeletonTable } from '../components/Skeleton'

type CartItem = {
  producto_id: string
  nombre: string
  sku?: string | null
  codigo_barras?: string | null
  precio_unitario: number
  cantidad: number
  es_oferta?: boolean
  descuento_pct?: number
}

function money(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcTotal(items: CartItem[]): number {
  // Keep it simple; DB does definitive rounding.
  return Math.round(items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0) * 100) / 100
}

function buildWhatsAppUrl(e164: string): string {
  const digits = e164.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}`
}

export default function Pos() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [scanValue, setScanValue] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [metodoPago, setMetodoPago] = useState<CreateVentaParams['metodo_pago']>('efectivo')
  const [cliente, setCliente] = useState<ClienteSaldoItem | null>(null)
  const [clientePickerOpen, setClientePickerOpen] = useState(false)
  const [clienteQuery, setClienteQuery] = useState('')
  const [riskConfirmOpen, setRiskConfirmOpen] = useState(false)

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const total = useMemo(() => calcTotal(cart), [cart])

  const { data: productos = [], isLoading: productosLoading, isError: productosIsError, error: productosError, refetch: refetchProductos, isFetching: productosIsFetching } = useQuery({
    queryKey: ['productos', 'dropdown'],
    queryFn: () => productosApi.dropdown(),
  })

  type OfertaActivaRow = {
    id: string
    stock_id: string
    descuento_pct: number
    precio_oferta: number
    activa: boolean
    stock_deposito: { producto_id: string; ubicacion: string } | null
  }

  const ofertasActivasQuery = useQuery<OfertaActivaRow[]>({
    queryKey: ['ofertas', 'activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofertas_stock')
        .select('id,stock_id,descuento_pct,precio_oferta,activa,stock_deposito(producto_id,ubicacion)')
        .eq('activa', true)

      if (error) throw error
      return (data ?? []) as unknown as OfertaActivaRow[]
    },
    staleTime: 1000 * 60 * 1,
    retry: false,
  })

  const ofertaByProductoId = useMemo(() => {
    const map = new Map<string, { precio_oferta: number; descuento_pct: number }>()
    for (const row of ofertasActivasQuery.data ?? []) {
      const sd = row.stock_deposito
      if (!sd || sd.ubicacion !== 'Principal') continue
      const precio = typeof row.precio_oferta === 'string' ? Number(row.precio_oferta) : row.precio_oferta
      const desc = typeof row.descuento_pct === 'string' ? Number(row.descuento_pct) : row.descuento_pct
      if (sd.producto_id && Number.isFinite(precio)) {
        map.set(sd.producto_id, { precio_oferta: precio, descuento_pct: Number.isFinite(desc) ? desc : 30 })
      }
    }
    return map
  }, [ofertasActivasQuery.data])

  const productoIndex = useMemo(() => {
    const byCode = new Map<string, DropdownItem>()
    for (const p of productos) {
      if (p.codigo_barras) byCode.set(p.codigo_barras, p)
      if (p.sku) byCode.set(p.sku, p)
      byCode.set(p.id, p)
    }
    return byCode
  }, [productos])

  const resetVenta = useCallback(() => {
    setCart([])
    setMetodoPago('efectivo')
    setCliente(null)
    setIdempotencyKey(crypto.randomUUID())
    setRiskConfirmOpen(false)
    setScanValue('')
    queueMicrotask(() => inputRef.current?.focus())
  }, [])

  const addToCart = useCallback((p: { id: string; nombre: string; sku?: string | null; codigo_barras?: string | null; precio_actual?: number | null }) => {
    const basePrice = typeof p.precio_actual === 'number' ? p.precio_actual : null
    const oferta = ofertaByProductoId.get(p.id) ?? null
    const price = oferta ? oferta.precio_oferta : basePrice
    if (price === null) {
      toast.error('Producto sin precio. Revisar en Productos.')
      return
    }

    setCart((prev) => {
      const existing = prev.find((it) => it.producto_id === p.id)
      if (!existing) {
        return [
          ...prev,
          {
            producto_id: p.id,
            nombre: p.nombre,
            sku: p.sku ?? null,
            codigo_barras: p.codigo_barras ?? null,
            precio_unitario: price,
            cantidad: 1,
            es_oferta: !!oferta,
            descuento_pct: oferta?.descuento_pct,
          },
        ]
      }
      return prev.map((it) => it.producto_id === p.id ? { ...it, cantidad: it.cantidad + 1 } : it)
    })
  }, [ofertaByProductoId])

  const resolveAndAdd = useCallback(async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return

    const local = productoIndex.get(trimmed)
    if (local) {
      addToCart({
        id: local.id,
        nombre: local.nombre,
        sku: local.sku ?? null,
        codigo_barras: local.codigo_barras ?? null,
        precio_actual: local.precio_actual ?? null,
      })
      return
    }

    try {
      const res = await searchApi.global(trimmed, 5)
      const productosRes = res.productos ?? []
      if (productosRes.length === 0) {
        toast.error(`Producto no encontrado: ${trimmed}`)
        return
      }

      const exact = productosRes.find((p) => p.codigo_barras === trimmed || p.sku === trimmed || p.id === trimmed)
      const pick = exact ?? productosRes[0]
      if (!pick) {
        toast.error(`Producto no encontrado: ${trimmed}`)
        return
      }

      addToCart({
        id: pick.id,
        nombre: pick.nombre || 'Producto',
        sku: pick.sku ?? null,
        codigo_barras: pick.codigo_barras ?? null,
        precio_actual: typeof pick.precio_actual === 'number' ? pick.precio_actual : null,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error buscando producto'
      toast.error(msg)
    }
  }, [addToCart, productoIndex])

  const ventaMutation = useMutation({
    mutationFn: (params: CreateVentaParams) => ventasApi.create(params, idempotencyKey),
    onSuccess: (venta) => {
      toast.success(`Venta ${venta.status === 'existing' ? 'idempotente' : 'registrada'}: $${money(venta.monto_total)}`)
      resetVenta()
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.code === 'LOSS_RISK_CONFIRM_REQUIRED') {
          setRiskConfirmOpen(true)
          return
        }
        if (err.code === 'INSUFFICIENT_STOCK') {
          toast.error('Stock insuficiente para completar la venta')
          return
        }
        if (err.code === 'CREDIT_LIMIT_EXCEEDED') {
          toast.error('Límite de crédito excedido para este cliente')
          return
        }
      }
      const msg = err instanceof Error ? err.message : 'Error al procesar venta'
      toast.error(msg)
    },
  })

  const submitVenta = useCallback((confirmar_riesgo: boolean) => {
    if (cart.length === 0) {
      toast.error('Ticket vacío')
      return
    }

    if (metodoPago === 'cuenta_corriente' && !cliente) {
      toast.error('Selecciona un cliente para fiado')
      setClientePickerOpen(true)
      return
    }

    ventaMutation.mutate({
      metodo_pago: metodoPago,
      cliente_id: cliente?.cliente_id ?? null,
      confirmar_riesgo,
      items: cart.map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad })),
    })
  }, [cart, cliente, metodoPago, ventaMutation])

  // Focus input on mount, and keep it focused.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Hotkeys: F1 efectivo, F2 cliente/fiado, ESC limpiar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setMetodoPago('efectivo')
      }
      if (e.key === 'F2') {
        e.preventDefault()
        setMetodoPago('cuenta_corriente')
        setClientePickerOpen(true)
      }
      if (e.key === 'Escape') {
        if (riskConfirmOpen) {
          setRiskConfirmOpen(false)
          return
        }
        if (clientePickerOpen) {
          setClientePickerOpen(false)
          return
        }
        resetVenta()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [clientePickerOpen, resetVenta, riskConfirmOpen])

  const onScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = scanValue
    setScanValue('')
    await resolveAndAdd(value)
    inputRef.current?.focus()
  }

  const clienteListQuery = useQuery({
    queryKey: ['pos-clientes', clienteQuery],
    queryFn: () => clientesApi.list({ q: clienteQuery, limit: 30 }),
    enabled: clientePickerOpen,
  })

  const removeItem = (producto_id: string) => {
    setCart((prev) => prev.filter((it) => it.producto_id !== producto_id))
  }

  const adjustQty = (producto_id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => it.producto_id === producto_id ? { ...it, cantidad: it.cantidad + delta } : it)
        .filter((it) => it.cantidad > 0),
    )
  }

  if (productosLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <SkeletonTable />
      </div>
    )
  }

  if (productosIsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ErrorMessage
            message={parseErrorMessage(productosError)}
            type={detectErrorType(productosError)}
            onRetry={() => refetchProductos()}
            isRetrying={productosIsFetching}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-bold text-gray-900">POS</div>
            <div className="text-xs text-gray-500">Idempotency-Key: <span className="font-mono">{idempotencyKey.slice(0, 8)}</span></div>
          </div>
          <button
            onClick={resetVenta}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            title="Limpiar (ESC)"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Ticket */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <form onSubmit={onScanSubmit} className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onBlur={() => queueMicrotask(() => inputRef.current?.focus())}
              placeholder={productosLoading ? 'Cargando productos…' : 'Escanear o escribir código y Enter'}
              className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              title="Buscar/Agregar (Enter)"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                Escanea un producto para comenzar
              </div>
            ) : (
              cart.map((it) => (
                <div key={it.producto_id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{it.nombre}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {it.sku ? `SKU: ${it.sku}` : it.codigo_barras ? `CB: ${it.codigo_barras}` : it.producto_id.slice(0, 8)}
                    </div>
                    {it.es_oferta && (
                      <div className="mt-1 inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase bg-red-100 text-red-800 rounded-full border border-red-200">
                        OFERTA{typeof it.descuento_pct === 'number' ? ` ${Math.round(it.descuento_pct)}%` : ''}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${money(it.precio_unitario * it.cantidad)}</div>
                    <div className="text-xs text-gray-500">${money(it.precio_unitario)} c/u</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustQty(it.producto_id, -1)}
                      className="px-2 py-1 rounded bg-white border hover:bg-gray-100"
                      title="-1"
                    >
                      -
                    </button>
                    <div className="w-10 text-center font-semibold">{it.cantidad}</div>
                    <button
                      onClick={() => adjustQty(it.producto_id, +1)}
                      className="px-2 py-1 rounded bg-white border hover:bg-gray-100"
                      title="+1"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(it.producto_id)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    title="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Cobro */}
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">Total</div>
            <div className="text-3xl font-black text-gray-900">${money(total)}</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMetodoPago('efectivo')}
              className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${metodoPago === 'efectivo' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title="F1"
            >
              <Banknote className="w-5 h-5" />
              Efectivo
            </button>
            <button
              onClick={() => setMetodoPago('tarjeta')}
              className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${metodoPago === 'tarjeta' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <CreditCard className="w-5 h-5" />
              Tarjeta
            </button>
            <button
              onClick={() => { setMetodoPago('cuenta_corriente'); setClientePickerOpen(true) }}
              className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${metodoPago === 'cuenta_corriente' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title="F2"
            >
              <User className="w-5 h-5" />
              Fiado
            </button>
          </div>

          {/* Cliente seleccionado */}
          {metodoPago === 'cuenta_corriente' && (
            <div className="rounded-xl border p-3 bg-orange-50 border-orange-200">
              {cliente ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-orange-900 truncate">{cliente.nombre}</div>
                    <div className="text-sm text-orange-800">
                      Saldo: <span className="font-semibold">${money(cliente.saldo)}</span>
                      {cliente.limite_credito != null ? (
                        <span className="ml-2 text-orange-700">Límite: ${money(cliente.limite_credito)}</span>
                      ) : (
                        <span className="ml-2 inline-flex items-center gap-1 text-orange-700">
                          <AlertTriangle className="w-4 h-4" /> Sin límite configurado
                        </span>
                      )}
                    </div>
                    {cliente.whatsapp_e164 && (
                      <a
                        className="text-sm text-orange-700 underline"
                        href={buildWhatsAppUrl(cliente.whatsapp_e164)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setClientePickerOpen(true)}
                    className="px-3 py-2 rounded-lg bg-white border hover:bg-orange-100 text-orange-900 font-semibold"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-orange-900 font-semibold">Selecciona un cliente</div>
                  <button
                    onClick={() => setClientePickerOpen(true)}
                    className="px-3 py-2 rounded-lg bg-white border hover:bg-orange-100 text-orange-900 font-semibold"
                  >
                    Buscar
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => submitVenta(false)}
            disabled={ventaMutation.isPending || cart.length === 0}
            className="w-full py-4 rounded-xl bg-black text-white font-black text-lg hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {ventaMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
            Cobrar
          </button>
        </div>
      </div>

      {/* Cliente Picker Modal */}
      {clientePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="font-bold text-gray-900">Seleccionar Cliente</div>
              <button onClick={() => setClientePickerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                ✕
              </button>
            </div>
            <div className="p-4">
              <input
                value={clienteQuery}
                onChange={(e) => setClienteQuery(e.target.value)}
                placeholder="Buscar por nombre / teléfono / email"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />

              <div className="mt-3 max-h-[50vh] overflow-auto space-y-2">
                {clienteListQuery.isLoading ? (
                  <div className="py-10 flex items-center justify-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando…
                  </div>
                ) : (clienteListQuery.data ?? []).length === 0 ? (
                  <div className="py-10 text-center text-gray-500">Sin resultados</div>
                ) : (
                  (clienteListQuery.data ?? []).map((c) => (
                    <button
                      key={c.cliente_id}
                      onClick={() => { setCliente(c); setMetodoPago('cuenta_corriente'); setClientePickerOpen(false) }}
                      className="w-full text-left p-3 rounded-xl border hover:bg-gray-50"
                    >
                      <div className="font-bold text-gray-900">{c.nombre}</div>
                      <div className="text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                        {c.telefono && <span>{c.telefono}</span>}
                        <span>Saldo: <span className="font-semibold">${money(c.saldo)}</span></span>
                        {c.limite_credito != null ? (
                          <span>Límite: ${money(c.limite_credito)}</span>
                        ) : (
                          <span className="text-orange-700 inline-flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Sin límite
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Confirm Modal */}
      {riskConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-black text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Riesgo de pérdida
              </div>
              <button onClick={() => setRiskConfirmOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-700">
                El sistema detectó que al menos un producto puede estar por debajo del costo de reposición.
                Para continuar, se requiere confirmación explícita.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRiskConfirmOpen(false)}
                  className="flex-1 py-3 rounded-xl border font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setRiskConfirmOpen(false); submitVenta(true) }}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700"
                >
                  Confirmar y vender
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
