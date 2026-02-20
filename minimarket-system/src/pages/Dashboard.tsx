import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, TrendingUp, Package, CheckCircle, Monitor, ClipboardList, Users, DollarSign, ArrowRight, Lightbulb, X } from 'lucide-react'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType, extractRequestId } from '../components/errorMessageUtils'
import { useDashboardStats } from '../hooks/queries'
import { SkeletonCard, SkeletonText, SkeletonList } from '../components/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { bitacoraApi, cuentasCorrientesApi } from '../lib/apiClient'
import { useUserRole } from '../hooks/useUserRole'
import { money } from '../utils/currency'
import { supabase } from '../lib/supabase'

const HUB_ACTIONS = [
  { key: 'vender', path: '/pos', label: 'Vender', icon: Monitor, color: 'bg-green-600 hover:bg-green-700 text-white' },
  { key: 'stock', path: '/stock', label: 'Stock', icon: Package, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { key: 'pedidos', path: '/pedidos', label: 'Pedidos', icon: ClipboardList, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  { key: 'clientes', path: '/clientes', label: 'Clientes', icon: Users, color: 'bg-orange-600 hover:bg-orange-700 text-white' },
  { key: 'fiado', path: '/clientes', label: 'Fiado', icon: DollarSign, color: 'bg-red-600 hover:bg-red-700 text-white' },
]

type ChipId = 'reponer' | 'riesgo' | 'resumen'

const INTENT_CHIPS: { id: ChipId; label: string; icon: typeof Package }[] = [
  { id: 'reponer', label: '¿Qué me falta reponer?', icon: Package },
  { id: 'riesgo', label: '¿Productos con riesgo?', icon: AlertTriangle },
  { id: 'resumen', label: 'Resumen del día', icon: TrendingUp },
]

export default function Dashboard() {
  const [activeChip, setActiveChip] = useState<ChipId | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_completed')
  })
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardStats();
  const { role, canAccess } = useUserRole()

  const dismissOnboarding = () => {
    localStorage.setItem('onboarding_completed', '1')
    setShowOnboarding(false)
  }

  const hubActions = useMemo(() => {
    return HUB_ACTIONS.filter(a => canAccess(a.path))
  }, [canAccess])

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

  // V2-08: Lazy vencimientos count (fires only when 'riesgo' chip is active)
  const vencimientosCountQuery = useQuery({
    queryKey: ['dashboard-vencimientos-count'],
    queryFn: async () => {
      const { count, error: qErr } = await supabase
        .from('mv_productos_proximos_vencer')
        .select('*', { count: 'exact', head: true })
        .neq('nivel_alerta', 'normal')
      if (qErr) throw qErr
      return count ?? 0
    },
    enabled: activeChip === 'riesgo',
    staleTime: 5 * 60 * 1000,
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
          requestId={extractRequestId(error)}
        />
      </div>
    )
  }

  // Destructure con defaults seguros
  const {
    tareasPendientes = [],
    totalTareasPendientes = 0,
    tareasUrgentes = 0,
    stockBajo = 0,
    totalProductos = 0,
  } = data ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* V2-09: Onboarding silencioso — guía de primer uso */}
      {showOnboarding && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 relative">
          <button
            onClick={dismissOnboarding}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-indigo-900 mb-3">Empezá por acá:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/pos"
              onClick={dismissOnboarding}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow transition-all"
            >
              <span className="text-2xl font-bold text-indigo-600 mb-1">1</span>
              <Monitor className="w-8 h-8 text-indigo-600 mb-2" />
              <span className="font-medium text-gray-800">Vender</span>
              <span className="text-xs text-gray-500 mt-1">Punto de venta</span>
            </Link>
            <Link
              to="/stock"
              onClick={dismissOnboarding}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow transition-all"
            >
              <span className="text-2xl font-bold text-indigo-600 mb-1">2</span>
              <Package className="w-8 h-8 text-indigo-600 mb-2" />
              <span className="font-medium text-gray-800">Ver stock</span>
              <span className="text-xs text-gray-500 mt-1">Control de inventario</span>
            </Link>
            <Link
              to="/pedidos"
              onClick={dismissOnboarding}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow transition-all"
            >
              <span className="text-2xl font-bold text-indigo-600 mb-1">3</span>
              <ClipboardList className="w-8 h-8 text-indigo-600 mb-2" />
              <span className="font-medium text-gray-800">Ver pedidos</span>
              <span className="text-xs text-gray-500 mt-1">Órdenes de compra</span>
            </Link>
          </div>
        </div>
      )}

      {/* Hub operativo */}
      {hubActions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {hubActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.key}
                to={action.path}
                className={`flex flex-col items-center justify-center min-h-[72px] rounded-xl font-bold text-lg shadow-sm transition-colors ${action.color}`}
              >
                <Icon className="w-6 h-6 mb-1" />
                {action.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* V2-08: Intent chips — IA guiada fase 1 */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {INTENT_CHIPS.map(chip => {
            const Icon = chip.icon
            const isActive = activeChip === chip.id
            return (
              <button
                key={chip.id}
                onClick={() => setActiveChip(isActive ? null : chip.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 shadow-sm'
                }`}
              >
                <Icon className="w-4 h-4" />
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Panel: ¿Qué me falta reponer? */}
        {activeChip === 'reponer' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-800">
                {stockBajo > 0
                  ? `Tenés ${stockBajo} producto${stockBajo !== 1 ? 's' : ''} con stock bajo que necesitan reposición.`
                  : 'Todo el stock está en niveles normales. No necesitás reponer nada por ahora.'}
              </p>
            </div>
            {stockBajo > 0 && (
              <Link
                to="/stock"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                Ver Stock Bajo
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* Panel: ¿Productos con riesgo? */}
        {activeChip === 'riesgo' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              {vencimientosCountQuery.isLoading ? (
                <p className="text-gray-500">Analizando productos...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-gray-800">
                    {(vencimientosCountQuery.data ?? 0) > 0
                      ? `Hay ${vencimientosCountQuery.data} producto${(vencimientosCountQuery.data ?? 0) !== 1 ? 's' : ''} próximos a vencer que necesitan atención.`
                      : 'No hay productos próximos a vencer.'}
                  </p>
                  {stockBajo > 0 && (
                    <p className="text-gray-600 text-sm">
                      Además, {stockBajo} producto{stockBajo !== 1 ? 's' : ''} con stock bajo.
                    </p>
                  )}
                </div>
              )}
            </div>
            {((vencimientosCountQuery.data ?? 0) > 0 || stockBajo > 0) && (
              <Link
                to="/stock"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition-colors"
              >
                Revisar Stock
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* Panel: Resumen del día */}
        {activeChip === 'resumen' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-gray-800 font-medium">Estado actual del negocio:</p>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• {totalProductos} productos registrados</li>
                  <li>• {stockBajo > 0 ? `${stockBajo} con stock bajo` : 'Stock en niveles normales'}</li>
                  <li>• {tareasUrgentes > 0 ? `${tareasUrgentes} tarea${tareasUrgentes !== 1 ? 's' : ''} urgente${tareasUrgentes !== 1 ? 's' : ''}` : 'Sin tareas urgentes'}</li>
                  <li>• {totalTareasPendientes} tarea{totalTareasPendientes !== 1 ? 's' : ''} pendiente{totalTareasPendientes !== 1 ? 's' : ''} en total</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/stock"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
              >
                Ver Stock
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/pos"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
              >
                Ir a Ventas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

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
              <p className="text-3xl font-bold text-green-600">{totalTareasPendientes}</p>
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
            <div className="mt-3 space-y-2">
              <SkeletonText width="w-32" className="h-4" />
              <SkeletonText width="w-48" className="h-8" />
            </div>
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
            <div className="mt-3 space-y-2">
              <SkeletonText width="w-full" className="h-4" />
              <SkeletonText width="w-3/4" className="h-4" />
            </div>
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
          <h2 className="text-xl font-semibold">
            {totalTareasPendientes > tareasPendientes.length
              ? `Top ${tareasPendientes.length} Tareas Pendientes (${totalTareasPendientes} total)`
              : 'Tareas Pendientes Prioritarias'}
          </h2>
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
