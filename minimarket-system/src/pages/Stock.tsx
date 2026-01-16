import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StockDeposito, Producto, StockReservado, OrdenCompra } from '../types/database'
import { Package, AlertTriangle, Download } from 'lucide-react'

interface StockConProducto extends StockDeposito {
  producto?: Producto
  reservado: number
  disponible: number
  transito: number
}

export default function Stock() {
  const [stock, setStock] = useState<StockConProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'bajo' | 'critico'>('todos')
  const [page, setPage] = useState(0)
  const [totalStock, setTotalStock] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    loadStock()
  }, [page])

  useEffect(() => {
    setPage(0)
  }, [filtro])

  async function loadStock() {
    try {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data: stockData, count } = await supabase
        .from('stock_deposito')
        .select('*', { count: 'exact' })
        .order('cantidad_actual', { ascending: true })
        .range(from, to)

      if (stockData) {
        setTotalStock(count ?? 0)
        // Obtener información de productos
        const productosIds = stockData.map(s => s.producto_id)
        const { data: productos } = await supabase
          .from('productos')
          .select('*')
          .in('id', productosIds)

        const { data: reservas } = await supabase
          .from('stock_reservado')
          .select('id,producto_id,cantidad,estado')
          .eq('estado', 'activa')

        const { data: ordenesCompra } = await supabase
          .from('ordenes_compra')
          .select('id,producto_id,cantidad,cantidad_recibida,estado')
          .in('estado', ['pendiente', 'en_transito'])

        const reservasPorProducto = (reservas || []).reduce<Record<string, number>>((acc, reserva) => {
          const cantidad = reserva.cantidad || 0
          acc[reserva.producto_id] = (acc[reserva.producto_id] || 0) + cantidad
          return acc
        }, {})

        const transitoPorProducto = (ordenesCompra || []).reduce<Record<string, number>>((acc, orden) => {
          const pendiente = Math.max(
            (orden.cantidad || 0) - (orden.cantidad_recibida || 0),
            0
          )
          acc[orden.producto_id] = (acc[orden.producto_id] || 0) + pendiente
          return acc
        }, {})

        const stockConProducto = stockData.map(s => ({
          ...s,
          producto: productos?.find(p => p.id === s.producto_id),
          reservado: reservasPorProducto[s.producto_id] || 0,
          disponible: Math.max(s.cantidad_actual - (reservasPorProducto[s.producto_id] || 0), 0),
          transito: transitoPorProducto[s.producto_id] || 0
        }))

        setStock(stockConProducto)
      }
    } catch (error) {
      console.error('Error cargando stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const stockFiltrado = stock.filter(s => {
    if (filtro === 'critico') return s.disponible === 0
    if (filtro === 'bajo') return s.disponible > 0 && s.disponible <= s.stock_minimo
    return true
  })

  const totalPages = Math.max(Math.ceil(totalStock / PAGE_SIZE), 1)

  const getNivelStock = (item: StockConProducto) => {
    if (item.disponible === 0) return 'critico'
    if (item.disponible <= item.stock_minimo / 2) return 'urgente'
    if (item.disponible <= item.stock_minimo) return 'bajo'
    return 'normal'
  }

  const handleExportCsv = () => {
    if (stockFiltrado.length === 0) return

    const headers = [
      'producto',
      'lote',
      'ubicacion',
      'cantidad_actual',
      'reservado',
      'disponible',
      'transito',
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
        item.producto?.nombre ?? 'Producto desconocido',
        item.lote ?? '',
        item.ubicacion ?? '',
        item.cantidad_actual,
        item.reservado,
        item.disponible,
        item.transito,
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

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
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
            className={`px-4 py-2 rounded-lg ${
              filtro === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Todos ({totalStock})
          </button>
          <button
            onClick={() => setFiltro('bajo')}
            className={`px-4 py-2 rounded-lg ${
              filtro === 'bajo' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Stock Bajo (página: {stock.filter(s => s.disponible > 0 && s.disponible <= s.stock_minimo).length})
          </button>
          <button
            onClick={() => setFiltro('critico')}
            className={`px-4 py-2 rounded-lg ${
              filtro === 'critico' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Crítico (página: {stock.filter(s => s.disponible === 0).length})
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
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
                Reservado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Disponible
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                En tránsito
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
                          {item.producto?.nombre || 'Producto desconocido'}
                        </div>
                        {item.lote && (
                          <div className="text-sm text-gray-500">Lote: {item.lote}</div>
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
                    {item.reservado}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{item.disponible}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.transito}
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mostrando página {page + 1} de {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 0))}
            disabled={page === 0}
            className={`px-4 py-2 rounded-lg ${
              page === 0 ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className={`px-4 py-2 rounded-lg ${
              page >= totalPages - 1 ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
