import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { depositoApi, ApiError, DropdownItem } from '../lib/apiClient'
import { Plus, Minus, Zap, RefreshCw, ClipboardList, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SkeletonList } from '../components/Skeleton'
import { ProductCombobox } from '../components/ProductCombobox'
import { SupplierCombobox } from '../components/SupplierCombobox'
import { supabase } from '../lib/supabase'

type TabMode = 'rapido' | 'normal' | 'recepcion'

export default function Deposito() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabMode>('rapido')

  // === Normal mode state ===
  const [selectedProducto, setSelectedProducto] = useState<DropdownItem | null>(null)
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [destino, setDestino] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  // === Quick entry state ===
  const [qProducto, setQProducto] = useState<DropdownItem | null>(null)
  const [qCantidad, setQCantidad] = useState('')
  const [qProveedorId, setQProveedorId] = useState('')
  const [qComboboxKey, setQComboboxKey] = useState(0)
  const qCantidadRef = useRef<HTMLInputElement>(null)

  // === Recepcion OC state ===
  const [recCantidad, setRecCantidad] = useState('')
  const [receivingId, setReceivingId] = useState<string | null>(null)

  // Query para stock info del producto seleccionado (quick entry o normal)
  const activeProductId = activeTab === 'rapido' ? qProducto?.id : selectedProducto?.id
  const {
    data: stockInfo,
  } = useQuery({
    queryKey: ['stock-info', activeProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_deposito')
        .select('cantidad_actual, stock_minimo')
        .eq('producto_id', activeProductId!)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { cantidad_actual: number; stock_minimo: number } | null
    },
    enabled: !!activeProductId,
    staleTime: 1000 * 30,
  })

  // Query para ordenes de compra pendientes
  const {
    data: ordenesPendientes = [],
    isLoading: isOrdenesLoading,
    refetch: refetchOrdenes,
  } = useQuery({
    queryKey: ['ordenes-compra-pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes_compra')
        .select('*, productos(nombre), proveedores(nombre)')
        .in('estado', ['pendiente', 'parcial'])
        .order('fecha_creacion', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as Array<{
        id: string; producto_id: string; proveedor_id: string | null;
        cantidad: number; cantidad_recibida: number | null; estado: string;
        fecha_creacion: string; fecha_estimada: string | null;
        productos?: { nombre: string } | null; proveedores?: { nombre: string } | null;
      }>
    },
    staleTime: 1000 * 60 * 2,
    enabled: activeTab === 'recepcion',
  })

  // === Recepcion mutation ===
  const recepcionMutation = useMutation({
    mutationFn: async (params: { ordenId: string; cantidad: number; productoNombre: string }) => {
      return depositoApi.recepcionCompra({
        orden_compra_id: params.ordenId,
        cantidad: params.cantidad,
        deposito: 'Principal',
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['kardex'] })
      queryClient.invalidateQueries({ queryKey: ['deposito'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes'] })
      toast.success(`Recepcion registrada: ${variables.productoNombre} x ${variables.cantidad}`)
      // T07/ES-01: Surface backend warnings
      const warnings = (_data as unknown as Record<string, unknown>)?._warnings as Array<{ message: string }> | undefined
      if (warnings?.length) {
        warnings.forEach(w => toast.warning(w.message, { duration: 8000 }))
      }
      setReceivingId(null)
      setRecCantidad('')
    },
    onError: (error: ApiError | Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al registrar recepcion', { duration: Infinity })
    }
  })

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
      // T07/ES-01: Surface backend warnings to user
      const warnings = (_data as unknown as Record<string, unknown>)?._warnings as Array<{ message: string }> | undefined
      if (warnings?.length) {
        warnings.forEach(w => toast.warning(w.message, { duration: 8000 }))
      }
      // Reset and re-focus via combobox remount
      setQProducto(null)
      setQCantidad('')
      setQProveedorId('')
      setQComboboxKey(k => k + 1)
    },
    onError: (error: ApiError | Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al registrar entrada', { duration: Infinity })
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

  // === Quick entry handler ===
  function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!qProducto) {
      toast.error('Seleccione un producto')
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

  // === Normal mode handler ===
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

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-gray-900">Gestion de Deposito</h1>

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit" role="tablist" aria-label="Modo de depósito">
        <button
          onClick={() => setActiveTab('rapido')}
          role="tab"
          aria-selected={activeTab === 'rapido'}
          aria-controls="panel-rapido"
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
          role="tab"
          aria-selected={activeTab === 'normal'}
          aria-controls="panel-normal"
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'normal'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Movimiento Normal
        </button>
        <button
          onClick={() => setActiveTab('recepcion')}
          role="tab"
          aria-selected={activeTab === 'recepcion'}
          aria-controls="panel-recepcion"
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'recepcion'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Recepcion OC
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
              <ProductCombobox
                key={qComboboxKey}
                value={qProducto}
                onSelect={(p) => {
                  setQProducto(p)
                  // Focus quantity input after selection
                  setTimeout(() => qCantidadRef.current?.focus(), 100)
                }}
                autoFocus
                placeholder="Nombre o codigo de barras..."
                mode="inline"
              />

              {/* Stock info */}
              {qProducto && stockInfo && (
                <div className="mt-1 text-sm text-gray-500">
                  Stock actual: {stockInfo.cantidad_actual} | Minimo: {stockInfo.stock_minimo}
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
                <SupplierCombobox
                  value={qProveedorId || null}
                  onSelect={(id) => setQProveedorId(id)}
                  placeholder="Sin proveedor"
                />
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
              <ProductCombobox
                value={selectedProducto}
                onSelect={(p) => {
                  setSelectedProducto(p)
                }}
                placeholder="Nombre o codigo de barras..."
                mode="popover"
              />

              {/* Stock info */}
              {selectedProducto && stockInfo && (
                <div className="mt-2 text-sm text-gray-500">
                  Stock actual: {stockInfo.cantidad_actual} | Minimo: {stockInfo.stock_minimo}
                </div>
              )}
            </div>

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
                <SupplierCombobox
                  value={proveedorId || null}
                  onSelect={(id) => setProveedorId(id)}
                  placeholder="Seleccione un proveedor"
                />
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

      {/* === Recepcion OC Mode === */}
      {activeTab === 'recepcion' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold">Recepcion de Ordenes de Compra</h2>
            </div>
            <button
              onClick={() => refetchOrdenes()}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isOrdenesLoading ? (
            <SkeletonList />
          ) : ordenesPendientes.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay ordenes de compra pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenesPendientes.map(oc => {
                const pendiente = oc.cantidad - (oc.cantidad_recibida ?? 0)
                const isReceiving = receivingId === oc.id

                return (
                  <div key={oc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {oc.productos?.nombre ?? 'Producto desconocido'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {oc.proveedores?.nombre ?? 'Sin proveedor'} | Pedido: {oc.cantidad} | Recibido: {oc.cantidad_recibida ?? 0} | Pendiente: {pendiente}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(oc.fecha_creacion).toLocaleDateString('es-AR')}
                          {oc.fecha_estimada && ` | Estimada: ${new Date(oc.fecha_estimada).toLocaleDateString('es-AR')}`}
                        </div>
                      </div>
                      {!isReceiving && (
                        <button
                          onClick={() => { setReceivingId(oc.id); setRecCantidad(String(pendiente)) }}
                          className="px-4 py-2 min-h-[44px] text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Recibir
                        </button>
                      )}
                    </div>

                    {isReceiving && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a recibir</label>
                          <input
                            type="number"
                            value={recCantidad}
                            onChange={e => setRecCantidad(e.target.value)}
                            min="1"
                            max={pendiente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={() => {
                            const qty = parseInt(recCantidad, 10)
                            if (!Number.isFinite(qty) || qty <= 0) {
                              toast.error('Cantidad invalida')
                              return
                            }
                            recepcionMutation.mutate({
                              ordenId: oc.id,
                              cantidad: qty,
                              productoNombre: oc.productos?.nombre ?? 'Producto',
                            })
                          }}
                          disabled={recepcionMutation.isPending}
                          className="px-4 py-2 min-h-[44px] text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {recepcionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                        </button>
                        <button
                          onClick={() => { setReceivingId(null); setRecCantidad('') }}
                          className="px-3 py-2 min-h-[44px] text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
