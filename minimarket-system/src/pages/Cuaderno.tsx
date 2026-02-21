import { useState, useMemo } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Check, RefreshCw, Copy, AlertCircle, Package, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFaltantesByProveedor, useUpdateFaltante, type FaltanteRow } from '../hooks/queries'
import { generatePurchaseSummary } from '../utils/cuadernoParser'
import { SkeletonCard, SkeletonText, SkeletonList } from '../components/Skeleton'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'

type TabId = 'todos' | 'por-proveedor' | 'resueltos'

const PRIORIDAD_COLORS: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  normal: 'bg-blue-100 text-blue-700',
  baja: 'bg-gray-100 text-gray-600',
}

const PRIORIDAD_LABELS: Record<string, string> = {
  alta: 'Urgente',
  normal: 'Normal',
  baja: 'Baja',
}

export default function Cuaderno() {
  const [activeTab, setActiveTab] = useState<TabId>('todos')
  const [expandedProveedores, setExpandedProveedores] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editObs, setEditObs] = useState('')
  const [reasignId, setReasignId] = useState<string | null>(null)
  const [reasignProvId, setReasignProvId] = useState('')

  const faltantesQuery = useFaltantesByProveedor()
  const updateFaltante = useUpdateFaltante()

  // Proveedores list for reassignment
  const { data: proveedoresList } = useQuery({
    queryKey: ['proveedores', 'all-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id,nombre')
        .eq('activo', true)
        .order('nombre')
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 10,
  })

  // Resolved items (lazy-loaded when tab is active)
  const resueltosQuery = useQuery({
    queryKey: ['faltantes', 'resueltos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos_faltantes')
        .select('*, proveedores!productos_faltantes_proveedor_id_fkey(nombre)')
        .eq('resuelto', true)
        .order('fecha_resolucion', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data || []).map((row: any) => ({
        ...row,
        proveedor_nombre: row.proveedores?.nombre ?? null,
        proveedores: undefined,
      })) as FaltanteRow[]
    },
    enabled: activeTab === 'resueltos',
    staleTime: 1000 * 60 * 2,
  })

  const { groups = {}, sinProveedor = [], total = 0 } = faltantesQuery.data ?? {}

  const allPendientes = useMemo(() => {
    const items: FaltanteRow[] = []
    Object.values(groups).forEach(g => items.push(...g.faltantes))
    items.push(...sinProveedor)
    items.sort((a, b) => {
      const prioOrder: Record<string, number> = { alta: 0, normal: 1, baja: 2 }
      const pa = prioOrder[a.prioridad ?? 'normal'] ?? 1
      const pb = prioOrder[b.prioridad ?? 'normal'] ?? 1
      if (pa !== pb) return pa - pb
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    })
    return items
  }, [groups, sinProveedor])

  const toggleProveedor = (id: string) => {
    setExpandedProveedores(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleResolve = (id: string) => {
    updateFaltante.mutate({ id, resuelto: true }, {
      onSuccess: () => toast.success('Marcado como resuelto'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Error'),
    })
  }

  const handleReopen = (id: string) => {
    updateFaltante.mutate({ id, resuelto: false, estado: 'pendiente', fecha_resolucion: '' }, {
      onSuccess: () => toast.success('Reabierto'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Error'),
    })
  }

  const handleSaveObs = (id: string) => {
    updateFaltante.mutate({ id, observaciones: editObs }, {
      onSuccess: () => { toast.success('Observación actualizada'); setEditingId(null) },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Error'),
    })
  }

  const handleReasign = (id: string) => {
    const provId = reasignProvId || null
    updateFaltante.mutate({ id, proveedor_asignado_id: provId }, {
      onSuccess: () => { toast.success('Proveedor reasignado'); setReasignId(null); setReasignProvId('') },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Error'),
    })
  }

  const handleCopySummary = (proveedorId: string, proveedorNombre: string, items: FaltanteRow[]) => {
    const summary = generatePurchaseSummary(proveedorNombre, items)
    navigator.clipboard.writeText(summary).then(
      () => toast.success('Resumen copiado al portapapeles'),
      () => toast.error('No se pudo copiar'),
    )
  }

  if (faltantesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonText width="w-48" className="h-8" />
        <SkeletonCard />
        <SkeletonList />
      </div>
    )
  }

  if (faltantesQuery.isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Cuaderno</h1>
        <ErrorMessage
          message={parseErrorMessage(faltantesQuery.error)}
          type={detectErrorType(faltantesQuery.error)}
          onRetry={() => faltantesQuery.refetch()}
          isRetrying={faltantesQuery.isFetching}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Cuaderno</h1>
          {total > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
              {total} pendiente{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(['todos', 'por-proveedor', 'resueltos'] as TabId[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'todos' ? 'Todos' : tab === 'por-proveedor' ? 'Por Proveedor' : 'Resueltos'}
          </button>
        ))}
      </div>

      {/* Tab: Todos */}
      {activeTab === 'todos' && (
        <div className="space-y-3">
          {allPendientes.length === 0 ? (
            <EmptyState message="No hay faltantes pendientes" />
          ) : (
            allPendientes.map(item => (
              <FaltanteCard
                key={item.id}
                item={item}
                onResolve={handleResolve}
                onEditObs={(id, obs) => { setEditingId(id); setEditObs(obs ?? '') }}
                onReasign={(id) => { setReasignId(id); setReasignProvId(item.proveedor_asignado_id ?? '') }}
                isEditing={editingId === item.id}
                editObs={editObs}
                onEditObsChange={setEditObs}
                onSaveObs={() => handleSaveObs(item.id)}
                onCancelEdit={() => setEditingId(null)}
                isReasigning={reasignId === item.id}
                reasignProvId={reasignProvId}
                onReasignProvChange={setReasignProvId}
                onConfirmReasign={() => handleReasign(item.id)}
                onCancelReasign={() => setReasignId(null)}
                proveedoresList={proveedoresList ?? []}
              />
            ))
          )}
        </div>
      )}

      {/* Tab: Por Proveedor */}
      {activeTab === 'por-proveedor' && (
        <div className="space-y-4">
          {Object.entries(groups).map(([provId, group]) => (
            <ProveedorGroup
              key={provId}
              proveedorId={provId}
              proveedorNombre={group.proveedorNombre}
              faltantes={group.faltantes}
              expanded={expandedProveedores.has(provId)}
              onToggle={() => toggleProveedor(provId)}
              onResolve={handleResolve}
              onCopySummary={() => handleCopySummary(provId, group.proveedorNombre, group.faltantes)}
              onEditObs={(id, obs) => { setEditingId(id); setEditObs(obs ?? '') }}
              onReasign={(id) => { setReasignId(id); setReasignProvId('') }}
              editingId={editingId}
              editObs={editObs}
              onEditObsChange={setEditObs}
              onSaveObs={handleSaveObs}
              onCancelEdit={() => setEditingId(null)}
              reasignId={reasignId}
              reasignProvId={reasignProvId}
              onReasignProvChange={setReasignProvId}
              onConfirmReasign={handleReasign}
              onCancelReasign={() => setReasignId(null)}
              proveedoresList={proveedoresList ?? []}
            />
          ))}

          {/* Sin proveedor */}
          {sinProveedor.length > 0 && (
            <ProveedorGroup
              proveedorId="sin_proveedor"
              proveedorNombre="Sin proveedor asignado"
              faltantes={sinProveedor}
              expanded={expandedProveedores.has('sin_proveedor')}
              onToggle={() => toggleProveedor('sin_proveedor')}
              onResolve={handleResolve}
              onEditObs={(id, obs) => { setEditingId(id); setEditObs(obs ?? '') }}
              onReasign={(id) => { setReasignId(id); setReasignProvId('') }}
              editingId={editingId}
              editObs={editObs}
              onEditObsChange={setEditObs}
              onSaveObs={handleSaveObs}
              onCancelEdit={() => setEditingId(null)}
              reasignId={reasignId}
              reasignProvId={reasignProvId}
              onReasignProvChange={setReasignProvId}
              onConfirmReasign={handleReasign}
              onCancelReasign={() => setReasignId(null)}
              proveedoresList={proveedoresList ?? []}
            />
          )}

          {Object.keys(groups).length === 0 && sinProveedor.length === 0 && (
            <EmptyState message="No hay faltantes pendientes" />
          )}
        </div>
      )}

      {/* Tab: Resueltos */}
      {activeTab === 'resueltos' && (
        <div className="space-y-3">
          {resueltosQuery.isLoading ? (
            <SkeletonList />
          ) : (resueltosQuery.data ?? []).length === 0 ? (
            <EmptyState message="No hay items resueltos" />
          ) : (
            resueltosQuery.data!.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-200 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="font-medium text-gray-700 line-through truncate">
                        {item.producto_nombre || 'Sin nombre'}
                      </span>
                    </div>
                    {item.proveedor_nombre && (
                      <p className="text-xs text-gray-400 mt-1 ml-6">{item.proveedor_nombre}</p>
                    )}
                    {item.fecha_resolucion && (
                      <p className="text-xs text-gray-400 mt-0.5 ml-6">
                        Resuelto: {new Date(item.fecha_resolucion).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleReopen(item.id)}
                    className="px-2 py-1 min-h-[36px] text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reabrir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-gray-500 font-medium">{message}</p>
      <p className="text-sm text-gray-400 mt-1">
        Usa el boton naranja (+) para anotar faltantes
      </p>
    </div>
  )
}

interface FaltanteCardProps {
  item: FaltanteRow
  onResolve: (id: string) => void
  onEditObs: (id: string, obs: string | null) => void
  onReasign: (id: string) => void
  isEditing: boolean
  editObs: string
  onEditObsChange: (v: string) => void
  onSaveObs: () => void
  onCancelEdit: () => void
  isReasigning: boolean
  reasignProvId: string
  onReasignProvChange: (v: string) => void
  onConfirmReasign: () => void
  onCancelReasign: () => void
  proveedoresList: Array<{ id: string; nombre: string }>
}

function FaltanteCard({
  item, onResolve, onEditObs, onReasign,
  isEditing, editObs, onEditObsChange, onSaveObs, onCancelEdit,
  isReasigning, reasignProvId, onReasignProvChange, onConfirmReasign, onCancelReasign,
  proveedoresList,
}: FaltanteCardProps) {
  const prioColor = PRIORIDAD_COLORS[item.prioridad ?? 'normal'] ?? 'bg-gray-100 text-gray-600'
  const prioLabel = PRIORIDAD_LABELS[item.prioridad ?? 'normal'] ?? 'Normal'
  const fecha = item.created_at ? new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">
              {item.producto_nombre || 'Sin nombre'}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${prioColor}`}>
              {prioLabel}
            </span>
            {item.cantidad_faltante && (
              <span className="text-xs text-gray-500">x{item.cantidad_faltante}</span>
            )}
          </div>

          {item.proveedor_nombre && (
            <div className="flex items-center gap-1 mt-1">
              <Users className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">{item.proveedor_nombre}</span>
            </div>
          )}
          {!item.proveedor_asignado_id && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-amber-600">Sin proveedor</span>
            </div>
          )}

          {item.observaciones && !isEditing && (
            <p className="text-sm text-gray-500 mt-1 italic">&#34;{item.observaciones}&#34;</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            {fecha && <span>{fecha}</span>}
            {item.reportado_por_nombre && <span>por {item.reportado_por_nombre}</span>}
          </div>
        </div>

        <button
          onClick={() => onResolve(item.id)}
          className="px-3 py-2 min-h-[44px] bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-1.5 shrink-0"
        >
          <Check className="w-4 h-4" />
          Listo
        </button>
      </div>

      {/* Editing observation */}
      {isEditing && (
        <div className="mt-3 space-y-2">
          <textarea
            value={editObs}
            onChange={(e) => onEditObsChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={2}
            placeholder="Observación..."
          />
          <div className="flex gap-2">
            <button onClick={onSaveObs} className="px-3 py-1.5 min-h-[36px] bg-blue-600 text-white rounded-lg text-xs font-medium">Guardar</button>
            <button onClick={onCancelEdit} className="px-3 py-1.5 min-h-[36px] bg-gray-100 text-gray-700 rounded-lg text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {/* Reassigning supplier */}
      {isReasigning && (
        <div className="mt-3 space-y-2">
          <select
            value={reasignProvId}
            onChange={(e) => onReasignProvChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="">Sin proveedor</option>
            {proveedoresList.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={onConfirmReasign} className="px-3 py-1.5 min-h-[36px] bg-blue-600 text-white rounded-lg text-xs font-medium">Asignar</button>
            <button onClick={onCancelReasign} className="px-3 py-1.5 min-h-[36px] bg-gray-100 text-gray-700 rounded-lg text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      {!isEditing && !isReasigning && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onEditObs(item.id, item.observaciones)}
            className="text-xs px-2 py-1 min-h-[32px] bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg"
          >
            Editar nota
          </button>
          <button
            onClick={() => onReasign(item.id)}
            className="text-xs px-2 py-1 min-h-[32px] bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg"
          >
            {item.proveedor_asignado_id ? 'Cambiar proveedor' : 'Asignar proveedor'}
          </button>
        </div>
      )}
    </div>
  )
}

interface ProveedorGroupProps {
  proveedorId: string
  proveedorNombre: string
  faltantes: FaltanteRow[]
  expanded: boolean
  onToggle: () => void
  onResolve: (id: string) => void
  onCopySummary?: () => void
  onEditObs: (id: string, obs: string | null) => void
  onReasign: (id: string) => void
  editingId: string | null
  editObs: string
  onEditObsChange: (v: string) => void
  onSaveObs: (id: string) => void
  onCancelEdit: () => void
  reasignId: string | null
  reasignProvId: string
  onReasignProvChange: (v: string) => void
  onConfirmReasign: (id: string) => void
  onCancelReasign: () => void
  proveedoresList: Array<{ id: string; nombre: string }>
}

function ProveedorGroup({
  proveedorId, proveedorNombre, faltantes, expanded, onToggle,
  onResolve, onCopySummary, onEditObs, onReasign,
  editingId, editObs, onEditObsChange, onSaveObs, onCancelEdit,
  reasignId, reasignProvId, onReasignProvChange, onConfirmReasign, onCancelReasign,
  proveedoresList,
}: ProveedorGroupProps) {
  const urgentes = faltantes.filter(f => f.prioridad === 'alta').length
  const isSinProveedor = proveedorId === 'sin_proveedor'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Group header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 min-h-[56px] hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          <div className="text-left">
            <span className={`font-semibold ${isSinProveedor ? 'text-amber-700' : 'text-gray-900'}`}>
              {proveedorNombre}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {urgentes > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
              {urgentes} urgente{urgentes !== 1 ? 's' : ''}
            </span>
          )}
          <span className="px-2.5 py-1 text-sm font-bold bg-orange-100 text-orange-700 rounded-full">
            {faltantes.length}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t">
          {/* Copy summary button */}
          {onCopySummary && !isSinProveedor && (
            <div className="px-4 py-2 bg-gray-50 border-b">
              <button
                onClick={onCopySummary}
                className="flex items-center gap-2 px-3 py-2 min-h-[40px] bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar resumen para compra
              </button>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {faltantes.map(item => (
              <div key={item.id} className="p-4">
                <FaltanteCard
                  item={item}
                  onResolve={onResolve}
                  onEditObs={onEditObs}
                  onReasign={onReasign}
                  isEditing={editingId === item.id}
                  editObs={editObs}
                  onEditObsChange={onEditObsChange}
                  onSaveObs={() => onSaveObs(item.id)}
                  onCancelEdit={onCancelEdit}
                  isReasigning={reasignId === item.id}
                  reasignProvId={reasignProvId}
                  onReasignProvChange={onReasignProvChange}
                  onConfirmReasign={() => onConfirmReasign(item.id)}
                  onCancelReasign={onCancelReasign}
                  proveedoresList={proveedoresList}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
