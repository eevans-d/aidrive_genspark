import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient, { depositoApi, ApiError, DropdownItem } from '../lib/apiClient'
import { Plus, Minus, Search, Zap, RefreshCw } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType, extractRequestId } from '../components/errorMessageUtils'
import { SkeletonCard, SkeletonText, SkeletonList } from '../components/Skeleton'

type TabMode = 'rapido' | 'normal'

export default function Deposito() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabMode>('rapido')

  // === Normal mode state ===
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducto, setSelectedProducto] = useState<DropdownItem | null>(null)
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [destino, setDestino] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  // === Quick entry state ===
  const [qSearch, setQSearch] = useState('')
  const [qProducto, setQProducto] = useState<DropdownItem | null>(null)
  const [qCantidad, setQCantidad] = useState('')
  const [qProveedorId, setQProveedorId] = useState('')
  const qSearchRef = useRef<HTMLInputElement>(null)
  const qCantidadRef = useRef<HTMLInputElement>(null)

  // Query para productos
  const {
    data: productos = [],
    isLoading: isProductosLoading,
    isError: isProductosError,
    error: productosError,
    refetch: refetchProductos,
    isFetching: isFetchingProductos
  } = useQuery({
    queryKey: ['productos-deposito'],
    queryFn: async () => {
      return await apiClient.productos.dropdown()
    },
    staleTime: 1000 * 60 * 5,
  })

  // Query para proveedores
  const {
    data: proveedores = [],
    isLoading: isProveedoresLoading,
    isError: isProveedoresError,
    error: proveedoresError,
    refetch: refetchProveedores,
    isFetching: isFetchingProveedores
  } = useQuery({
    queryKey: ['proveedores-deposito'],
    queryFn: async () => {
      return await apiClient.proveedores.dropdown()
    },
    staleTime: 1000 * 60 * 10,
  })

  // Auto-focus search input when switching to quick mode
  useEffect(() => {
    if (activeTab === 'rapido') {
      setTimeout(() => qSearchRef.current?.focus(), 50)
    }
  }, [activeTab])

  // === Quick entry mutation ===
  const quickMutation = useMutation({
    mutationFn: async (params: {
      productoId: string
      productoNombre: string
      cantidad: number
      proveedorId: string | null
    }) => {
      const motivo = params.proveedorId
        ? `Entrada proveedor ${params.proveedorId}`
        : 'Entrada manual (ingreso rapido)'
      return depositoApi.movimiento({
        producto_id: params.productoId,
        tipo: 'entrada',
        cantidad: params.cantidad,
        motivo,
        destino: 'Principal',
        proveedor_id: params.proveedorId,
        observaciones: null
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['kardex'] })
      queryClient.invalidateQueries({ queryKey: ['deposito'] })
      toast.success(`Entrada registrada: ${variables.productoNombre} x ${variables.cantidad}`)
      // Reset and re-focus
      setQProducto(null)
      setQCantidad('')
      setQSearch('')
      setTimeout(() => qSearchRef.current?.focus(), 50)
    },
    onError: (error: ApiError | Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al registrar entrada')
    }
  })

  // === Normal mode mutation ===
  const movimientoMutation = useMutation({
    mutationFn: async (params: {
      productoId: string
      tipo: 'entrada' | 'salida' | 'ajuste'
      cantidad: number
      motivo: string
      destino: string | null
      proveedorId: string | null
      observaciones: string | null
    }) => {
      return depositoApi.movimiento({
        producto_id: params.productoId,
        tipo: params.tipo,
        cantidad: params.cantidad,
        motivo: params.motivo,
        destino: params.tipo === 'entrada' ? (params.destino || 'Principal') : params.destino,
        proveedor_id: params.proveedorId,
        observaciones: params.observaciones
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['kardex'] })
      queryClient.invalidateQueries({ queryKey: ['deposito'] })
      setMensaje({ tipo: 'success', texto: 'Movimiento registrado correctamente' })
      setSelectedProducto(null)
      setCantidad('')
      setDestino('')
      setProveedorId('')
      setMotivo('')
      setObservaciones('')
      setSearchTerm('')
    },
    onError: (error: ApiError | Error) => {
      const mensajeError = error.message?.includes('Stock insuficiente')
        ? 'Stock insuficiente para registrar la salida'
        : error instanceof ApiError
          ? error.message
          : 'Error al registrar el movimiento'
      setMensaje({ tipo: 'error', texto: mensajeError })
    }
  })

  // === Quick entry filtering & handlers ===
  const qProductosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(qSearch.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.includes(qSearch))
  )

  function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!qProducto) {
      toast.error('Seleccione un producto')
      qSearchRef.current?.focus()
      return
    }

    const qty = parseInt(qCantidad, 10)
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      qCantidadRef.current?.focus()
      return
    }

    quickMutation.mutate({
      productoId: qProducto.id,
      productoNombre: qProducto.nombre,
      cantidad: qty,
      proveedorId: qProveedorId || null,
    })
  }

  // === Normal mode filtering & handlers ===
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.includes(searchTerm))
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedProducto || !cantidad) {
      setMensaje({ tipo: 'error', texto: 'Por favor complete todos los campos requeridos' })
      return
    }

    const cantidadNumero = parseInt(cantidad, 10)
    if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
      setMensaje({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0' })
      return
    }

    setMensaje(null)

    let motivoFinal: string
    if (tipo === 'ajuste') {
      if (!motivo.trim()) {
        setMensaje({ tipo: 'error', texto: 'El motivo es obligatorio para ajustes' })
        return
      }
      motivoFinal = motivo.trim()
    } else {
      motivoFinal = tipo === 'entrada'
        ? (proveedorId ? `Entrada proveedor ${proveedorId}` : 'Entrada manual')
        : (destino ? `Salida a ${destino}` : 'Salida')
    }

    movimientoMutation.mutate({
      productoId: selectedProducto.id,
      tipo,
      cantidad: cantidadNumero,
      motivo: motivoFinal,
      destino: tipo === 'entrada' ? 'Principal' : (tipo === 'salida' ? (destino || null) : null),
      proveedorId: tipo === 'entrada' && proveedorId ? proveedorId : null,
      observaciones: observaciones || null
    })
  }

  const catalogError = productosError ?? proveedoresError
  const hasCatalogError = isProductosError || isProveedoresError
  const retryCatalogQueries = () => {
    refetchProductos()
    refetchProveedores()
  }
  const isRetryingCatalog = isFetchingProductos || isFetchingProveedores

  if (isProductosLoading && isProveedoresLoading) {
    return (
      <div className="space-y-6">
        <SkeletonText width="w-64" className="h-8" />
        <SkeletonCard />
        <SkeletonList />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <h1 className="text-3xl font-bold text-gray-900">Gestion de Deposito</h1>

      {hasCatalogError && (
        <ErrorMessage
          message={parseErrorMessage(catalogError, import.meta.env.PROD)}
          type={detectErrorType(catalogError)}
          requestId={extractRequestId(catalogError)}
          onRetry={retryCatalogQueries}
          isRetrying={isRetryingCatalog}
        />
      )}

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('rapido')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'rapido'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Ingreso Rapido
        </button>
        <button
          onClick={() => setActiveTab('normal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'normal'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Movimiento Normal
        </button>
      </div>

      {/* === Quick Entry Mode === */}
      {activeTab === 'rapido' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">Ingreso Rapido</h2>
            <span className="text-sm text-gray-400 ml-2">Seleccionar producto → cantidad → Enter</span>
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-4">
            {/* Product search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={qSearchRef}
                  type="text"
                  value={qSearch}
                  onChange={(e) => {
                    setQSearch(e.target.value)
                    if (qProducto) setQProducto(null)
                  }}
                  placeholder="Nombre o codigo de barras..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  autoComplete="off"
                />
              </div>

              {/* Dropdown */}
              {qSearch && !qProducto && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto mt-1">
                  {qProductosFiltrados.map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => {
                        setQProducto(producto)
                        setQSearch(producto.nombre)
                        setTimeout(() => qCantidadRef.current?.focus(), 50)
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-medium">{producto.nombre}</div>
                      {producto.codigo_barras && (
                        <div className="text-sm text-gray-500">{producto.codigo_barras}</div>
                      )}
                    </button>
                  ))}
                  {qProductosFiltrados.length === 0 && (
                    <div className="px-4 py-2.5 text-gray-500 text-sm">No se encontraron productos</div>
                  )}
                </div>
              )}

              {/* Selected indicator */}
              {qProducto && (
                <div className="mt-1 text-sm text-green-600 font-medium">
                  Seleccionado: {qProducto.nombre}
                </div>
              )}
            </div>

            {/* Quantity + Proveedor row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  ref={qCantidadRef}
                  type="number"
                  value={qCantidad}
                  onChange={(e) => setQCantidad(e.target.value)}
                  min="1"
                  placeholder="Cantidad"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor (opcional)
                </label>
                <select
                  value={qProveedorId}
                  onChange={(e) => setQProveedorId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={quickMutation.isPending || !qProducto}
              className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {quickMutation.isPending ? 'Registrando...' : 'REGISTRAR ENTRADA'}
            </button>
          </form>
        </div>
      )}

      {/* === Normal Mode === */}
      {activeTab === 'normal' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Registrar Movimiento</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de movimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimiento
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`flex-1 py-4 px-6 rounded-lg border-2 font-medium transition-all ${tipo === 'entrada'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                >
                  <Plus className="w-6 h-6 mx-auto mb-2" />
                  ENTRADA
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('salida')}
                  className={`flex-1 py-4 px-6 rounded-lg border-2 font-medium transition-all ${tipo === 'salida'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                >
                  <Minus className="w-6 h-6 mx-auto mb-2" />
                  SALIDA
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('ajuste')}
                  className={`flex-1 py-4 px-6 rounded-lg border-2 font-medium transition-all ${tipo === 'ajuste'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                >
                  <RefreshCw className="w-6 h-6 mx-auto mb-2" />
                  AJUSTE
                </button>
              </div>
            </div>

            {/* Busqueda de producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Producto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escriba el nombre o codigo del producto..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
            </div>

            {/* Lista de productos filtrados */}
            {searchTerm && (
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {productosFiltrados.map((producto) => (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => {
                      setSelectedProducto(producto)
                      setSearchTerm('')
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium">{producto.nombre}</div>
                    {producto.codigo_barras && (
                      <div className="text-sm text-gray-500">{producto.codigo_barras}</div>
                    )}
                  </button>
                ))}
                {productosFiltrados.length === 0 && (
                  <div className="px-4 py-3 text-gray-500">No se encontraron productos</div>
                )}
              </div>
            )}

            {/* Producto seleccionado */}
            {selectedProducto && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-medium text-blue-900">Producto seleccionado:</div>
                <div className="text-lg font-bold text-blue-900">{selectedProducto.nombre}</div>
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Ingrese la cantidad"
              />
            </div>

            {/* Proveedor (solo para entradas) */}
            {tipo === 'entrada' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor
                </label>
                <select
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Destino (solo para salidas) */}
            {tipo === 'salida' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destino
                </label>
                <select
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                >
                  <option value="">Seleccione destino</option>
                  <option value="Mini Market">Mini Market</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            )}

            {/* Motivo (obligatorio para ajustes) */}
            {tipo === 'ajuste' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del ajuste *
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
                  placeholder="Ej: Conteo fisico, merma, rotura..."
                />
              </div>
            )}

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Mensaje */}
            {mensaje && (
              <div
                className={`p-4 rounded-lg ${mensaje.tipo === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
              >
                {mensaje.texto}
              </div>
            )}

            {/* Boton submit */}
            <button
              type="submit"
              disabled={movimientoMutation.isPending || !selectedProducto}
              className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {movimientoMutation.isPending ? 'Registrando...' : 'REGISTRAR MOVIMIENTO'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
