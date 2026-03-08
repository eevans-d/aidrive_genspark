import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast, Toaster } from 'sonner'
import { ArrowLeft, Banknote, CreditCard, Loader2, Trash2, User, AlertTriangle } from 'lucide-react'

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
import { parseErrorMessage, detectErrorType, extractRequestId } from '../components/errorMessageUtils'
import { SkeletonTable } from '../components/Skeleton'
import { money, calcTotal } from '../utils/currency'
import { ProductCombobox } from '../components/ProductCombobox'
import { ClienteCombobox } from '../components/ClienteCombobox'
import { Input } from '../components/ui/input'

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

function buildWhatsAppUrl(e164: string): string {
  const digits = e164.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}`
}

export default function Pos() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isProcessingScan = useRef(false)

  // Cross-tab protection: detect if POS is already open in another tab
  const [otherTabActive, setOtherTabActive] = useState(false)
  const tabId = useRef(crypto.randomUUID())

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('pos-lock')
    // Announce this tab
    channel.postMessage({ type: 'pos-ping', tabId: tabId.current })
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'pos-ping' && e.data.tabId !== tabId.current) {
        setOtherTabActive(true)
        // Reply so the other tab knows we exist
        channel.postMessage({ type: 'pos-pong', tabId: tabId.current })
      }
      if (e.data?.type === 'pos-pong' && e.data.tabId !== tabId.current) {
        setOtherTabActive(true)
      }
    }
    channel.addEventListener('message', onMessage)
    return () => {
      channel.removeEventListener('message', onMessage)
      channel.close()
    }
  }, [])

  const [cart, setCart] = useState<CartItem[]>([])
  const [lastSale, setLastSale] = useState<{ items: CartItem[]; total: number } | null>(null)
  const [metodoPago, setMetodoPago] = useState<CreateVentaParams['metodo_pago']>('efectivo')
  const [cliente, setCliente] = useState<ClienteSaldoItem | null>(null)
  const [clientePickerOpen, setClientePickerOpen] = useState(false)
  const [riskConfirmOpen, setRiskConfirmOpen] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState<DropdownItem[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showQuickCreateCliente, setShowQuickCreateCliente] = useState(false)
  const [quickCreateName, setQuickCreateName] = useState('')

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const total = useMemo(() => calcTotal(cart), [cart])

  const change = useMemo(() => {
    const amt = parseFloat(paymentAmount)
    if (!Number.isFinite(amt) || amt < total) return null
    return amt - total
  }, [paymentAmount, total])

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
    setPaymentAmount('')
    setRecentlyAdded([])
  }, [])

  const addToCart = useCallback((p: { id: string; nombre: string; sku?: string | null; codigo_barras?: string | null; precio_actual?: number | null }) => {
    const basePrice = typeof p.precio_actual === 'number' ? p.precio_actual : null
    const oferta = ofertaByProductoId.get(p.id) ?? null
    const price = oferta ? oferta.precio_oferta : basePrice
    if (price === null) {
      toast.error('Producto sin precio. Revisar en Productos.', { duration: 6000 })
      return
    }

    navigator.vibrate?.(25)

    // Track recently added for quick re-add chips
    setRecentlyAdded(prev => {
      const filtered = prev.filter(r => r.id !== p.id)
      return [{ id: p.id, nombre: p.nombre, sku: p.sku ?? null, codigo_barras: p.codigo_barras ?? null, precio_actual: p.precio_actual ?? null }, ...filtered].slice(0, 5)
    })

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
      toast.error(parseErrorMessage(err))
    }
  }, [addToCart, productoIndex])

  const ventaMutation = useMutation({
    mutationFn: (params: CreateVentaParams) => ventasApi.create(params, idempotencyKey),
    retry: (failureCount, error) => {
      if (failureCount >= 1) return false
      // Only retry on network/server errors, not applicative 4xx
      if (error instanceof ApiError) {
        return error.status >= 500
      }
      return true // network error (no ApiError status) → retry
    },
    onSuccess: (venta) => {
      toast.success(`Venta ${venta.status === 'existing' ? 'idempotente' : 'registrada'}: $${money(venta.monto_total)}`)
      navigator.vibrate?.([30, 50, 30])
      setLastSale({ items: [...cart], total: venta.monto_total })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      resetVenta()
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.code === 'LOSS_RISK_CONFIRM_REQUIRED') {
          setRiskConfirmOpen(true)
          return
        }
        if (err.code === 'INSUFFICIENT_STOCK') {
          toast.error('Stock insuficiente para completar la venta', { duration: Infinity })
          return
        }
        if (err.code === 'CREDIT_LIMIT_EXCEEDED') {
          toast.error('Límite de crédito excedido para este cliente', { duration: Infinity })
          return
        }
      }
      const msg = err instanceof ApiError ? err.message : parseErrorMessage(err)
      toast.error(msg, { duration: Infinity })
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

  // Hotkeys: F1 efectivo, F2 cliente/fiado, F3 tarjeta, F4 cobrar, ESC limpiar
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
      if (e.key === 'F3') {
        e.preventDefault()
        setMetodoPago('tarjeta')
      }
      if (e.key === 'F4') {
        e.preventDefault()
        submitVenta(false)
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
        if (cart.length > 0 && !window.confirm('¿Descartar el ticket actual?')) {
          return
        }
        resetVenta()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [cart.length, clientePickerOpen, resetVenta, riskConfirmOpen, submitVenta])

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
            requestId={extractRequestId(productosError)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      {/* Cross-tab warning */}
      {otherTabActive && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-amber-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          POS abierto en otra pestaña. Operar en ambas puede causar inconsistencias.
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-bold text-gray-900">POS</div>
            <div className="text-xs text-gray-500">Idempotency-Key: <span className="font-mono">{idempotencyKey.slice(0, 8)}</span></div>
          </div>
          <button
            onClick={() => {
              if (cart.length > 0 && !window.confirm('¿Descartar el ticket actual?')) return
              resetVenta()
            }}
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
          {/* Product search with autocomplete + barcode scanner support */}
          <ProductCombobox
            value={null}
            onSelect={(product) => {
              addToCart({
                id: product.id,
                nombre: product.nombre,
                sku: product.sku ?? null,
                codigo_barras: product.codigo_barras ?? null,
                precio_actual: product.precio_actual ?? null,
              })
            }}
            onBarcodeScan={async (barcode) => {
              if (isProcessingScan.current) return
              isProcessingScan.current = true
              try {
                await resolveAndAdd(barcode)
              } finally {
                isProcessingScan.current = false
              }
            }}
            mode="inline"
            autoFocus
            placeholder={productosLoading ? 'Cargando productos…' : 'Escanear o buscar producto...'}
          />

          {/* Recently added chips for quick re-add */}
          {recentlyAdded.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {recentlyAdded.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 truncate max-w-[140px] transition-colors"
                  title={`Agregar ${p.nombre}`}
                >
                  + {p.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2" aria-live="polite" aria-label="Carrito de compras">
            {/* M5: Repeat Last Sale Banner */}
            {lastSale && cart.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between mb-3 shadow-sm">
                <div className="text-sm text-emerald-800">
                  <span className="font-semibold">Última venta:</span> {lastSale.items.length} producto{lastSale.items.length !== 1 ? 's' : ''} — <span className="font-bold">${money(lastSale.total)}</span>
                </div>
                <button
                  onClick={() => setCart(lastSale.items)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-md hover:bg-emerald-700 transition"
                  title="Volver a cargar los productos de la última venta"
                >
                  Repetir
                </button>
              </div>
            )}

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
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded bg-white border hover:bg-gray-100 text-lg font-bold"
                      title="-1"
                      aria-label={`Reducir cantidad de ${it.nombre}`}
                    >
                      -
                    </button>
                    <div className="w-10 text-center font-semibold">{it.cantidad}</div>
                    <button
                      onClick={() => adjustQty(it.producto_id, +1)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded bg-white border hover:bg-gray-100 text-lg font-bold"
                      title="+1"
                      aria-label={`Aumentar cantidad de ${it.nombre}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(it.producto_id)}
                    className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
                    title="Quitar"
                    aria-label={`Quitar ${it.nombre} del carrito`}
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

          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Metodo de pago">
            <button
              onClick={() => setMetodoPago('efectivo')}
              className={`py-3 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 ${metodoPago === 'efectivo' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title="F1"
              role="radio"
              aria-checked={metodoPago === 'efectivo'}
            >
              <span className="flex items-center gap-1.5"><Banknote className="w-5 h-5" /> Efectivo</span>
              <span className="text-[10px] opacity-70">F1</span>
            </button>
            <button
              onClick={() => setMetodoPago('tarjeta')}
              className={`py-3 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 ${metodoPago === 'tarjeta' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title="F3"
              role="radio"
              aria-checked={metodoPago === 'tarjeta'}
            >
              <span className="flex items-center gap-1.5"><CreditCard className="w-5 h-5" /> Tarjeta</span>
              <span className="text-[10px] opacity-70">F3</span>
            </button>
            <button
              onClick={() => { setMetodoPago('cuenta_corriente'); setClientePickerOpen(true) }}
              className={`py-3 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 ${metodoPago === 'cuenta_corriente' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title="F2"
              role="radio"
              aria-checked={metodoPago === 'cuenta_corriente'}
            >
              <span className="flex items-center gap-1.5"><User className="w-5 h-5" /> Fiado</span>
              <span className="text-[10px] opacity-70">F2</span>
            </button>
          </div>

          {/* Change calculator for cash payments */}
          {metodoPago === 'efectivo' && cart.length > 0 && (
            <div className="rounded-xl border p-3 bg-green-50 border-green-200 space-y-2">
              <label className="text-sm text-green-800 font-medium">Monto recibido</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`$${money(total)}`}
                className="text-lg h-12 bg-white"
              />
              {change !== null && (
                <div className="text-2xl font-black text-green-700 text-center py-1">
                  Vuelto: ${money(change)}
                </div>
              )}
            </div>
          )}

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
            aria-busy={ventaMutation.isPending}
          >
            {ventaMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
            Cobrar
            <span className="text-xs opacity-60 font-normal ml-2">F4</span>
          </button>
        </div>
      </div>

      {/* Cliente Picker Modal with ClienteCombobox */}
      {clientePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border overflow-hidden" role="dialog" aria-modal="true" aria-label="Seleccionar cliente">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="font-bold text-gray-900">Seleccionar Cliente</div>
              <button onClick={() => { setClientePickerOpen(false); setShowQuickCreateCliente(false) }} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="p-4">
              <ClienteCombobox
                value={cliente}
                onSelect={(c) => {
                  setCliente(c)
                  setMetodoPago('cuenta_corriente')
                  setClientePickerOpen(false)
                  setShowQuickCreateCliente(false)
                }}
                onCreateNew={(name) => {
                  setQuickCreateName(name)
                  setShowQuickCreateCliente(true)
                }}
                mode="inline"
                autoFocus
                placeholder="Buscar por nombre / teléfono / email"
              />

              {/* Quick create client form */}
              {showQuickCreateCliente && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const form = e.currentTarget
                    const nombre = (form.elements.namedItem('qc_nombre') as HTMLInputElement).value.trim()
                    const telefono = (form.elements.namedItem('qc_telefono') as HTMLInputElement).value.trim()
                    if (!nombre) return
                    try {
                      await clientesApi.create({ nombre, telefono: telefono || null, email: null })
                      const clients = await clientesApi.list({ q: nombre, limit: 1 })
                      if (clients.length > 0) {
                        setCliente(clients[0] ?? null)
                        setMetodoPago('cuenta_corriente')
                      }
                      setClientePickerOpen(false)
                      setShowQuickCreateCliente(false)
                      toast.success(`Cliente "${nombre}" creado`)
                    } catch (err) {
                      toast.error(parseErrorMessage(err))
                    }
                  }}
                  className="mt-3 p-3 border rounded-xl bg-gray-50 space-y-2"
                >
                  <div className="text-sm font-semibold text-gray-700">Crear cliente rápido</div>
                  <input
                    name="qc_nombre"
                    defaultValue={quickCreateName}
                    placeholder="Nombre *"
                    required
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    autoFocus
                  />
                  <input
                    name="qc_telefono"
                    placeholder="Teléfono (opcional)"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickCreateCliente(false)}
                      className="flex-1 py-2 rounded-lg border text-gray-700 text-sm hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                    >
                      Crear y seleccionar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risk Confirm Modal */}
      {riskConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden" role="alertdialog" aria-modal="true" aria-label="Confirmacion de riesgo">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-black text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Riesgo de pérdida
              </div>
              <button onClick={() => setRiskConfirmOpen(false)} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Cerrar">✕</button>
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
