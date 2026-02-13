import { AlertTriangle, TrendingUp, Package, CheckCircle } from 'lucide-react'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import { useDashboardStats } from '../hooks/queries'
import { SkeletonCard, SkeletonText, SkeletonList } from '../components/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { bitacoraApi, cuentasCorrientesApi } from '../lib/apiClient'
import { useUserRole } from '../hooks/useUserRole'
import { money } from '../utils/currency'

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardStats();
  const { role } = useUserRole()

  const ccEnabled = role === 'admin' || role === 'ventas'
  const ccResumenQuery = useQuery({
    queryKey: ['cc-resumen'],
    queryFn: () => cuentasCorrientesApi.resumen(),
    enabled: ccEnabled,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })

  const bitacoraEnabled = role === 'admin'
  const bitacoraQuery = useQuery({
    queryKey: ['bitacora', 'latest'],
    queryFn: () => bitacoraApi.list({ limit: 10, offset: 0 }),
    enabled: bitacoraEnabled,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonText width="w-48" className="h-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <SkeletonText width="w-64" className="h-6" />
          <SkeletonList />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  // Destructure con defaults seguros
  const {
    tareasPendientes = [],
    tareasUrgentes = 0,
    stockBajo = 0,
    totalProductos = 0,
  } = data ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tareas Urgentes</p>
              <p className="text-3xl font-bold text-red-600">{tareasUrgentes}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-3xl font-bold text-orange-600">{stockBajo}</p>
            </div>
            <Package className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-3xl font-bold text-blue-600">{totalProductos}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tareas Pendientes</p>
              <p className="text-3xl font-bold text-green-600">{tareasPendientes.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Cuenta Corriente */}
      {ccEnabled && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900">Cuenta Corriente</h2>
          {ccResumenQuery.isLoading ? (
            <div className="mt-3 text-gray-500">Cargando…</div>
          ) : ccResumenQuery.isError ? (
            <ErrorMessage
              message={parseErrorMessage(ccResumenQuery.error)}
              type={detectErrorType(ccResumenQuery.error)}
              onRetry={() => ccResumenQuery.refetch()}
              isRetrying={ccResumenQuery.isFetching}
              size="sm"
            />
          ) : (
            <div className="mt-3 flex flex-wrap gap-6">
              <div>
                <div className="text-sm text-gray-600">Dinero en la calle</div>
                <div className="text-3xl font-bold text-gray-900">
                  ${money(Number(ccResumenQuery.data?.dinero_en_la_calle ?? 0))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Clientes con deuda</div>
                <div className="text-3xl font-bold text-gray-900">
                  {Number(ccResumenQuery.data?.clientes_con_deuda ?? 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bitácora de turnos (admin) */}
      {bitacoraEnabled && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900">Bitácora de Turno</h2>
          {bitacoraQuery.isLoading ? (
            <div className="mt-3 text-gray-500">Cargando…</div>
          ) : bitacoraQuery.isError ? (
            <ErrorMessage
              message={parseErrorMessage(bitacoraQuery.error)}
              type={detectErrorType(bitacoraQuery.error)}
              onRetry={() => bitacoraQuery.refetch()}
              isRetrying={bitacoraQuery.isFetching}
              size="sm"
            />
          ) : (bitacoraQuery.data ?? []).length === 0 ? (
            <div className="mt-3 text-gray-500">Sin notas</div>
          ) : (
            <div className="mt-3 space-y-3">
              {(bitacoraQuery.data ?? []).slice(0, 5).map((n) => (
                <div key={n.id} className="p-3 rounded-lg border bg-gray-50">
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{new Date(n.created_at).toLocaleString('es-AR')}</span>
                    <span className="font-medium text-gray-700">
                      {n.usuario_nombre || n.usuario_email || n.usuario_rol || '—'}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{n.nota}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tareas recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Tareas Pendientes Prioritarias</h2>
        </div>
        <div className="p-6">
          {tareasPendientes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay tareas pendientes</p>
          ) : (
            <div className="space-y-3">
              {tareasPendientes.map((tarea) => (
                <div
                  key={tarea.id}
                  className={`p-4 rounded-lg border-l-4 ${tarea.prioridad === 'urgente'
                    ? 'border-red-500 bg-red-50'
                    : tarea.prioridad === 'normal'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{tarea.titulo}</h3>
                      <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Asignado a: {tarea.asignada_a_nombre || 'Sin asignar'}</span>
                        {tarea.fecha_vencimiento && (
                          <span>Vence: {new Date(tarea.fecha_vencimiento).toLocaleDateString('es-AR')}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${tarea.prioridad === 'urgente'
                        ? 'bg-red-100 text-red-800'
                        : tarea.prioridad === 'normal'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}
                    >
                      {tarea.prioridad.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
