import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Producto, Personal } from '../types/database'
import { Download, Filter } from 'lucide-react'

interface MovimientoDepositoRow {
  id: string
  producto_id: string
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'transferencia'
  cantidad: number
  motivo: string | null
  fecha_movimiento: string
  usuario_id: string | null
  observaciones: string | null
  lote?: string | null
}

export default function Kardex() {
  const [movimientos, setMovimientos] = useState<MovimientoDepositoRow[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [productoFiltro, setProductoFiltro] = useState('')
  const [loteFiltro, setLoteFiltro] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')

  useEffect(() => {
    loadKardex()
  }, [])

  async function loadKardex() {
    try {
      setLoading(true)
      setError(null)

      const [movimientosRes, productosRes, personalRes] = await Promise.all([
        supabase
          .from('movimientos_deposito')
          .select('id,producto_id,tipo_movimiento,cantidad,motivo,fecha_movimiento,usuario_id,observaciones,lote')
          .order('fecha_movimiento', { ascending: false })
          .limit(200),
        supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .order('nombre'),
        supabase
          .from('personal')
          .select('*')
          .eq('activo', true)
          .order('nombre')
      ])

      if (movimientosRes.error) throw movimientosRes.error
      if (productosRes.error) throw productosRes.error
      if (personalRes.error) throw personalRes.error

      setMovimientos(movimientosRes.data ?? [])
      setProductos(productosRes.data ?? [])
      setPersonal(personalRes.data ?? [])
    } catch (err) {
      console.error('Error cargando kardex:', err)
      setError('No pudimos cargar el historial de movimientos. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const productosMap = useMemo(() => {
    return Object.fromEntries(productos.map((p) => [p.id, p]))
  }, [productos])

  const personalMap = useMemo(() => {
    return Object.fromEntries(personal.map((p) => [p.id, p]))
  }, [personal])

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((mov) => {
      const productoOk = !productoFiltro || mov.producto_id === productoFiltro
      const loteOk = !loteFiltro || (mov.lote || '').toLowerCase().includes(loteFiltro.toLowerCase())
      const usuarioOk = !usuarioFiltro || mov.usuario_id === usuarioFiltro
      return productoOk && loteOk && usuarioOk
    })
  }, [movimientos, productoFiltro, loteFiltro, usuarioFiltro])

  const handleExportCsv = () => {
    if (movimientosFiltrados.length === 0) return

    const headers = [
      'fecha_movimiento',
      'producto',
      'tipo_movimiento',
      'cantidad',
      'lote',
      'usuario',
      'motivo',
      'observaciones'
    ]

    const rows = movimientosFiltrados.map((mov) => {
      const producto = productosMap[mov.producto_id]?.nombre ?? 'Producto desconocido'
      const usuario = mov.usuario_id
        ? personalMap[mov.usuario_id]?.nombre ?? 'Usuario desconocido'
        : 'Sin asignar'

      return [
        new Date(mov.fecha_movimiento).toLocaleString('es-AR'),
        producto,
        mov.tipo_movimiento,
        mov.cantidad,
        mov.lote ?? '',
        usuario,
        mov.motivo ?? '',
        mov.observaciones ?? ''
      ]
    })

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

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Kardex de Movimientos</h1>
        <button
          onClick={handleExportCsv}
          disabled={movimientosFiltrados.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadKardex}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm text-gray-600 mb-1">Usuario</label>
            <select
              value={usuarioFiltro}
              onChange={(e) => setUsuarioFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Todos</option>
              {personal.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.nombre}
                </option>
              ))}
            </select>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movimientosFiltrados.map((mov) => {
              const productoNombre = productosMap[mov.producto_id]?.nombre ?? 'Producto desconocido'
              const usuarioNombre = mov.usuario_id
                ? personalMap[mov.usuario_id]?.nombre ?? 'Usuario desconocido'
                : 'Sin asignar'

              return (
                <tr key={mov.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(mov.fecha_movimiento).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{productoNombre}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      mov.tipo_movimiento === 'entrada'
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
                  <td className="px-4 py-3 text-sm text-gray-700">{usuarioNombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{mov.motivo ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {movimientosFiltrados.length === 0 && (
          <div className="p-6 text-center text-gray-500">No hay movimientos para mostrar.</div>
        )}
      </div>
    </div>
  )
}
