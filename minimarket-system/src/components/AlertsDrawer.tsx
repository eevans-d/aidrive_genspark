import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Package, Clock, AlertTriangle, X, ExternalLink, TrendingDown, ShoppingCart, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAlertas } from '../hooks/useAlertas'
import { ofertasApi, tareasApi, preciosApi } from '../lib/apiClient'
import type { ArbitrajeItem, OportunidadCompraItem } from '../lib/apiClient'
import type { StockBajoItem, VencimientoItem, AlertaPrecioItem, TareaPendienteItem } from '../hooks/useAlertas'

interface AlertsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const NIVEL_STOCK_COLORS: Record<string, string> = {
  sin_stock: 'bg-red-100 text-red-700',
  critico: 'bg-orange-100 text-orange-700',
  bajo: 'bg-yellow-100 text-yellow-700',
}

const NIVEL_ALERTA_COLORS: Record<string, string> = {
  vencido: 'bg-red-100 text-red-700',
  urgente: 'bg-orange-100 text-orange-700',
  proximo: 'bg-yellow-100 text-yellow-700',
}

const SEVERIDAD_COLORS: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-orange-100 text-orange-700',
  baja: 'bg-yellow-100 text-yellow-700',
}

const PRIORIDAD_COLORS: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-orange-100 text-orange-700',
  baja: 'bg-yellow-100 text-yellow-700',
  urgente: 'bg-red-100 text-red-700',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>
      {label}
    </span>
  )
}

