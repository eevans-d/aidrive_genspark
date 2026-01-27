import { useMemo, useState } from 'react'
import { Download, Filter } from 'lucide-react'
import { useKardex, KardexMovimiento } from '../hooks/queries'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'

export default function Kardex() {
  const [productoFiltro, setProductoFiltro] = useState('')
  const [loteFiltro, setLoteFiltro] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useKardex({ limit: 200 })

  // Query para lista de productos (filtros)
  const { data: productosData } = useQuery({
    queryKey: ['productos-dropdown'],
    queryFn: async () => {
      return await apiClient.productos.dropdown()
    },
    staleTime: 1000 * 60 * 10, // 10 min cache
  })

  const productos = productosData ?? []
  const movimientos = useMemo(() => data?.movimientos ?? [], [data?.movimientos])
  const resumen = useMemo(
    () => data?.resumen ?? { entradas: 0, salidas: 0, ajustes: 0 },
    [data?.resumen]
  )

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((mov) => {
      const productoOk = !productoFiltro || mov.producto_id === productoFiltro
      const loteOk = !loteFiltro || (mov.lote || '').toLowerCase().includes(loteFiltro.toLowerCase())
      return productoOk && loteOk
    })
  }, [movimientos, productoFiltro, loteFiltro])

  const handleExportCsv = () => {
    if (movimientosFiltrados.length === 0) return

    const headers = [
      'fecha_movimiento',
      'producto',
      'tipo_movimiento',
      'cantidad',
      'lote',
      'motivo',
      'observaciones'
    ]

    const rows = movimientosFiltrados.map((mov) => [
      new Date(mov.fecha_movimiento).toLocaleString('es-AR'),
      mov.producto_nombre ?? 'Producto desconocido',
      mov.tipo_movimiento,
      mov.cantidad,
      mov.lote ?? '',
      mov.motivo ?? '',
      mov.observaciones ?? ''
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
    link.download = `kardex_${new Date().toISOString().slice(0, 10)}.csv`
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
        <h1 className="text-3xl font-bold text-gray-900">Kardex de Movimientos</h1>
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kardex de Movimientos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Entradas: {resumen.entradas} | Salidas: {resumen.salidas} | Ajustes: {resumen.ajustes}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={movimientosFiltrados.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Producto</label>
            <select
              value={productoFiltro}
              onChange={(e) => setProductoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Todos</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Lote</label>
            <input
              type="text"
              value={loteFiltro}
              onChange={(e) => setLoteFiltro(e.target.value)}
              placeholder="Filtrar por lote"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movimientosFiltrados.map((mov) => (
              <tr key={mov.id}>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {new Date(mov.fecha_movimiento).toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{mov.producto_nombre ?? 'Producto desconocido'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${mov.tipo_movimiento === 'entrada'
                    ? 'bg-green-100 text-green-700'
                    : mov.tipo_movimiento === 'salida'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                    {mov.tipo_movimiento.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{mov.cantidad}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{mov.lote ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{mov.motivo ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {movimientosFiltrados.length === 0 && (
          <div className="p-6 text-center text-gray-500">No hay movimientos para mostrar.</div>
        )}
      </div>
    </div>
  )
}
