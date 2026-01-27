import { useState } from 'react'
import { Phone, Mail, Package } from 'lucide-react'
import { useProveedores, ProveedorConProductos } from '../hooks/queries'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'

export default function Proveedores() {
  const [page, setPage] = useState(1)
  const [selectedProveedor, setSelectedProveedor] = useState<ProveedorConProductos | null>(null)
  const pageSize = 20

  const { data, isLoading, isError, error, refetch, isFetching } = useProveedores({ page, pageSize })

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  const { proveedores = [], total = 0 } = data ?? {}
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Mostrando {proveedores.length} de {total} proveedores
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || isFetching}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || isFetching}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de proveedores */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Proveedores</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {proveedores.map((proveedor) => (
                <div
                  key={proveedor.id}
                  onClick={() => setSelectedProveedor(proveedor)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedProveedor?.id === proveedor.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{proveedor.nombre}</h3>
                      {proveedor.contacto && (
                        <p className="text-sm text-gray-600">Contacto: {proveedor.contacto}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {proveedor.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {proveedor.telefono}
                          </span>
                        )}
                        {proveedor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {proveedor.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Productos</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {proveedor.productos?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalle del proveedor */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Detalle del Proveedor</h2>
          </div>
          <div className="p-6">
            {selectedProveedor ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedProveedor.nombre}
                  </h3>
                  {selectedProveedor.contacto && (
                    <p className="text-gray-600 mt-1">Contacto: {selectedProveedor.contacto}</p>
                  )}
                </div>

                {/* Información de contacto */}
                <div className="space-y-3">
                  {selectedProveedor.telefono && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600">Teléfono</div>
                        <div className="font-medium">{selectedProveedor.telefono}</div>
                      </div>
                    </div>
                  )}
                  {selectedProveedor.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{selectedProveedor.email}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categorías de productos */}
                {selectedProveedor.productos_ofrecidos && selectedProveedor.productos_ofrecidos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Categorías que Ofrece</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProveedor.productos_ofrecidos.map((categoria, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {categoria}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de productos */}
                {selectedProveedor.productos && selectedProveedor.productos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Productos ({selectedProveedor.productos.length})
                    </h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {selectedProveedor.productos.map((producto) => (
                        <div
                          key={producto.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{producto.nombre}</div>
                              <div className="text-sm text-gray-500">{producto.categoria}</div>
                            </div>
                            <div className="text-right">
                              {producto.precio_actual !== null && (
                                <div className="font-bold text-blue-600">
                                  ${producto.precio_actual.toFixed(2)}
                                </div>
                              )}
                              {producto.margen_ganancia !== null && (
                                <div className="text-xs text-gray-500">
                                  Margen: {producto.margen_ganancia.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProveedor.productos && selectedProveedor.productos.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No hay productos asignados a este proveedor
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Seleccione un proveedor para ver sus detalles
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
