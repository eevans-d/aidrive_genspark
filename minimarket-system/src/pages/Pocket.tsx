import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Tag, TrendingDown, ArrowLeft, Camera, Loader2, Plus, Minus, Check } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import apiClient, { depositoApi, insightsApi } from '../lib/apiClient'
import type { ArbitrajeItem, DropdownItem } from '../lib/apiClient'
import { supabase } from '../lib/supabase'
import BarcodeScanner from '../components/BarcodeScanner'
import JsBarcode from 'jsbarcode'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'

// ============================================================================
// Types
// ============================================================================

interface ResolvedProduct {
  id: string
  nombre: string
  sku?: string
  codigo_barras?: string | null
  precio_actual?: number
}

type PocketView = 'scan' | 'actions'
type ActionMode = 'stock' | 'label' | 'price' | null

type OfertaActivaRow = {
  id: string
  descuento_pct: number
  precio_oferta: number
  activa: boolean
}

// ============================================================================
// Label Print Component
// ============================================================================

function LabelPreview({
  product,
  oferta,
  onPrint,
}: {
  product: ResolvedProduct
  oferta: OfertaActivaRow | null
  onPrint: () => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const barcode = product.codigo_barras || product.sku || product.id.slice(0, 12)
  const basePrice = product.precio_actual ?? null
  const offerPrice = oferta?.activa ? oferta.precio_oferta : null

  // Render barcode when component mounts
  useState(() => {
    // Use microtask to ensure ref is available
    queueMicrotask(() => {
      if (svgRef.current) {
        try {
          JsBarcode(svgRef.current, barcode, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
          })
        } catch {
          // If barcode fails, it'll show empty SVG
        }
      }
    })
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Print-ready label preview */}
      <div id="pocket-label" className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
        <div className="text-sm font-bold text-gray-800 mb-1 truncate">{product.nombre}</div>
        {oferta?.activa && (
          <div className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-black uppercase bg-red-100 text-red-800 rounded-full border border-red-200 mb-1">
            OFERTA {Number(oferta.descuento_pct).toFixed(0)}% OFF
          </div>
        )}
        {offerPrice != null ? (
          <div className="mb-2">
            {basePrice != null && (
              <div className="text-xs text-gray-500 line-through">
                ${basePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-2xl font-black text-red-700">
              ${offerPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ) : basePrice != null ? (
          <div className="text-2xl font-black text-gray-900 mb-2">
            ${basePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-2">Sin precio</div>
        )}
        <svg ref={svgRef} className="mx-auto" />
      </div>
      <button
        onClick={onPrint}
        className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-base"
      >
        Imprimir etiqueta
      </button>
      {/* Print styles injected */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pocket-label, #pocket-label * { visibility: visible !important; }
          #pocket-label {
            position: fixed; left: 0; top: 0;
            width: 58mm; border: none !important;
            padding: 2mm !important; margin: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Price Check Component
// ============================================================================

function PriceCheck({ product }: { product: ResolvedProduct }) {
  const { data: insights, isLoading } = useQuery<ArbitrajeItem>({
    queryKey: ['pocket-insights', product.id],
    queryFn: () => insightsApi.producto(product.id),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <div className="text-gray-500 text-sm">Sin datos de arbitraje para este producto.</div>
        {product.precio_actual != null && (
          <div className="mt-2 text-lg font-bold text-gray-800">
            Precio venta: ${product.precio_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>
    )
  }

  const isRisk = insights.riesgo_perdida
  const isLowMargin = insights.margen_bajo
  const isOk = !isRisk && !isLowMargin

  const semaphoreColor = isRisk ? 'bg-red-500' : isLowMargin ? 'bg-yellow-500' : 'bg-green-500'
  const semaphoreText = isRisk ? 'RIESGO PERDIDA' : isLowMargin ? 'MARGEN BAJO' : 'OK'
  const bgColor = isRisk ? 'bg-red-50 border-red-200' : isLowMargin ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'

  return (
    <div className={`rounded-xl border-2 p-4 ${bgColor}`}>
      {/* Semaphore */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-6 h-6 rounded-full ${semaphoreColor} shadow-lg`} />
        <span className={`font-bold text-lg ${isRisk ? 'text-red-700' : isLowMargin ? 'text-yellow-700' : 'text-green-700'}`}>
          {semaphoreText}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Costo proveedor:</span>
          <span className="font-semibold">${insights.costo_proveedor_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Precio venta:</span>
          <span className="font-semibold">${insights.precio_venta_actual?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Margen:</span>
          <span className={`font-bold ${isRisk ? 'text-red-600' : isLowMargin ? 'text-yellow-600' : 'text-green-600'}`}>
            {insights.margen_vs_reposicion?.toFixed(1) ?? 'N/A'}%
          </span>
        </div>
        {insights.delta_costo_pct != null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Cambio costo:</span>
            <span className={`font-semibold ${insights.delta_costo_pct > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {insights.delta_costo_pct > 0 ? '+' : ''}{insights.delta_costo_pct.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {isOk && (
        <div className="mt-3 flex items-center gap-2 text-green-700 text-sm font-medium">
          <Check className="w-4 h-4" />
          Precio alineado con costos
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Stock Update Component
// ============================================================================

function StockUpdate({ product, onDone }: { product: ResolvedProduct; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [cantidad, setCantidad] = useState('1')
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const inputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: () =>
      depositoApi.movimiento({
        producto_id: product.id,
        tipo,
        cantidad: parseInt(cantidad, 10),
        destino: 'Principal',
        observaciones: 'Pocket ingreso',
      }),
    onSuccess: () => {
      toast.success(`${tipo === 'entrada' ? '+' : '-'}${cantidad} ${product.nombre}`)
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
      setCantidad('1')
      onDone()
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Error al registrar movimiento'
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(cantidad, 10)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Cantidad inválida')
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Tipo toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTipo('entrada')}
          className={`flex-1 py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 ${
            tipo === 'entrada' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Plus className="w-5 h-5" />
          Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo('salida')}
          className={`flex-1 py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 ${
            tipo === 'salida' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Minus className="w-5 h-5" />
          Salida
        </button>
      </div>

      {/* Cantidad */}
      <div>
        <label className="text-sm text-gray-500 mb-1 block">Cantidad</label>
        <input
          ref={inputRef}
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 text-white disabled:opacity-50 ${
          tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {mutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
        Registrar {tipo}
      </button>
    </form>
  )
}

// ============================================================================
// Main Pocket Page
// ============================================================================

export default function Pocket() {
  const navigate = useNavigate()
  const [view, setView] = useState<PocketView>('scan')
  const [scannerActive, setScannerActive] = useState(true)
  const [resolvedProduct, setResolvedProduct] = useState<ResolvedProduct | null>(null)
  const [activeAction, setActiveAction] = useState<ActionMode>(null)
  const [isResolving, setIsResolving] = useState(false)

  // Fetch products dropdown for barcode lookup
  const {
    data: productos = [],
    isError: isProductosError,
    error: productosError,
    refetch: refetchProductos,
    isFetching: isFetchingProductos
  } = useQuery({
    queryKey: ['pocket-productos'],
    queryFn: () => apiClient.productos.dropdown(),
    staleTime: 1000 * 60 * 5,
  })

  const stockPrincipalQuery = useQuery<{ id: string } | null>({
    queryKey: ['pocket-stock-principal', resolvedProduct?.id],
    enabled: !!resolvedProduct?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_deposito')
        .select('id')
        .eq('producto_id', resolvedProduct!.id)
        .eq('ubicacion', 'Principal')
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data ?? null
    },
    staleTime: 1000 * 60 * 2,
    retry: false,
  })

  const stockId = stockPrincipalQuery.data?.id ?? null

  const ofertaActivaQuery = useQuery<OfertaActivaRow | null>({
    queryKey: ['pocket-oferta-activa', stockId],
    enabled: !!stockId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofertas_stock')
        .select('id,descuento_pct,precio_oferta,activa')
        .eq('stock_id', stockId!)
        .eq('activa', true)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data ?? null
    },
    staleTime: 1000 * 60 * 1,
    retry: false,
  })

  const resolveProduct = useCallback(async (code: string) => {
    setIsResolving(true)
    setScannerActive(false)

    try {
      // 1. Try matching by codigo_barras in dropdown
      const byBarcode = productos.find(
        (p) => p.codigo_barras === code
      )
      if (byBarcode) {
        setResolvedProduct({
          id: byBarcode.id,
          nombre: byBarcode.nombre,
          sku: byBarcode.sku ?? undefined,
          codigo_barras: byBarcode.codigo_barras ?? undefined,
          precio_actual: byBarcode.precio_actual ?? undefined,
        })
        setView('actions')
        setIsResolving(false)
        return
      }

      // 2. Use search API for more comprehensive matching
      const results = await apiClient.search.global(code, 5)
      const first = results.productos[0]
      if (first) {
        setResolvedProduct({
          id: first.id,
          nombre: first.nombre ?? 'Sin nombre',
          sku: first.sku ?? undefined,
          codigo_barras: first.codigo_barras ?? undefined,
          precio_actual: first.precio_actual ?? undefined,
        })
        setView('actions')
        setIsResolving(false)
        return
      }

      // 3. No match
      toast.error(`Producto no encontrado: ${code}`)
      setScannerActive(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error buscando producto'
      toast.error(msg)
      setScannerActive(true)
    } finally {
      setIsResolving(false)
    }
  }, [productos])

  const handleReset = useCallback(() => {
    setResolvedProduct(null)
    setActiveAction(null)
    setView('scan')
    setScannerActive(true)
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col safe-area-inset">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/')} className="p-1 -ml-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold flex-1">Pocket Manager</h1>
        {resolvedProduct && (
          <button
            onClick={handleReset}
            className="text-sm bg-white/20 px-3 py-1 rounded-lg font-medium"
          >
            Nuevo scan
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Scanner View */}
        {view === 'scan' && (
          <>
            {isProductosError && (
              <ErrorMessage
                message={parseErrorMessage(productosError, import.meta.env.PROD)}
                type={detectErrorType(productosError)}
                onRetry={() => refetchProductos()}
                isRetrying={isFetchingProductos}
                size="sm"
              />
            )}
            <BarcodeScanner
              isActive={scannerActive}
              onScan={resolveProduct}
              onClose={() => navigate('/')}
            />
            {isResolving && (
              <div className="flex items-center justify-center gap-2 py-4 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Buscando producto...</span>
              </div>
            )}
          </>
        )}

        {/* Actions View */}
        {view === 'actions' && resolvedProduct && (
          <>
            {/* Product card */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-lg font-bold text-gray-800">{resolvedProduct.nombre}</div>
              <div className="text-sm text-gray-500 mt-0.5">
                {resolvedProduct.sku && <span>SKU: {resolvedProduct.sku}</span>}
                {resolvedProduct.codigo_barras && (
                  <span>{resolvedProduct.sku ? ' | ' : ''}Cod: {resolvedProduct.codigo_barras}</span>
                )}
              </div>
              {resolvedProduct.precio_actual != null && (
                <div className="text-xl font-black text-blue-600 mt-1">
                  ${resolvedProduct.precio_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            {/* 3 Giant Action Buttons */}
            {!activeAction && (
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setActiveAction('stock')}
                  className="flex items-center gap-4 p-5 bg-green-600 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
                >
                  <Package className="w-10 h-10 shrink-0" />
                  <div className="text-left">
                    <div className="text-lg font-bold">Actualizar Stock</div>
                    <div className="text-sm opacity-80">Entrada o salida de mercadería</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveAction('label')}
                  className="flex items-center gap-4 p-5 bg-purple-600 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
                >
                  <Tag className="w-10 h-10 shrink-0" />
                  <div className="text-left">
                    <div className="text-lg font-bold">Imprimir Etiqueta</div>
                    <div className="text-sm opacity-80">Etiqueta 58mm con código de barras</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveAction('price')}
                  className="flex items-center gap-4 p-5 bg-orange-600 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
                >
                  <TrendingDown className="w-10 h-10 shrink-0" />
                  <div className="text-left">
                    <div className="text-lg font-bold">Verificar Precio</div>
                    <div className="text-sm opacity-80">Costo vs venta, semáforo riesgo</div>
                  </div>
                </button>
              </div>
            )}

            {/* Action Panels */}
            {activeAction && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setActiveAction(null)}
                  className="text-sm text-blue-600 font-medium self-start flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a acciones
                </button>

                {activeAction === 'stock' && (
                  <StockUpdate product={resolvedProduct} onDone={handleReset} />
                )}
                {activeAction === 'label' && (
                  <LabelPreview product={resolvedProduct} oferta={ofertaActivaQuery.data ?? null} onPrint={handlePrint} />
                )}
                {activeAction === 'price' && (
                  <PriceCheck product={resolvedProduct} />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom scan button (when in actions view, quick re-scan) */}
      {view === 'actions' && !activeAction && (
        <div className="p-4 border-t bg-white shrink-0">
          <button
            onClick={handleReset}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Escanear otro producto
          </button>
        </div>
      )}
    </div>
  )
}
