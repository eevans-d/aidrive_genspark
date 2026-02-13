import { useState } from 'react'
import { TrendingUp, TrendingDown, Plus, DollarSign, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast, Toaster } from 'sonner'
import { useProductos, ProductoConHistorial, ProductosResult } from '../hooks/queries'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import { SkeletonTable, SkeletonText } from '../components/Skeleton'
import { productosApi, preciosApi, ApiError } from '../lib/apiClient'
import { queryKeys } from '../lib/queryClient'
import { money } from '../utils/currency'

export default function Productos() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [selectedProducto, setSelectedProducto] = useState<ProductoConHistorial | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [newProducto, setNewProducto] = useState({ nombre: '', sku: '', codigo_barras: '', marca: '', contenido_neto: '' })
  const [priceForm, setPriceForm] = useState({ precio_compra: '', margen_ganancia: '' })
  const pageSize = 20

  const { data, isLoading, isError, error, refetch, isFetching } = useProductos({
    page,
    pageSize,
    barcodeSearch: barcodeSearch || undefined
  })

  const handleBarcodeSearch = () => {
    setPage(1)
    setBarcodeSearch(barcodeInput.trim())
  }

  const handleBarcodeClear = () => {
    setPage(1)
    setBarcodeInput('')
    setBarcodeSearch('')
  }

  const createMutation = useMutation({
    mutationFn: (params: typeof newProducto) =>
      productosApi.create({
        nombre: params.nombre,
        sku: params.sku || null,
        codigo_barras: params.codigo_barras || null,
        marca: params.marca || null,
        contenido_neto: params.contenido_neto || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto creado correctamente')
      setShowNewModal(false)
      setNewProducto({ nombre: '', sku: '', codigo_barras: '', marca: '', contenido_neto: '' })
    },
    onError: (err: ApiError | Error) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al crear producto')
    },
  })

  const priceMutation = useMutation({
    mutationFn: (params: { producto_id: string; precio_compra: number; margen_ganancia?: number }) =>
      preciosApi.aplicar(params),
    onMutate: async (params) => {
      const currentQueryKey = [...queryKeys.productos, { page, pageSize, barcodeSearch: barcodeSearch || undefined }]
      await queryClient.cancelQueries({ queryKey: currentQueryKey })
      const snapshot = queryClient.getQueryData<ProductosResult>(currentQueryKey)

      // Compute optimistic price estimate
      const margen = params.margen_ganancia ?? selectedProducto?.margen_ganancia ?? 30
      const optimisticPrice = Math.round(params.precio_compra * (1 + margen / 100) * 100) / 100

      queryClient.setQueryData<ProductosResult>(currentQueryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          productos: old.productos.map((p) =>
            p.id === params.producto_id
              ? { ...p, precio_actual: optimisticPrice, precio_costo: params.precio_compra }
              : p
          ),
        }
      })

      if (selectedProducto?.id === params.producto_id) {
        setSelectedProducto((prev) =>
          prev ? { ...prev, precio_actual: optimisticPrice, precio_costo: params.precio_compra } : prev
        )
      }

      return { snapshot, currentQueryKey }
    },
    onSuccess: () => {
      toast.success('Precio actualizado correctamente')
      setShowPriceModal(false)
      setPriceForm({ precio_compra: '', margen_ganancia: '' })
    },
    onError: (err: ApiError | Error, _vars, context) => {
      if (context?.snapshot && context.currentQueryKey) {
        queryClient.setQueryData(context.currentQueryKey, context.snapshot)
      }
      toast.error(err instanceof ApiError ? err.message : 'Error al actualizar precio')
    },
    onSettled: (_data, _err, _vars, context) => {
      queryClient.invalidateQueries({ queryKey: context?.currentQueryKey ?? ['productos'] })
    },
  })

  const handleExportCsv = () => {
    const productos = data?.productos ?? []
    if (productos.length === 0) return

    const headers = [
      'id',
      'nombre',
      'categoria',
      'codigo_barras',
      'precio_actual',
      'precio_costo',
      'margen_ganancia',
      'proveedor',
    ]

    const rows = productos.map((producto) => [
      producto.id,
      producto.nombre,
      producto.categoria ?? '',
      producto.codigo_barras ?? '',
      producto.precio_actual ?? '',
      producto.precio_costo ?? '',
      producto.margen_ganancia ?? '',
      producto.proveedor?.nombre ?? '',
    ])

    const escapeCell = (value: string | number) => {
      const raw = String(value)
      if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
        return `"${raw.replace(/"/g, '""')}"`
      }
      return raw
    }

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonText width="w-72" className="h-8" />
        <SkeletonTable />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos y Precios</h1>
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  const { productos = [], total = 0 } = data ?? {}
  const isBarcodeSearchActive = barcodeSearch.trim().length > 0
  const totalPages = isBarcodeSearchActive ? 1 : Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion de Productos y Precios</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Mostrando {productos.length} de {total} productos
            {isBarcodeSearchActive && (
              <span className="ml-2 text-xs text-blue-600">
                Filtro por código: {barcodeSearch.trim()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={isFetching || productos.length === 0}
              className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || isFetching || isBarcodeSearchActive}
              className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || isFetching || isBarcodeSearchActive}
              className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-sm text-gray-600">Buscar por código de barras</label>
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Escanear o escribir código"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeSearch()
                }
              }}
              className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleBarcodeSearch}
              disabled={isFetching || barcodeInput.trim().length === 0}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              Buscar
            </button>
            <button
              onClick={handleBarcodeClear}
              disabled={isFetching || (!barcodeInput && !barcodeSearch)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de productos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Catálogo de Productos</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {productos.map((producto) => {
                const ultimoCambio = producto.historial?.[0]
                const tendencia = ultimoCambio && ultimoCambio.cambio_porcentaje !== null
                  ? ultimoCambio.cambio_porcentaje > 0 ? 'subida' : 'bajada'
                  : null

                return (
                  <div
                    key={producto.id}
                    onClick={() => setSelectedProducto(producto)}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedProducto?.id === producto.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                        <p className="text-sm text-gray-500">{producto.categoria}</p>
                        {producto.proveedor && (
                          <p className="text-xs text-gray-400 mt-1">
                            Proveedor: {producto.proveedor.nombre}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${producto.precio_actual != null ? money(producto.precio_actual) : '—'}
                        </div>
                        {tendencia && (
                          <div className={`flex items-center text-sm ${tendencia === 'subida' ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {tendencia === 'subida' ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            {ultimoCambio && Math.abs(ultimoCambio.cambio_porcentaje || 0).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Detalle del producto */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Detalle del Producto</h2>
          </div>
          <div className="p-6">
            {selectedProducto ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedProducto.nombre}
                  </h3>
                  <p className="text-gray-600">{selectedProducto.categoria}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Precio Actual</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedProducto.precio_actual != null ? money(selectedProducto.precio_actual) : '—'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Precio Costo</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${selectedProducto.precio_costo != null ? money(selectedProducto.precio_costo) : '—'}
                    </div>
                  </div>
                  {selectedProducto.margen_ganancia !== null && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Margen de Ganancia</div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedProducto.margen_ganancia.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {selectedProducto.codigo_barras && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Código de Barras</div>
                      <div className="text-lg font-mono text-gray-900">
                        {selectedProducto.codigo_barras}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setPriceForm({
                      precio_compra: selectedProducto.precio_costo?.toString() ?? '',
                      margen_ganancia: selectedProducto.margen_ganancia?.toString() ?? '',
                    })
                    setShowPriceModal(true)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors justify-center"
                >
                  <DollarSign className="w-4 h-4" />
                  Actualizar precio
                </button>

                {selectedProducto.proveedor && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Proveedor Principal</div>
                    <div className="text-lg text-blue-900">{selectedProducto.proveedor.nombre}</div>
                    {selectedProducto.proveedor.telefono && (
                      <div className="text-sm text-blue-700 mt-1">
                        Tel: {selectedProducto.proveedor.telefono}
                      </div>
                    )}
                  </div>
                )}

                {/* Historial de precios */}
                {selectedProducto.historial && selectedProducto.historial.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Historial de Precios</h4>
                    <div className="space-y-2">
                      {selectedProducto.historial.map((precio) => (
                        <div
                          key={precio.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <div className="font-medium">${money(precio.precio)}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(precio.fecha).toLocaleDateString('es-AR')}
                            </div>
                            {precio.fuente && (
                              <div className="text-xs text-gray-400">{precio.fuente}</div>
                            )}
                          </div>
                          {precio.cambio_porcentaje !== null && precio.cambio_porcentaje !== 0 && (
                            <div className={`flex items-center ${precio.cambio_porcentaje > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                              {precio.cambio_porcentaje > 0 ? (
                                <TrendingUp className="w-4 h-4 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 mr-1" />
                              )}
                              {Math.abs(precio.cambio_porcentaje).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Seleccione un producto para ver sus detalles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Nuevo producto (B1) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title-new-product">
            <h3 id="modal-title-new-product" className="text-lg font-semibold text-gray-800 mb-4">Nuevo producto</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newProducto.nombre.trim()) return
                createMutation.mutate(newProducto)
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newProducto.nombre}
                  onChange={(e) => setNewProducto({ ...newProducto, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProducto.sku}
                    onChange={(e) => setNewProducto({ ...newProducto, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Codigo de barras</label>
                  <input
                    type="text"
                    value={newProducto.codigo_barras}
                    onChange={(e) => setNewProducto({ ...newProducto, codigo_barras: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={newProducto.marca}
                    onChange={(e) => setNewProducto({ ...newProducto, marca: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenido neto</label>
                  <input
                    type="text"
                    value={newProducto.contenido_neto}
                    onChange={(e) => setNewProducto({ ...newProducto, contenido_neto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="ej. 500g"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !newProducto.nombre.trim()}
                  className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Crear producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Actualizar precio (B2) */}
      {showPriceModal && selectedProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowPriceModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title-price">
            <h3 id="modal-title-price" className="text-lg font-semibold text-gray-800 mb-2">Actualizar precio</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedProducto.nombre}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const compra = parseFloat(priceForm.precio_compra)
                if (isNaN(compra) || compra <= 0) return
                const margen = priceForm.margen_ganancia ? parseFloat(priceForm.margen_ganancia) : undefined
                priceMutation.mutate({
                  producto_id: selectedProducto.id,
                  precio_compra: compra,
                  margen_ganancia: margen && !isNaN(margen) ? margen : undefined,
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio de compra *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={priceForm.precio_compra}
                  onChange={(e) => setPriceForm({ ...priceForm, precio_compra: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margen de ganancia (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={priceForm.margen_ganancia}
                  onChange={(e) => setPriceForm({ ...priceForm, margen_ganancia: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Usar margen por defecto"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  disabled={priceMutation.isPending}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={priceMutation.isPending || !priceForm.precio_compra}
                  className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {priceMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Aplicar precio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
