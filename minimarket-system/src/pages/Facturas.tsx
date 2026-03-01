import { useState, useCallback } from 'react'
import { FileText, Plus, Eye, Loader2, CheckCircle, AlertCircle, Clock, Package, Check, X, Save, Search, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useFacturas, useFacturaItems, useCreateFactura, useValidarFacturaItem, useAplicarFactura } from '../hooks/queries'
import { useProveedores } from '../hooks/queries'
import { facturasApi } from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType, extractRequestId } from '../components/errorMessageUtils'
import { SkeletonCard, SkeletonTable } from '../components/Skeleton'
import FacturaUpload from '../components/FacturaUpload'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  extraida: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  validada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  aplicada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  rechazada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const ESTADO_ICONS: Record<string, typeof Clock> = {
  pendiente: Clock,
  extraida: Eye,
  validada: CheckCircle,
  aplicada: Package,
  error: AlertCircle,
  rechazada: AlertCircle,
}

const MATCH_COLORS: Record<string, string> = {
  auto_match: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  alias_match: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  confirmada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rechazada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  fuzzy_pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const VALIDATION_COLORS: Record<string, string> = {
  ok: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
}

function normalizeCuitValue(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null
  const digits = value.replace(/\D/g, '')
  return digits.length === 11 ? digits : null
}

function getDetectedCuit(datosExtraidos: Record<string, unknown> | null | undefined): string | null {
  if (!datosExtraidos || typeof datosExtraidos !== 'object') return null
  const raw = datosExtraidos.cuit_detectado
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null
}

export default function Facturas() {
  const [showUpload, setShowUpload] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState('')
  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null)
  const [extracting, setExtracting] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<Set<string>>(new Set())
  const [validatingItem, setValidatingItem] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editProductoId, setEditProductoId] = useState('')
  const [editAlias, setEditAlias] = useState('')
  const [saveAlias, setSaveAlias] = useState(false)
  const [productoSearch, setProductoSearch] = useState('')

  const { data: facturas, isLoading, error, refetch } = useFacturas()
  const { data: proveedores } = useProveedores()
  const { data: facturaItems, refetch: refetchItems } = useFacturaItems(selectedFacturaId)
  const createFactura = useCreateFactura()
  const validarItem = useValidarFacturaItem(selectedFacturaId)
  const aplicarFactura = useAplicarFactura()

  const { data: productosDropdown } = useQuery({
    queryKey: ['productos-dropdown'],
    queryFn: () => apiClient.productos.dropdown(),
    staleTime: 1000 * 60 * 10,
  })

  const productosFiltrados = (productosDropdown ?? []).filter(p =>
    !productoSearch || p.nombre.toLowerCase().includes(productoSearch.toLowerCase())
  )

  const selectedFactura = facturas?.find(f => f.id === selectedFacturaId)
  const detectedCuit = getDetectedCuit(selectedFactura?.datos_extraidos)
  const proveedorCuit = selectedFactura?.proveedores?.cuit ?? null
  const detectedCuitNormalized = normalizeCuitValue(detectedCuit)
  const proveedorCuitNormalized = normalizeCuitValue(proveedorCuit)
  const hasCuitMismatch = Boolean(
    detectedCuitNormalized
    && proveedorCuitNormalized
    && detectedCuitNormalized !== proveedorCuitNormalized,
  )

  const handleUploaded = useCallback(async (imagenUrl: string) => {
    if (!selectedProveedor) {
      toast.error('Selecciona un proveedor primero')
      return
    }
    try {
      await createFactura.mutateAsync({
        proveedor_id: selectedProveedor,
        imagen_url: imagenUrl,
      })
      setShowUpload(false)
      setSelectedProveedor('')
      toast.success('Factura registrada. Usa el boton "Extraer" para leer los datos.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar factura')
    }
  }, [selectedProveedor, createFactura])

  const handleExtraer = useCallback(async (facturaId: string) => {
    setExtracting(prev => new Set(prev).add(facturaId))
    try {
      const result = await facturasApi.extraer(facturaId)
      const parts = [`Extraccion completada: ${result.items_count} items detectados`]
      if ((result.items_failed_count ?? 0) > 0) {
        parts.push(`${result.items_failed_count} no insertados`)
      }
      if ((result.items_previos_eliminados ?? 0) > 0) {
        parts.push(`limpieza previa: ${result.items_previos_eliminados}`)
      }
      if (result.insert_mode === 'fallback') {
        parts.push('modo fallback')
      }
      toast.success(parts.join(' | '))
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al extraer datos')
    } finally {
      setExtracting(prev => { const next = new Set(prev); next.delete(facturaId); return next })
    }
  }, [refetch])

  const handleConfirmar = useCallback(async (itemId: string, productoId: string | null, aliasTexto: string) => {
    if (!productoId) {
      toast.error('Selecciona un producto para confirmar')
      return
    }
    setValidatingItem(itemId)
    try {
      await validarItem.mutateAsync({
        itemId,
        params: {
          estado_match: 'confirmada',
          producto_id: productoId,
          guardar_alias: saveAlias && aliasTexto.trim().length > 0,
          alias_texto: aliasTexto.trim() || undefined,
        },
      })
      toast.success('Item confirmado')
      setEditingItem(null)
      setEditProductoId('')
      setEditAlias('')
      setSaveAlias(false)
      refetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar item')
    } finally {
      setValidatingItem(null)
    }
  }, [validarItem, saveAlias, refetchItems])

  const handleRechazar = useCallback(async (itemId: string) => {
    setValidatingItem(itemId)
    try {
      await validarItem.mutateAsync({
        itemId,
        params: { estado_match: 'rechazada' },
      })
      toast.success('Item rechazado')
      setEditingItem(null)
      refetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al rechazar item')
    } finally {
      setValidatingItem(null)
    }
  }, [validarItem, refetchItems])

  const handleAplicar = useCallback(async (facturaId: string) => {
    setApplying(prev => new Set(prev).add(facturaId))
    try {
      const result = await aplicarFactura.mutateAsync(facturaId)
      toast.success(`Factura aplicada: ${result.items_aplicados} items ingresados al deposito`)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al aplicar factura')
    } finally {
      setApplying(prev => { const next = new Set(prev); next.delete(facturaId); return next })
    }
  }, [aplicarFactura, refetch])

  const startEditing = (itemId: string, currentProductoId: string | null, currentDesc: string) => {
    setEditingItem(itemId)
    setEditProductoId(currentProductoId ?? '')
    setEditAlias(currentDesc)
    setSaveAlias(false)
    setProductoSearch('')
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonCard />
        <SkeletonTable />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          requestId={extractRequestId(error)}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Facturas de Compra
          </h1>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Factura
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 space-y-4 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cargar imagen de factura
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor
            </label>
            <select
              value={selectedProveedor}
              onChange={e => setSelectedProveedor(e.target.value)}
              className="w-full px-3 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores?.proveedores?.map((p: { id: string; nombre: string }) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <FacturaUpload
            proveedorId={selectedProveedor}
            onUploaded={handleUploaded}
            disabled={!selectedProveedor || createFactura.isPending}
          />

          <button
            onClick={() => { setShowUpload(false); setSelectedProveedor('') }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Facturas list */}
      {!facturas || facturas.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay facturas registradas</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Carga una imagen de factura para comenzar
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {facturas.map(f => {
                  const EstadoIcon = ESTADO_ICONS[f.estado] || Clock
                  return (
                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm">
                        {f.proveedores?.nombre || '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {f.tipo_comprobante}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {f.numero || '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {f.fecha_factura || '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {f.total != null ? `$${Number(f.total).toFixed(2)}` : '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[f.estado] || ''}`}>
                          <EstadoIcon className="w-3 h-3" />
                          {f.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(f.estado === 'pendiente' || f.estado === 'error') && (
                            <button
                              onClick={() => handleExtraer(f.id)}
                              disabled={extracting.has(f.id)}
                              className="flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {extracting.has(f.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                              {f.estado === 'error' ? 'Reintentar OCR' : 'Extraer'}
                            </button>
                          )}
                          {(f.estado === 'extraida' || f.estado === 'validada' || f.estado === 'aplicada') && (
                            <button
                              onClick={() => setSelectedFacturaId(selectedFacturaId === f.id ? null : f.id)}
                              className="flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              {selectedFacturaId === f.id ? 'Ocultar' : 'Ver Items'}
                            </button>
                          )}
                          {f.estado === 'validada' && (
                            <button
                              onClick={() => handleAplicar(f.id)}
                              disabled={applying.has(f.id)}
                              className="flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              {applying.has(f.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Package className="w-3 h-3" />
                              )}
                              Aplicar al deposito
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Items detail panel with validation */}
          {selectedFacturaId && facturaItems && facturaItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Items de factura ({facturaItems.length})
                </h3>
                {selectedFactura?.estado === 'extraida' && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Confirma o rechaza cada item para validar la factura
                  </span>
                )}
              </div>

              {hasCuitMismatch && (
                <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        CUIT detectado por OCR no coincide con el proveedor seleccionado.
                      </p>
                      <p>
                        Detectado: <span className="font-mono">{detectedCuit || 'N/D'}</span> |
                        Proveedor: <span className="font-mono">{proveedorCuit || 'N/D'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {facturaItems.map(item => {
                  const isEditing = editingItem === item.id
                  const isValidating = validatingItem === item.id
                  const isFinalized = item.estado_match === 'confirmada' || item.estado_match === 'rechazada'

                  return (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded p-3 text-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.descripcion_original}
                          </div>
                          {item.productos?.nombre && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                              {'\u2192'} {item.productos.nombre}
                              {item.productos.sku && <span className="text-gray-400 ml-1">({item.productos.sku})</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-gray-500">{item.cantidad} {item.unidad}</span>
                          {item.precio_unitario != null && (
                            <span className="font-mono text-gray-700 dark:text-gray-300">${Number(item.precio_unitario).toFixed(2)}</span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${MATCH_COLORS[item.estado_match] || MATCH_COLORS.fuzzy_pendiente}`}>
                            {item.estado_match.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Enhanced pricing row */}
                      {(item.precio_unitario_costo != null || item.unidades_por_bulto != null) && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          {item.unidades_por_bulto != null && item.unidades_por_bulto > 1 && (
                            <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                              Pack {item.unidades_por_bulto}u
                            </span>
                          )}
                          {item.precio_unitario_costo != null && (
                            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                              Costo: ${Number(item.precio_unitario_costo).toFixed(4)}/u
                            </span>
                          )}
                          {item.validacion_subtotal && (
                            <span className={VALIDATION_COLORS[item.validacion_subtotal] || ''}>
                              {item.validacion_subtotal === 'ok' ? '\u2713' : item.validacion_subtotal === 'warning' ? '\u26A0' : '\u2717'} subtotal
                            </span>
                          )}
                          {item.notas_calculo && (
                            <span className="text-gray-400 dark:text-gray-500 truncate max-w-[200px]" title={item.notas_calculo}>
                              <Info className="w-3 h-3 inline mr-0.5" />{item.notas_calculo}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action buttons for unvalidated items */}
                      {!isFinalized && selectedFactura?.estado === 'extraida' && !isEditing && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          {item.producto_id ? (
                            <button
                              onClick={() => handleConfirmar(item.id, item.producto_id, item.descripcion_original)}
                              disabled={isValidating}
                              className="flex items-center gap-1 px-3 py-2 min-h-[40px] text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Confirmar
                            </button>
                          ) : null}
                          <button
                            onClick={() => startEditing(item.id, item.producto_id, item.descripcion_original)}
                            className="flex items-center gap-1 px-3 py-2 min-h-[40px] text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                          >
                            <Search className="w-3 h-3" />
                            {item.producto_id ? 'Cambiar producto' : 'Asignar producto'}
                          </button>
                          <button
                            onClick={() => handleRechazar(item.id)}
                            disabled={isValidating}
                            className="flex items-center gap-1 px-3 py-2 min-h-[40px] text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors"
                          >
                            {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            Rechazar
                          </button>
                        </div>
                      )}

                      {/* Inline product editor */}
                      {isEditing && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Buscar producto</label>
                            <input
                              type="text"
                              value={productoSearch}
                              onChange={e => setProductoSearch(e.target.value)}
                              placeholder="Buscar por nombre..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900"
                            />
                          </div>
                          <select
                            value={editProductoId}
                            onChange={e => setEditProductoId(e.target.value)}
                            className="w-full px-3 py-2 min-h-[40px] border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900"
                            size={Math.min(productosFiltrados.length, 6)}
                          >
                            <option value="">Seleccionar producto...</option>
                            {productosFiltrados.map(p => (
                              <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`alias-${item.id}`}
                              checked={saveAlias}
                              onChange={e => setSaveAlias(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`alias-${item.id}`} className="text-xs text-gray-600 dark:text-gray-400">
                              Guardar como alias para futuras facturas
                            </label>
                          </div>
                          {saveAlias && (
                            <input
                              type="text"
                              value={editAlias}
                              onChange={e => setEditAlias(e.target.value)}
                              placeholder="Texto del alias..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirmar(item.id, editProductoId, editAlias)}
                              disabled={!editProductoId || isValidating}
                              className="flex items-center gap-1 px-3 py-2 min-h-[40px] text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Confirmar con producto
                            </button>
                            <button
                              onClick={() => { setEditingItem(null); setEditProductoId(''); setEditAlias(''); setSaveAlias(false) }}
                              className="px-3 py-2 min-h-[40px] text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
