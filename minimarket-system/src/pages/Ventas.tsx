import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Calendar, CreditCard, Banknote, Loader2 } from 'lucide-react'
import { ventasApi } from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import { money } from '../utils/currency'

type RangoPreset = 'hoy' | 'semana' | 'mes' | 'custom'

function getDateRange(preset: RangoPreset): { desde: string; hasta: string } {
  const now = new Date()
  const hasta = now.toISOString()

  switch (preset) {
    case 'hoy': {
      const desde = new Date(now)
      desde.setHours(0, 0, 0, 0)
      return { desde: desde.toISOString(), hasta }
    }
    case 'semana': {
      const desde = new Date(now)
      desde.setDate(desde.getDate() - 7)
      desde.setHours(0, 0, 0, 0)
      return { desde: desde.toISOString(), hasta }
    }
    case 'mes': {
      const desde = new Date(now)
      desde.setDate(desde.getDate() - 30)
      desde.setHours(0, 0, 0, 0)
      return { desde: desde.toISOString(), hasta }
    }
    case 'custom':
      return { desde: '', hasta: '' }
  }
}

interface Venta {
  id: string
  created_at: string
  metodo_pago: string
  monto_total: number
  cliente_id: string | null
  clientes: { nombre: string; telefono: string | null } | null
}

export default function Ventas() {
  const [preset, setPreset] = useState<RangoPreset>('hoy')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const dateRange = useMemo(() => {
    if (preset === 'custom') {
      return {
        desde: customDesde ? new Date(customDesde).toISOString() : '',
        hasta: customHasta ? new Date(customHasta + 'T23:59:59').toISOString() : '',
      }
    }
    return getDateRange(preset)
  }, [preset, customDesde, customHasta])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['ventas', dateRange.desde, dateRange.hasta, page],
    queryFn: () =>
      ventasApi.list({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        fecha_desde: dateRange.desde || undefined,
        fecha_hasta: dateRange.hasta || undefined,
      }),
    staleTime: 1000 * 60 * 2,
  })

  const ventas = useMemo(() => (data as Venta[]) || [], [data])

  const resumen = useMemo(() => {
    const totalVendido = ventas.reduce((sum, v) => sum + (v.monto_total || 0), 0)
    const porMetodo: Record<string, { count: number; total: number }> = {}
    for (const v of ventas) {
      const m = v.metodo_pago || 'otro'
      if (!porMetodo[m]) porMetodo[m] = { count: 0, total: 0 }
      porMetodo[m].count++
      porMetodo[m].total += v.monto_total || 0
    }
    return { totalVendido, cantidad: ventas.length, porMetodo }
  }, [ventas])

  const metodoPagoIcon = (metodo: string) => {
    if (metodo.includes('tarjeta') || metodo.includes('debito') || metodo.includes('credito')) {
      return <CreditCard className="w-4 h-4 text-purple-500" />
    }
    return <Banknote className="w-4 h-4 text-green-500" />
  }

  const metodoPagoLabel = (metodo: string) => {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta_debito: 'Tarjeta Debito',
      tarjeta_credito: 'Tarjeta Credito',
      transferencia: 'Transferencia',
      qr: 'QR / Digital',
      cuenta_corriente: 'Cuenta Corriente',
    }
    return labels[metodo] || metodo
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>
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
      <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex gap-2">
            {(['hoy', 'semana', 'mes', 'custom'] as RangoPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPreset(p); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  preset === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Personalizado'}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={customDesde}
                  onChange={(e) => { setCustomDesde(e.target.value); setPage(1) }}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={customHasta}
                  onChange={(e) => { setCustomHasta(e.target.value); setPage(1) }}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          )}
          {isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Vendido</div>
              <div className="text-2xl font-bold text-gray-900">${money(resumen.totalVendido)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Cantidad de Ventas</div>
              <div className="text-2xl font-bold text-gray-900">{resumen.cantidad}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500 mb-2">Por Metodo de Pago</div>
          <div className="space-y-1">
            {Object.entries(resumen.porMetodo).map(([metodo, info]) => (
              <div key={metodo} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  {metodoPagoIcon(metodo)}
                  {metodoPagoLabel(metodo)}
                  <span className="text-gray-400">({info.count})</span>
                </span>
                <span className="font-medium">${money(info.total)}</span>
              </div>
            ))}
            {Object.keys(resumen.porMetodo).length === 0 && (
              <div className="text-gray-400 text-sm">Sin ventas</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metodo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {new Date(venta.created_at).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      {metodoPagoIcon(venta.metodo_pago)}
                      {metodoPagoLabel(venta.metodo_pago)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                    ${money(venta.monto_total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {venta.clientes?.nombre || '-'}
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No hay ventas en el periodo seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacion */}
        {ventas.length >= pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Pagina {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={ventas.length < pageSize}
              className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
