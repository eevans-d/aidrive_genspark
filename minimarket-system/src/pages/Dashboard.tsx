import { AlertTriangle, TrendingUp, Package, CheckCircle } from 'lucide-react'
import { ErrorMessage, parseErrorMessage, detectErrorType } from '../components/ErrorMessage'
import { useDashboardStats } from '../hooks/queries'

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
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
