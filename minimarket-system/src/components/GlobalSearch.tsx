import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Users, CheckSquare, X, ClipboardList, UserCircle, Plus, Warehouse, ArrowRight, Printer, TrendingDown, ShoppingCart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useGlobalSearch } from '../hooks/useGlobalSearch'
import { insightsApi, type ArbitrajeItem } from '../lib/apiClient'
import type { SearchResultItem } from '../lib/apiClient'
import { useUserRole } from '../hooks/useUserRole'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

type ResultCategory = 'productos' | 'proveedores' | 'tareas' | 'pedidos' | 'clientes'

interface FlatResult {
  item: SearchResultItem
  category: ResultCategory
  index: number
}

interface QuickAction {
  id: string
  label: string
  icon: typeof Package
  path: string
  description: string
}

const CATEGORY_CONFIG: Record<ResultCategory, { label: string; icon: typeof Package; path: string }> = {
  productos: { label: 'Productos', icon: Package, path: '/productos' },
  pedidos: { label: 'Pedidos', icon: ClipboardList, path: '/pedidos' },
  clientes: { label: 'Clientes', icon: UserCircle, path: '/clientes' },
  proveedores: { label: 'Proveedores', icon: Users, path: '/proveedores' },
  tareas: { label: 'Tareas', icon: CheckSquare, path: '/tareas' },
}

const CATEGORIES: ResultCategory[] = ['productos', 'pedidos', 'clientes', 'proveedores', 'tareas']

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-task', label: 'Nueva tarea', icon: Plus, path: '/tareas', description: 'Crear tarea rapida' },
  { id: 'deposit', label: 'Registrar entrada', icon: Warehouse, path: '/deposito', description: 'Ingreso de mercaderia' },
  { id: 'new-order', label: 'Nuevo pedido', icon: ClipboardList, path: '/pedidos', description: 'Crear pedido de cliente' },
  { id: 'view-stock', label: 'Ver stock', icon: Package, path: '/stock', description: 'Estado del inventario' },
]

const RECENT_SEARCHES_KEY = 'minimarket-recent-searches'
const MAX_RECENT_SEARCHES = 5

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string): void {
  try {
    const recent = getRecentSearches().filter(s => s !== query)
    recent.unshift(query)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES)))
  } catch {
    // Ignore localStorage errors
  }
}

