import { useState, useMemo } from 'react'
import { Package, AlertTriangle, Download } from 'lucide-react'
import { useStock, StockConProducto } from '../hooks/queries'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import { SkeletonTable, SkeletonText } from '../components/Skeleton'

type FiltroStock = 'todos' | 'bajo' | 'critico'

export default function Stock() {
  const [filtro, setFiltro] = useState<FiltroStock>('todos')

  const { data, isLoading, isError, error, refetch, isFetching } = useStock()

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const alertas = useMemo(
    () => data?.alertas ?? { stockBajo: 0, sinStock: 0 },
    [data?.alertas]
  )

  // Filtrar stock según selección
  const stockFiltrado = useMemo(() => {
    if (filtro === 'critico') return items.filter(s => s.cantidad_actual === 0)
    if (filtro === 'bajo') return items.filter(s => s.cantidad_actual > 0 && s.cantidad_actual <= s.stock_minimo)
    return items
  }, [items, filtro])

  const getNivelStock = (item: StockConProducto) => {
    if (item.cantidad_actual === 0) return 'critico'
    if (item.cantidad_actual <= item.stock_minimo / 2) return 'urgente'
    if (item.cantidad_actual <= item.stock_minimo) return 'bajo'
    return 'normal'
  }

  const handleExportCsv = () => {
    if (stockFiltrado.length === 0) return

    const headers = [
      'producto',
      'categoria',
      'ubicacion',
      'cantidad_actual',
      'stock_minimo',
      'stock_maximo',
      'estado',
    ]

    const escapeCell = (value: string | number) => {
      const raw = String(value)
      if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
        return `"${raw.replace(/"/g, '""')}"`
      }
      return raw
    }

    const rows = stockFiltrado.map((item) => {
      const nivel = getNivelStock(item)
      return [
        item.producto_nombre ?? 'Producto desconocido',
        item.producto_categoria ?? '',
        item.ubicacion ?? '',
        item.cantidad_actual,
        item.stock_minimo,
        item.stock_maximo ?? '',
        nivel,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCell).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stock_${filtro}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonText width="w-56" className="h-8" />
        <SkeletonTable />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Control de Stock</h1>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Stock</h1>
          <p className="text-gray-500">Exporta el stock filtrado en CSV.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg ${filtro === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setFiltro('bajo')}
            className={`px-4 py-2 rounded-lg ${filtro === 'bajo' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
          >
            Stock Bajo ({alertas.stockBajo})
          </button>
          <button
            onClick={() => setFiltro('critico')}
            className={`px-4 py-2 rounded-lg ${filtro === 'critico' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
          >
            Crítico ({alertas.sinStock})
          </button>
          <button
            onClick={handleExportCsv}
            disabled={stockFiltrado.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mínimo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockFiltrado.map((item) => {
              const nivel = getNivelStock(item)

              return (
                <tr key={item.id} className={
                  nivel === 'critico' ? 'bg-red-50' :
                    nivel === 'urgente' ? 'bg-orange-50' :
                      nivel === 'bajo' ? 'bg-yellow-50' :
                        ''
                }>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.producto_nombre || 'Producto desconocido'}
                        </div>
                        {item.producto_categoria && (
                          <div className="text-sm text-gray-500">{item.producto_categoria}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.ubicacion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{item.cantidad_actual}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.stock_minimo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {nivel === 'critico' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        AGOTADO
                      </span>
                    )}
                    {nivel === 'urgente' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        MUY BAJO
                      </span>
                    )}
                    {nivel === 'bajo' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        STOCK BAJO
                      </span>
                    )}
                    {nivel === 'normal' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        NORMAL
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {stockFiltrado.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay productos en esta categoría
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Mostrando {stockFiltrado.length} de {items.length} items
      </div>
    </div>
  )
}
