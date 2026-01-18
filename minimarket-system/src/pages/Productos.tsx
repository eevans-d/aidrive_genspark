import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useProductos, ProductoConHistorial } from '../hooks/queries'
import { ErrorMessage, parseErrorMessage, detectErrorType } from '../components/ErrorMessage'

export default function Productos() {
  const [page, setPage] = useState(1)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [selectedProducto, setSelectedProducto] = useState<ProductoConHistorial | null>(null)
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
    return <div className="text-center py-8">Cargando...</div>
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
      <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos y Precios</h1>

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
                          ${producto.precio_actual?.toFixed(2)}
                        </div>
                        {tendencia && (
                          <div className={`flex items-center text-sm ${tendencia === 'subida' ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {tendencia === 'subida' ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            {Math.abs(ultimoCambio.cambio_porcentaje || 0).toFixed(1)}%
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
                      ${selectedProducto.precio_actual?.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Precio Costo</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${selectedProducto.precio_costo?.toFixed(2)}
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
                            <div className="font-medium">${precio.precio.toFixed(2)}</div>
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
    </div>
  )
}
