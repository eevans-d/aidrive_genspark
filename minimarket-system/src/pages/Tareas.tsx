import { useState } from 'react'
import { CheckCircle, X, Plus } from 'lucide-react'
import { useTareas, TareaPendiente, type TareasResult } from '../hooks/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tareasApi, ApiError } from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import { SkeletonList, SkeletonText } from '../components/Skeleton'

function computeTareasMetrics(tareas: TareaPendiente[]) {
  return {
    total: tareas.length,
    urgentes: tareas.filter((t) => t.prioridad === 'urgente').length,
    pendientes: tareas.filter((t) => t.estado === 'pendiente').length,
    completadas: tareas.filter((t) => t.estado === 'completada').length,
  }
}

export default function Tareas() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    asignada_a_nombre: '',
    prioridad: 'normal' as 'baja' | 'normal' | 'urgente',
    fecha_vencimiento: ''
  })

  const { data, isLoading, isError, error, refetch, isFetching } = useTareas()

  // Mutación para crear tarea (via gateway)
  const createMutation = useMutation({
    mutationFn: async (newTarea: typeof formData) => {
      return tareasApi.create({
        titulo: newTarea.titulo,
        descripcion: newTarea.descripcion || undefined,
        asignada_a_nombre: newTarea.asignada_a_nombre || undefined,
        prioridad: newTarea.prioridad,
        fecha_vencimiento: newTarea.fecha_vencimiento || null
      })
    },
    onMutate: async (newTarea) => {
      await queryClient.cancelQueries({ queryKey: ['tareas'] })
      const previous = queryClient.getQueryData<TareasResult>(['tareas'])

      const now = new Date().toISOString()
      const tempId = `temp-${crypto.randomUUID()}`

      const optimistic: TareaPendiente = {
        id: tempId,
        titulo: newTarea.titulo,
        descripcion: newTarea.descripcion || null,
        asignada_a_id: null,
        asignada_a_nombre: newTarea.asignada_a_nombre || null,
        prioridad: newTarea.prioridad,
        estado: 'pendiente',
        fecha_creacion: now,
        fecha_vencimiento: newTarea.fecha_vencimiento || null,
        fecha_completada: null,
        completada_por_id: null,
        completada_por_nombre: null,
        fecha_cancelada: null,
        cancelada_por_id: null,
        cancelada_por_nombre: null,
        razon_cancelacion: null,
        creada_por_id: null,
        creada_por_nombre: null,
        created_at: now,
        updated_at: now,
      }

      queryClient.setQueryData<TareasResult>(['tareas'], (curr) => {
        const base = curr?.tareas ?? []
        const next = [optimistic, ...base]
        const metrics = computeTareasMetrics(next)
        return { tareas: next, ...metrics }
      })

      return { previous, tempId }
    },
    onError: (_err, _newTarea, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['tareas'], ctx.previous)
      }
    },
    onSuccess: (server, _vars, ctx) => {
      // Reemplazar tempId por el id real sin esperar refetch
      queryClient.setQueryData<TareasResult>(['tareas'], (curr) => {
        const base = curr?.tareas ?? []
        const now = new Date().toISOString()
        const mapped: Partial<TareaPendiente> = {
          id: server.id,
          titulo: server.titulo,
          descripcion: server.descripcion ?? null,
          estado: (server.estado as any) ?? 'pendiente',
          prioridad: (server.prioridad as any) ?? 'normal',
          asignada_a_nombre: server.asignada_a_nombre ?? null,
          fecha_vencimiento: server.fecha_vencimiento ?? null,
          fecha_creacion: server.created_at ?? now,
          created_at: server.created_at ?? now,
          updated_at: server.created_at ?? now,
        }

        const next = base.map((t) => {
          if (ctx?.tempId && t.id === ctx.tempId) return { ...t, ...mapped }
          return t
        })
        const metrics = computeTareasMetrics(next)
        return { tareas: next, ...metrics }
      })

      setShowForm(false)
      setFormData({
        titulo: '',
        descripcion: '',
        asignada_a_nombre: '',
        prioridad: 'normal',
        fecha_vencimiento: ''
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
    },
  })

  // Mutación para completar tarea (via gateway)
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return tareasApi.completar(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tareas'] })
      const previous = queryClient.getQueryData<TareasResult>(['tareas'])

      queryClient.setQueryData<TareasResult>(['tareas'], (curr) => {
        const base = curr?.tareas ?? []
        const now = new Date().toISOString()
        const next = base.map((t) =>
          t.id === id
            ? { ...t, estado: 'completada' as const, fecha_completada: now, completada_por_nombre: t.completada_por_nombre ?? '—' }
            : t,
        )
        const metrics = computeTareasMetrics(next)
        return { tareas: next, ...metrics }
      })

      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['tareas'], ctx.previous)
    },
    onSuccess: (server, id) => {
      queryClient.setQueryData<TareasResult>(['tareas'], (curr) => {
        const base = curr?.tareas ?? []
        const next = base.map((t) =>
          t.id === id
            ? {
              ...t,
              estado: (server.estado as any) ?? 'completada',
            }
            : t,
        )
        const metrics = computeTareasMetrics(next)
        return { tareas: next, ...metrics }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
    },
  })

  // Mutación para cancelar tarea (via gateway)
  const cancelMutation = useMutation({
    mutationFn: async ({ id, razon }: { id: string; razon: string }) => {
      return tareasApi.cancelar(id, razon)
    },
    onMutate: async ({ id, razon }) => {
      await queryClient.cancelQueries({ queryKey: ['tareas'] })
      const previous = queryClient.getQueryData<TareasResult>(['tareas'])

      queryClient.setQueryData<TareasResult>(['tareas'], (curr) => {
        const base = curr?.tareas ?? []
        const now = new Date().toISOString()
        const next = base.map((t) =>
          t.id === id
            ? { ...t, estado: 'cancelada' as const, razon_cancelacion: razon, fecha_cancelada: now, cancelada_por_nombre: t.cancelada_por_nombre ?? '—' }
            : t,
        )
        const metrics = computeTareasMetrics(next)
        return { tareas: next, ...metrics }
      })

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['tareas'], ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
    },
  })

  const handleCreateTarea = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleCompletarTarea = (id: string) => {
    completeMutation.mutate(id)
  }

  const handleCancelarTarea = (id: string) => {
    const razon = prompt('Ingrese la razón de cancelación:')
    if (!razon) return
    cancelMutation.mutate({ id, razon })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonText width="w-56" className="h-8" />
        <div className="bg-white rounded-lg shadow p-6">
          <SkeletonList />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Tareas</h1>
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  const { tareas = [] } = data ?? {}
  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente')
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Tareas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nueva Tarea
        </button>
      </div>

      {/* Formulario de nueva tarea */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Crear Nueva Tarea</h2>
          <form onSubmit={handleCreateTarea} className="space-y-4">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                id="titulo"
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="asignada-a" className="block text-sm font-medium text-gray-700 mb-2">
                  Asignada a
                </label>
                <input
                  id="asignada-a"
                  type="text"
                  value={formData.asignada_a_nombre}
                  onChange={(e) => setFormData({ ...formData, asignada_a_nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  id="prioridad"
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fecha-vencimiento" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                id="fecha-vencimiento"
                type="datetime-local"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {createMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {createMutation.error instanceof ApiError
                  ? createMutation.error.message
                  : 'Error al crear tarea'}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Tarea'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tareas Pendientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            Tareas Pendientes ({tareasPendientes.length})
          </h2>
        </div>
        <div className="p-6 space-y-4">
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
                  {tarea.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>
                  )}
                  <div className="mt-2 flex items-center flex-wrap gap-4 text-sm text-gray-500">
                    {tarea.asignada_a_nombre && (
                      <span>Asignado: {tarea.asignada_a_nombre}</span>
                    )}
                    {tarea.fecha_vencimiento && (
                      <span>Vence: {new Date(tarea.fecha_vencimiento).toLocaleString('es-AR')}</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tarea.prioridad === 'urgente'
                        ? 'bg-red-100 text-red-800'
                        : tarea.prioridad === 'normal'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                      {tarea.prioridad.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleCompletarTarea(tarea.id)}
                    disabled={completeMutation.isPending}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg disabled:opacity-50"
                    title="Completar"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCancelarTarea(tarea.id)}
                    disabled={cancelMutation.isPending}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50"
                    title="Cancelar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tareasPendientes.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay tareas pendientes</p>
          )}
        </div>
      </div>

      {/* Tareas Completadas */}
      {tareasCompletadas.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">
              Tareas Completadas ({tareasCompletadas.length})
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {tareasCompletadas.slice(0, 5).map((tarea) => (
              <div key={tarea.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-700">{tarea.titulo}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      Completada por {tarea.completada_por_nombre} el{' '}
                      {tarea.fecha_completada && new Date(tarea.fecha_completada).toLocaleString('es-AR')}
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
