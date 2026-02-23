import { useState, useCallback } from 'react'
import { FileText, Plus, Eye, Loader2, CheckCircle, AlertCircle, Clock, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useFacturas, useFacturaItems, useCreateFactura } from '../hooks/queries'
import { useProveedores } from '../hooks/queries'
import { facturasApi } from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType, extractRequestId } from '../components/errorMessageUtils'
import { SkeletonCard, SkeletonTable } from '../components/Skeleton'
import FacturaUpload from '../components/FacturaUpload'

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

export default function Facturas() {
  const [showUpload, setShowUpload] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState('')
  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null)
  const [extracting, setExtracting] = useState<string | null>(null)

  const { data: facturas, isLoading, error, refetch } = useFacturas()
  const { data: proveedores } = useProveedores()
  const { data: facturaItems } = useFacturaItems(selectedFacturaId)
  const createFactura = useCreateFactura()

  const handleUploaded = useCallback(async (imagenUrl: string) => {
    if (!selectedProveedor) {
      toast.error('Seleccioná un proveedor primero')
      return
    }

    try {
      await createFactura.mutateAsync({
        proveedor_id: selectedProveedor,
        imagen_url: imagenUrl,
      })
      setShowUpload(false)
      setSelectedProveedor('')
      toast.success('Factura registrada. Podés extraer los datos con el botón "Extraer".')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar factura')
    }
  }, [selectedProveedor, createFactura])

  const handleExtraer = useCallback(async (facturaId: string) => {
    setExtracting(facturaId)
    try {
      const result = await facturasApi.extraer(facturaId)
      toast.success(`Extracción completada: ${result.items_count} items detectados`)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al extraer datos')
    } finally {
      setExtracting(null)
    }
  }, [refetch])

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

          {/* Proveedor selector */}
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

          {/* Upload */}
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
            Cargá una imagen de factura para comenzar
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
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
                        {f.proveedores?.nombre || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {f.tipo_comprobante}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {f.numero || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {f.fecha_factura || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {f.total != null ? `$${Number(f.total).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[f.estado] || ''}`}>
                          <EstadoIcon className="w-3 h-3" />
                          {f.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {f.estado === 'pendiente' && (
                            <button
                              onClick={() => handleExtraer(f.id)}
                              disabled={extracting === f.id}
                              className="flex items-center gap-1 px-3 py-2 min-h-[48px] text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {extracting === f.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                              Extraer
                            </button>
                          )}
                          {(f.estado === 'extraida' || f.estado === 'validada') && (
                            <button
                              onClick={() => setSelectedFacturaId(selectedFacturaId === f.id ? null : f.id)}
                              className="flex items-center gap-1 px-3 py-2 min-h-[48px] text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              {selectedFacturaId === f.id ? 'Ocultar' : 'Ver Items'}
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

          {/* Items detail panel */}
          {selectedFacturaId && facturaItems && facturaItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Items de factura ({facturaItems.length})
              </h3>
              <div className="space-y-2">
                {facturaItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-3 text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.descripcion_original}</span>
                      {item.productos?.nombre && (
                        <span className="ml-2 text-green-600 dark:text-green-400 text-xs">
                          → {item.productos.nombre}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-gray-500">{item.cantidad} {item.unidad}</span>
                      {item.precio_unitario != null && (
                        <span className="font-mono">${Number(item.precio_unitario).toFixed(2)}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        item.estado_match === 'auto_match' || item.estado_match === 'alias_match'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : item.estado_match === 'confirmada'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {item.estado_match.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
