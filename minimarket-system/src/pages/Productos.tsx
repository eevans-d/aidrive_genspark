import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Producto, PrecioHistorico, Proveedor } from '../types/database'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ProductoConHistorial extends Producto {
  historial?: PrecioHistorico[]
  proveedor?: Proveedor
}

export default function Productos() {
  const [productos, setProductos] = useState<ProductoConHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducto, setSelectedProducto] = useState<ProductoConHistorial | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalProductos, setTotalProductos] = useState(0)
  const pageSize = 20

  useEffect(() => {
    loadProductos()
  }, [page])

  async function loadProductos() {
    try {
      setLoading(true)
      setError(null)

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data: productosData, count, error: productosError } = await supabase
        .from('productos')
        .select(
          'id,nombre,categoria,codigo_barras,precio_actual,precio_costo,proveedor_principal_id,margen_ganancia',
          { count: 'exact' }
        )
        .eq('activo', true)
        .order('nombre')
        .range(from, to)

      if (productosError) throw productosError

      setTotalProductos(count ?? 0)

      if (productosData) {
        const proveedorIds = Array.from(
          new Set(
            productosData
              .map((prod) => prod.proveedor_principal_id)
              .filter((id): id is string => Boolean(id))
          )
        )

        let proveedoresMap: Record<string, Proveedor> = {}
        if (proveedorIds.length > 0) {
          const { data: proveedoresData, error: proveedoresError } = await supabase
            .from('proveedores')
            .select('id,nombre,contacto,email,telefono,productos_ofrecidos,activo,created_at,updated_at')
            .in('id', proveedorIds)
            .eq('activo', true)

          if (proveedoresError) throw proveedoresError
          proveedoresMap = Object.fromEntries(
            (proveedoresData || []).map((prov) => [prov.id, prov])
          )
        }

        // Cargar historial de precios
        const productosConDatos = await Promise.all(
          productosData.map(async (prod) => {
            const { data: historial, error: historialError } = await supabase
              .from('precios_historicos')
              .select('id,producto_id,precio,fuente,fecha,cambio_porcentaje')
              .eq('producto_id', prod.id)
              .order('fecha', { ascending: false })
              .limit(5)

            if (historialError) {
              console.error('Error cargando historial:', historialError)
            }

            const proveedor = prod.proveedor_principal_id
              ? proveedoresMap[prod.proveedor_principal_id]
              : undefined

            return {
              ...prod,
              historial: historial || [],
              proveedor
            }
          })
        )

        setProductos(productosConDatos)
        setSelectedProducto((prev) => {
          if (!prev) return null
          return productosConDatos.find((prod) => prod.id === prev.id) || null
        })
      } else {
        setProductos([])
        setSelectedProducto(null)
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
      setError('No pudimos cargar los productos. Intente nuevamente.')
      setProductos([])
      setSelectedProducto(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  const totalPages = Math.max(1, Math.ceil(totalProductos / pageSize))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos y Precios</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadProductos}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Mostrando {productos.length} de {totalProductos} productos
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || loading}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          >
            Siguiente
          </button>
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
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedProducto?.id === producto.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
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
                          <div className={`flex items-center text-sm ${
                            tendencia === 'subida' ? 'text-red-600' : 'text-green-600'
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
                            <div className={`flex items-center ${
                              precio.cambio_porcentaje > 0 ? 'text-red-600' : 'text-green-600'
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