export default function GlobalSearch({ isOpen, onClose, initialQuery = '' }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { canAccess } = useUserRole()

  const [productoAccion, setProductoAccion] = useState<SearchResultItem | null>(null)
  const [productoView, setProductoView] = useState<'menu' | 'price' | 'label'>('menu')

  const { data, isLoading } = useGlobalSearch(query, isOpen)

  // Build flat results for keyboard navigation
  const flatResults = useMemo<FlatResult[]>(() => {
    if (!data) return []
    const out: FlatResult[] = []
    let idx = 0
    for (const category of CATEGORIES) {
      for (const item of (data[category] || [])) {
        out.push({ item, category, index: idx++ })
      }
    }
    return out
  }, [data])

  // Total navigable items: quick actions (when no query) or search results
  const hasQuery = query.length >= 2
  const totalItems = hasQuery ? flatResults.length : QUICK_ACTIONS.length + recentSearches.length

  // Focus input and load recent searches when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setSelectedIndex(0)
      setRecentSearches(getRecentSearches())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, initialQuery])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [data, query])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]')
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleNavigateToResult = useCallback((result: FlatResult) => {
    addRecentSearch(query)
    const config = CATEGORY_CONFIG[result.category]

    if (result.category === 'productos') {
      setProductoAccion(result.item)
      setProductoView('menu')
      return
    }

    // For pedidos, navigate to the specific order
    if (result.category === 'pedidos') {
      navigate('/pedidos', { state: { highlightId: result.item.id } })
    } else {
      navigate(config.path)
    }
    onClose()
  }, [navigate, onClose, query, setProductoAccion])

  const handleQuickAction = useCallback((action: QuickAction) => {
    navigate(action.path, { state: { quickAction: action.id } })
    onClose()
  }, [navigate, onClose])

  const handleRecentSearch = useCallback((search: string) => {
    setQuery(search)
  }, [])

  const productoInsightsQuery = useQuery<ArbitrajeItem>({
    queryKey: ['global-search', 'insights', productoAccion?.id],
    queryFn: () => insightsApi.producto(productoAccion!.id),
    enabled: !!productoAccion && productoView === 'price',
    retry: false,
  })

  const printLabel = useCallback(async () => {
    // Ensure barcode is rendered before printing
    await new Promise((r) => setTimeout(r, 10))
    window.print()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (productoAccion) return
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1))
        break
      case 'ArrowUp':
        if (productoAccion) return
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        if (productoAccion) return
        e.preventDefault()
        if (hasQuery) {
          if (flatResults[selectedIndex]) {
            handleNavigateToResult(flatResults[selectedIndex])
          }
        } else {
          // In no-query mode: recent searches first, then quick actions
          if (selectedIndex < recentSearches.length) {
            const search = recentSearches[selectedIndex]
            if (search) handleRecentSearch(search)
          } else {
            const actionIdx = selectedIndex - recentSearches.length
            if (QUICK_ACTIONS[actionIdx]) {
              handleQuickAction(QUICK_ACTIONS[actionIdx])
            }
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        if (productoAccion) {
          setProductoAccion(null)
          setProductoView('menu')
        } else {
          onClose()
        }
        break
    }
  }, [flatResults, selectedIndex, handleNavigateToResult, handleQuickAction, handleRecentSearch, onClose, hasQuery, totalItems, recentSearches, productoAccion])

  if (!isOpen) return null

  const getDisplayName = (item: SearchResultItem, category: ResultCategory): string => {
    if (category === 'tareas') return item.titulo || ''
    if (category === 'pedidos') return `#${item.numero_pedido} - ${item.cliente_nombre || ''}`
    return item.nombre || ''
  }

  const getSubtext = (item: SearchResultItem, category: ResultCategory): string => {
    if (category === 'productos') {
      const parts: string[] = []
      if (item.sku) parts.push(item.sku)
      if (item.marca) parts.push(item.marca)
      if (item.precio_actual) parts.push(`$${Number(item.precio_actual).toFixed(2)}`)
      return parts.join(' · ')
    }
    if (category === 'proveedores') {
      return item.email || item.contacto || ''
    }
    if (category === 'tareas') {
      const parts: string[] = []
      if (item.prioridad) parts.push(item.prioridad)
      if (item.estado) parts.push(item.estado)
      return parts.join(' · ')
    }
    if (category === 'pedidos') {
      const parts: string[] = []
      if (item.estado) parts.push(item.estado)
      if (item.estado_pago) parts.push(item.estado_pago)
      if (item.monto_total) parts.push(`$${Number(item.monto_total).toFixed(2)}`)
      return parts.join(' · ')
    }
    if (category === 'clientes') {
      const parts: string[] = []
      if (item.telefono) parts.push(item.telefono)
      if (item.email) parts.push(item.email)
      return parts.join(' · ')
    }
    return ''
  }

  let globalIdx = -1

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos, pedidos, clientes, proveedores, tareas..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border">
            ESC
          </kbd>
        </div>

        {/* Content */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {/* No query: show recent searches + quick actions */}
          {!hasQuery && (
            <>
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 uppercase tracking-wider">
                    Busquedas recientes
                  </div>
                  {recentSearches.map((search, idx) => {
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={`recent-${idx}`}
                        data-selected={isSelected}
                        onClick={() => handleRecentSearch(search)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Search className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className="text-sm">{search}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 uppercase tracking-wider">
                  Acciones rapidas
                </div>
                {QUICK_ACTIONS.map((action, idx) => {
                  const itemIdx = recentSearches.length + idx
                  const isSelected = itemIdx === selectedIndex
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      data-selected={isSelected}
                      onClick={() => handleQuickAction(action)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{action.label}</div>
                        <div className="text-xs text-gray-400">{action.description}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-300" />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Loading state */}
          {hasQuery && isLoading && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Buscando...
            </div>
          )}

          {/* No results */}
          {hasQuery && !isLoading && flatResults.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Search results */}
          {hasQuery && data && flatResults.length > 0 && (
            <>
              {CATEGORIES.map((category) => {
                const items = data[category] || []
                if (items.length === 0) return null

                const config = CATEGORY_CONFIG[category]
                const Icon = config.icon

                return (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 uppercase tracking-wider">
                      {config.label} ({items.length})
                    </div>
                    {items.map((item) => {
                      globalIdx++
                      const currentIdx = globalIdx
                      const isSelected = currentIdx === selectedIndex

                      return (
                        <button
                          key={`${category}-${item.id}`}
                          data-selected={isSelected}
                          onClick={() => handleNavigateToResult({ item, category, index: currentIdx })}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {getDisplayName(item, category)}
                            </div>
                            {getSubtext(item, category) && (
                              <div className="text-xs text-gray-400 truncate">
                                {getSubtext(item, category)}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-400 border-t bg-gray-50">
          <span><kbd className="px-1 py-0.5 bg-white rounded border">↑↓</kbd> navegar</span>
          <span><kbd className="px-1 py-0.5 bg-white rounded border">↩</kbd> ir</span>
          <span><kbd className="px-1 py-0.5 bg-white rounded border">esc</kbd> cerrar</span>
        </div>
      </div>

      {/* Producto: Scan & Action modal */}
      {productoAccion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setProductoAccion(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-black text-gray-900 truncate">{productoAccion.nombre ?? 'Producto'}</div>
                <div className="text-xs text-gray-500 truncate">
                  {productoAccion.sku ? `SKU: ${productoAccion.sku}` : productoAccion.codigo_barras ? `CB: ${productoAccion.codigo_barras}` : productoAccion.id}
                  {typeof productoAccion.precio_actual === 'number' ? ` · $${productoAccion.precio_actual.toFixed(2)}` : ''}
                </div>
              </div>
              <button
                onClick={() => { setProductoAccion(null); setProductoView('menu') }}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Menu */}
            {productoView === 'menu' && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setProductoView('price')}
                  className="p-3 rounded-xl border bg-white hover:bg-gray-50 text-left flex items-center gap-3"
                >
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-bold text-gray-900">Verificar precio</div>
                    <div className="text-xs text-gray-500">Costo vs venta (insights)</div>
                  </div>
                </button>

                <button
                  onClick={() => setProductoView('label')}
                  className="p-3 rounded-xl border bg-white hover:bg-gray-50 text-left flex items-center gap-3"
                >
                  <Printer className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-bold text-gray-900">Imprimir etiqueta</div>
                    <div className="text-xs text-gray-500">58mm (MVP)</div>
                  </div>
                </button>

                <button
                  onClick={() => { navigate('/pos'); setProductoAccion(null); onClose() }}
                  disabled={!canAccess('/pos')}
                  className="p-3 rounded-xl border bg-white hover:bg-gray-50 text-left flex items-center gap-3 disabled:opacity-50"
                  title={!canAccess('/pos') ? 'Sin permiso' : 'Ir a POS'}
                >
                  <ShoppingCart className="w-5 h-5 text-gray-900" />
                  <div>
                    <div className="font-bold text-gray-900">Ir a POS</div>
                    <div className="text-xs text-gray-500">Cobrar rápido</div>
                  </div>
                </button>

                <button
                  onClick={() => { navigate('/deposito'); setProductoAccion(null); onClose() }}
                  disabled={!canAccess('/deposito')}
                  className="p-3 rounded-xl border bg-white hover:bg-gray-50 text-left flex items-center gap-3 disabled:opacity-50"
                  title={!canAccess('/deposito') ? 'Sin permiso' : 'Ir a Depósito'}
                >
                  <Warehouse className="w-5 h-5 text-blue-700" />
                  <div>
                    <div className="font-bold text-gray-900">Ir a Depósito</div>
                    <div className="text-xs text-gray-500">Actualizar stock</div>
                  </div>
                </button>

                <button
                  onClick={() => { navigate('/pocket'); setProductoAccion(null); onClose() }}
                  disabled={!canAccess('/pocket')}
                  className="p-3 rounded-xl border bg-white hover:bg-gray-50 text-left flex items-center gap-3 disabled:opacity-50 sm:col-span-2"
                  title={!canAccess('/pocket') ? 'Sin permiso' : 'Ir a Pocket'}
                >
                  <Warehouse className="w-5 h-5 text-green-700" />
                  <div>
                    <div className="font-bold text-gray-900">Abrir Pocket</div>
                    <div className="text-xs text-gray-500">PWA móvil (scanner cámara)</div>
                  </div>
                </button>
              </div>
            )}

            {/* Price view */}
            {productoView === 'price' && (
              <div className="p-4 space-y-3">
                <button
                  onClick={() => setProductoView('menu')}
                  className="text-sm text-blue-600 font-medium"
                >
                  ← Volver
                </button>

                {productoInsightsQuery.isLoading ? (
                  <div className="text-sm text-gray-500">Cargando insights…</div>
                ) : productoInsightsQuery.isError ? (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    Error cargando insights
                  </div>
                ) : productoInsightsQuery.data ? (
                  (() => {
                    const it = productoInsightsQuery.data
                    const isRisk = it.riesgo_perdida
                    const isLow = it.margen_bajo && !it.riesgo_perdida
                    const semaphore = isRisk ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'
                    const bg = isRisk ? 'bg-red-50 border-red-200' : isLow ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                    return (
                      <div className={`rounded-xl border p-4 ${bg}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${semaphore}`} />
                          <div className="font-black text-gray-900">
                            {isRisk ? 'RIESGO PÉRDIDA' : isLow ? 'MARGEN BAJO' : 'OK'}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-600">Costo prov.</div>
                          <div className="text-right font-semibold">${Number(it.costo_proveedor_actual).toFixed(2)}</div>
                          <div className="text-gray-600">Venta</div>
                          <div className="text-right font-semibold">${Number(it.precio_venta_actual ?? 0).toFixed(2)}</div>
                          <div className="text-gray-600">Margen</div>
                          <div className="text-right font-semibold">{Number(it.margen_vs_reposicion ?? 0).toFixed(1)}%</div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-sm text-gray-500">Sin datos</div>
                )}
              </div>
            )}

            {/* Label view (MVP) */}
            {productoView === 'label' && (
              <LabelPrintView
                producto={productoAccion}
                onBack={() => setProductoView('menu')}
                onPrint={printLabel}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LabelPrintView({
  producto,
  onBack,
  onPrint,
}: {
  producto: SearchResultItem
  onBack: () => void
  onPrint: () => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const barcode = producto.codigo_barras || producto.sku || producto.id.slice(0, 12)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import('jsbarcode')
        const JsBarcode = (mod as any).default ?? mod
        if (cancelled) return
        if (svgRef.current) {
          JsBarcode(svgRef.current, barcode, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
          })
        }
      } catch {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [barcode])

  return (
    <div className="p-4 space-y-3">
      <button onClick={onBack} className="text-sm text-blue-600 font-medium">← Volver</button>
      <div id="global-search-label" className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
        <div className="text-sm font-bold text-gray-800 mb-1 truncate">{producto.nombre ?? 'Producto'}</div>
        {typeof producto.precio_actual === 'number' ? (
          <div className="text-2xl font-black text-gray-900 mb-2">
            ${producto.precio_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-2">Sin precio</div>
        )}
        <svg ref={svgRef} className="mx-auto" />
      </div>
      <button onClick={onPrint} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-base">
        Imprimir etiqueta
      </button>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #global-search-label, #global-search-label * { visibility: visible !important; }
          #global-search-label {
            position: fixed; left: 0; top: 0;
            width: 58mm; border: none !important;
            padding: 2mm !important; margin: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