function SectionHeader({ icon: Icon, title, count }: { icon: typeof Bell; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">{title}</span>
      {count > 0 && (
        <span className="ml-auto text-xs text-gray-400">{count}</span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-3 py-4 text-sm text-gray-400 text-center">
      Sin alertas
    </div>
  )
}

function LoadingState() {
  return (
    <div className="px-3 py-4 text-sm text-gray-400 text-center">
      Cargando...
    </div>
  )
}

function StockBajoItemRow({ item }: { item: StockBajoItem }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-800 truncate">{item.producto_nombre}</div>
        <div className="text-xs text-gray-500">
          {item.cantidad_actual} / {item.stock_minimo} unidades
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <Badge label={item.nivel_stock} colorClass={NIVEL_STOCK_COLORS[item.nivel_stock] ?? 'bg-gray-100 text-gray-700'} />
        <Link to="/stock" className="text-blue-500 hover:text-blue-700">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

function VencimientoItemRow({
  item,
  showOfertaCta,
  isApplying,
  onApplyOferta,
}: {
  item: VencimientoItem
  showOfertaCta: boolean
  isApplying: boolean
  onApplyOferta: (stockId: string) => void
}) {
  const diasLabel = item.dias_hasta_vencimiento <= 0
    ? 'Vencido'
    : `${item.dias_hasta_vencimiento}d`

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-800 truncate">{item.producto_nombre}</div>
        <div className="text-xs text-gray-500">{diasLabel} hasta vencimiento</div>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        {showOfertaCta && (
          <button
            onClick={() => onApplyOferta(item.stock_id)}
            disabled={isApplying}
            className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-60 flex items-center gap-1"
            title="Aplicar oferta sugerida (30% OFF)"
          >
            {isApplying && <Loader2 className="w-3 h-3 animate-spin" />}
            30% OFF
          </button>
        )}
        <Badge label={item.nivel_alerta} colorClass={NIVEL_ALERTA_COLORS[item.nivel_alerta] ?? 'bg-gray-100 text-gray-700'} />
        <Link to="/stock" className="text-blue-500 hover:text-blue-700">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

function AlertaPrecioItemRow({ item }: { item: AlertaPrecioItem }) {
  const sign = item.porcentaje_cambio > 0 ? '+' : ''

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-800 truncate">{item.nombre_producto}</div>
        <div className="text-xs text-gray-500">{sign}{item.porcentaje_cambio.toFixed(1)}% cambio</div>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <Badge label={item.severidad} colorClass={SEVERIDAD_COLORS[item.severidad] ?? 'bg-gray-100 text-gray-700'} />
        <Link to="/productos" className="text-blue-500 hover:text-blue-700">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

function TareaVencidaItemRow({ item }: { item: TareaPendienteItem }) {
  const fecha = new Date(item.fecha_vencimiento).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-800 truncate">{item.titulo}</div>
        <div className="text-xs text-gray-500">Venc. {fecha}</div>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <Badge label={item.prioridad} colorClass={PRIORIDAD_COLORS[item.prioridad] ?? 'bg-gray-100 text-gray-700'} />
        <Link to="/tareas" className="text-blue-500 hover:text-blue-700">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ============================================================================
// Insights: Riesgo de pérdida
// ============================================================================

function RiesgoPerdidaItem({ item, onApply }: { item: ArbitrajeItem; onApply: (item: ArbitrajeItem) => void }) {
  const margen = item.margen_vs_reposicion
  const margenLabel = margen !== null ? `${margen.toFixed(1)}%` : 'N/A'
  const isNegative = margen !== null && margen < 0

  return (
    <div className="py-2 px-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-800 truncate">{item.nombre_producto}</div>
          <div className="text-xs text-gray-500">
            Costo: ${item.costo_proveedor_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            {' | '}Venta: ${item.precio_venta_actual?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? 'N/A'}
          </div>
          <div className={`text-xs font-medium ${isNegative ? 'text-red-600' : 'text-orange-600'}`}>
            Margen: {margenLabel}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <Badge
            label={item.riesgo_perdida ? 'RIESGO' : 'bajo'}
            colorClass={item.riesgo_perdida ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => onApply(item)}
          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors"
        >
          Verificar precio
        </button>
        <Link
          to="/productos"
          className="text-xs px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          Ver producto
        </Link>
      </div>
    </div>
  )
}

// ============================================================================
// Insights: Comprar ahora (oportunidades)
// ============================================================================

function OportunidadCompraItemRow({ item, onRemind }: { item: OportunidadCompraItem; onRemind: (item: OportunidadCompraItem) => void }) {
  const deltaPct = item.delta_costo_pct ?? 0

  return (
    <div className="py-2 px-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-800 truncate">{item.nombre_producto}</div>
          <div className="text-xs text-gray-500">
            Stock: {item.cantidad_actual}/{item.stock_minimo}
            {' | '}Costo: ${item.costo_proveedor_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-medium text-green-600">
            {deltaPct.toFixed(1)}% vs anterior
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <Badge label={item.nivel_stock} colorClass={NIVEL_STOCK_COLORS[item.nivel_stock] ?? 'bg-gray-100 text-gray-700'} />
        </div>
      </div>
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => onRemind(item)}
          className="text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded transition-colors"
        >
          Crear recordatorio
        </button>
        <Link
          to="/stock"
          className="text-xs px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          Ver stock
        </Link>
      </div>
    </div>
  )
}

// ============================================================================
// Confirm Apply Modal
// ============================================================================

function ConfirmApplyModal({
  item,
  onClose,
  onConfirm,
  isApplying
}: {
  item: ArbitrajeItem
  onClose: () => void
  onConfirm: () => void
  isApplying: boolean
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">
          {item.riesgo_perdida ? 'Riesgo de Perdida' : 'Margen Bajo'}
        </h3>
        <div className="text-sm text-gray-600 space-y-1 mb-3">
          <p><span className="font-medium">{item.nombre_producto}</span></p>
          <p>Costo proveedor: <span className="font-medium">${item.costo_proveedor_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></p>
          <p>Precio venta actual: <span className="font-medium">${item.precio_venta_actual?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? 'N/A'}</span></p>
          <p>Margen actual: <span className={`font-medium ${(item.margen_vs_reposicion ?? 0) < 0 ? 'text-red-600' : 'text-orange-600'}`}>
            {item.margen_vs_reposicion?.toFixed(1) ?? 'N/A'}%
          </span></p>
        </div>
        {item.riesgo_perdida && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <p className="text-xs text-red-700">
              El costo de reposicion supera el precio de venta. Si aplica este costo, el sistema recalculara el precio de venta manteniendo el margen.
            </p>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isApplying}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isApplying}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isApplying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Aplicar costo y recalcular
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function AlertsDrawer({ isOpen, onClose }: AlertsDrawerProps) {
  const {
    stockBajo, vencimientos, alertasPrecios, tareasVencidas,
    riesgoPerdida, oportunidadesCompra, ofertasSugeridas, totalAlertas, isLoading
  } = useAlertas()

  const qc = useQueryClient()
  const [confirmItem, setConfirmItem] = useState<ArbitrajeItem | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyingStockId, setApplyingStockId] = useState<string | null>(null)

  const sugeridasSet = useMemo(() => new Set(ofertasSugeridas.map((o) => o.stock_id)), [ofertasSugeridas])

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (confirmItem) {
        setConfirmItem(null)
      } else {
        onClose()
      }
    }
  }, [onClose, confirmItem])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  // CTA: Apply cost & recalculate (admin action)
  const handleApplyCost = async () => {
    if (!confirmItem) return
    setIsApplying(true)
    try {
      await preciosApi.aplicar({
        producto_id: confirmItem.producto_id,
        precio_compra: confirmItem.costo_proveedor_actual,
      })
      toast.success(`Precio recalculado para ${confirmItem.nombre_producto}`)
      setConfirmItem(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al aplicar precio'
      toast.error(msg)
    } finally {
      setIsApplying(false)
    }
  }

  // CTA: Create reminder task for a purchase opportunity
  const handleCreateReminder = async (item: OportunidadCompraItem) => {
    try {
      await tareasApi.create({
        titulo: `Comprar: ${item.nombre_producto} (${item.delta_costo_pct?.toFixed(1)}% menos)`,
        descripcion: `Stock actual: ${item.cantidad_actual}/${item.stock_minimo}. Costo proveedor: $${item.costo_proveedor_actual}. Bajó ${Math.abs(item.delta_costo_pct ?? 0).toFixed(1)}% vs comparación anterior.`,
        prioridad: 'urgente',
      })
      toast.success(`Recordatorio creado: ${item.nombre_producto}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear recordatorio'
      toast.error(msg)
    }
  }

  const handleAplicarOferta = async (stockId: string) => {
    setApplyingStockId(stockId)
    try {
      const res = await ofertasApi.aplicar({ stock_id: stockId, descuento_pct: 30 })
      const status = typeof (res as any)?.status === 'string' ? String((res as any).status) : ''
      toast.success(status === 'existing' ? 'Oferta ya estaba activa' : 'Oferta aplicada (30% OFF)')
      qc.invalidateQueries({ queryKey: ['alertas', 'ofertas-sugeridas'] })
      qc.invalidateQueries({ queryKey: ['ofertas', 'activas'] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al aplicar oferta'
      toast.error(msg)
    } finally {
      setApplyingStockId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[400px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-semibold text-gray-800">Alertas</h2>
            {totalAlertas > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {totalAlertas}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Riesgo de Pérdida Section */}
          {(isLoading || riesgoPerdida.length > 0) && (
            <div>
              <SectionHeader icon={TrendingDown} title="Riesgo de Perdida" count={riesgoPerdida.length} />
              {isLoading ? (
                <LoadingState />
              ) : (
                <div className="divide-y divide-gray-100">
                  {riesgoPerdida.map((item) => (
                    <RiesgoPerdidaItem
                      key={item.producto_id}
                      item={item}
                      onApply={setConfirmItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comprar Ahora Section */}
          {(isLoading || oportunidadesCompra.length > 0) && (
            <div className="border-t">
              <SectionHeader icon={ShoppingCart} title="Comprar Ahora" count={oportunidadesCompra.length} />
              {isLoading ? (
                <LoadingState />
              ) : (
                <div className="divide-y divide-gray-100">
                  {oportunidadesCompra.map((item) => (
                    <OportunidadCompraItemRow
                      key={item.producto_id}
                      item={item}
                      onRemind={handleCreateReminder}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stock Bajo Section */}
          <div className={riesgoPerdida.length > 0 || oportunidadesCompra.length > 0 ? 'border-t' : ''}>
            <SectionHeader icon={Package} title="Stock Bajo" count={stockBajo.length} />
            {isLoading ? (
              <LoadingState />
            ) : stockBajo.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-gray-100">
                {stockBajo.map((item) => (
                  <StockBajoItemRow key={item.producto_id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Vencimientos Section */}
          <div className="border-t">
            <SectionHeader icon={Clock} title="Vencimientos" count={vencimientos.length} />
            {isLoading ? (
              <LoadingState />
            ) : vencimientos.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-gray-100">
                {vencimientos.map((item) => (
                  <VencimientoItemRow
                    key={item.stock_id}
                    item={item}
                    showOfertaCta={sugeridasSet.has(item.stock_id)}
                    isApplying={applyingStockId === item.stock_id}
                    onApplyOferta={handleAplicarOferta}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cambios de Precio Section */}
          <div className="border-t">
            <SectionHeader icon={AlertTriangle} title="Cambios de Precio" count={alertasPrecios.length} />
            {isLoading ? (
              <LoadingState />
            ) : alertasPrecios.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-gray-100">
                {alertasPrecios.map((item) => (
                  <AlertaPrecioItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Tareas Vencidas Section */}
          <div className="border-t">
            <SectionHeader icon={Clock} title="Tareas Vencidas" count={tareasVencidas.length} />
            {isLoading ? (
              <LoadingState />
            ) : tareasVencidas.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-gray-100">
                {tareasVencidas.map((item) => (
                  <TareaVencidaItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Apply Modal */}
      {confirmItem && (
        <ConfirmApplyModal
          item={confirmItem}
          onClose={() => setConfirmItem(null)}
          onConfirm={handleApplyCost}
          isApplying={isApplying}
        />
      )}
    </div>
  )
}
