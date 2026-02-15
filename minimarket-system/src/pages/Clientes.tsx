import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast, Toaster } from 'sonner'
import { AlertTriangle, DollarSign, Edit3, Loader2, MessageCircle, Plus, Search } from 'lucide-react'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import {
  clientesApi,
  cuentasCorrientesApi,
  type ClienteCreateParams,
  type ClienteSaldoItem,
} from '../lib/apiClient'
import { useUserRole } from '../hooks/useUserRole'
import { money } from '../utils/currency'

function whatsappUrl(e164: string): string {
  const digits = e164.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}`
}

type ModalMode = 'create' | 'edit' | 'pago' | null

const EMPTY_CLIENTES: ClienteSaldoItem[] = []

export default function Clientes() {
  const qc = useQueryClient()
  const { isAdmin } = useUserRole()

  const [q, setQ] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<ClienteSaldoItem | null>(null)

  const resumenQuery = useQuery({
    queryKey: ['cc-resumen'],
    queryFn: () => cuentasCorrientesApi.resumen(),
  })

  const clientesQuery = useQuery({
    queryKey: ['clientes', q],
    queryFn: () => clientesApi.list({ q, limit: 200 }),
  })

  const createOrUpdateMutation = useMutation({
    mutationFn: async (payload: ClienteCreateParams & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload
        return clientesApi.update(id, rest)
      }
      return clientesApi.create(payload)
    },
    onSuccess: () => {
      toast.success('Cliente guardado')
      setModal(null)
      setSelected(null)
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['cc-resumen'] })
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Error guardando cliente'
      toast.error(msg)
    },
  })

  const pagoMutation = useMutation({
    mutationFn: (payload: { cliente_id: string; monto: number; descripcion?: string }) =>
      cuentasCorrientesApi.registrarPago(payload),
    onSuccess: () => {
      toast.success('Pago registrado')
      setModal(null)
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['cc-resumen'] })
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Error registrando pago'
      toast.error(msg)
    },
  })

  const clientes = clientesQuery.data ?? EMPTY_CLIENTES
  const resumen = resumenQuery.data

  const clientesConDeuda = useMemo(() => clientes.filter((c) => (c.saldo ?? 0) > 0), [clientes])

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">
            {clientes.length} clientes, {clientesConDeuda.length} con deuda
          </p>
        </div>
        <button
          onClick={() => { setModal('create'); setSelected(null) }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Resumen CC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Dinero en la calle</div>
          {resumenQuery.isLoading ? (
            <div className="mt-2 text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          ) : (
            <div className="mt-1 text-3xl font-black text-gray-900">
              ${money(resumen?.dinero_en_la_calle ?? 0)}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Clientes con deuda</div>
          <div className="mt-1 text-3xl font-black text-gray-900">
            {resumen?.clientes_con_deuda ?? clientesConDeuda.length}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Última actualización</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {resumen?.as_of ? new Date(resumen.as_of).toLocaleString('es-AR') : '—'}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre / teléfono / email"
          className="flex-1 outline-none text-gray-900"
        />
      </div>

      {/* List */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold text-gray-900">Listado</div>
          {clientesQuery.isLoading && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Actualizando…
            </div>
          )}
        </div>
        <div className="divide-y">
          {clientesQuery.isError && (
            <div className="p-4">
              <ErrorMessage
                message={parseErrorMessage(clientesQuery.error, import.meta.env.PROD)}
                type={detectErrorType(clientesQuery.error)}
                onRetry={() => clientesQuery.refetch()}
                isRetrying={clientesQuery.isFetching}
                size="sm"
              />
            </div>
          )}
          {!clientesQuery.isLoading && clientes.length === 0 && (
            <div className="p-10 text-center text-gray-500">Sin resultados</div>
          )}
          {clientes.map((c) => {
            const saldo = c.saldo ?? 0
            const limite = c.limite_credito
            const ratio = limite && limite > 0 ? saldo / limite : null
            const semColor =
              saldo <= 0 ? 'bg-green-500' :
                limite == null ? 'bg-orange-500' :
                  ratio != null && ratio >= 1 ? 'bg-red-500' :
                    ratio != null && ratio >= 0.8 ? 'bg-yellow-500' : 'bg-green-500'

            return (
              <div key={c.cliente_id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${semColor} mt-2`} title="Semáforo deuda" />
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{c.nombre}</div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                      {c.telefono && <span>{c.telefono}</span>}
                      {c.email && <span>{c.email}</span>}
                      <span className={saldo > 0 ? 'text-red-700 font-semibold' : 'text-gray-700'}>
                        Saldo: ${money(saldo)}
                      </span>
                      {limite != null ? (
                        <span className="text-gray-700">Límite: ${money(limite)}</span>
                      ) : (
                        <span className="text-orange-700 inline-flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Sin límite
                        </span>
                      )}
                    </div>
                    {c.link_pago && (
                      <div className="text-xs text-gray-500 truncate">
                        Pago: <a className="underline" href={c.link_pago} target="_blank" rel="noreferrer">{c.link_pago}</a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  {c.whatsapp_e164 && (
                    <a
                      href={whatsappUrl(c.whatsapp_e164)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => { setSelected(c); setModal('pago') }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900"
                    title="Registrar pago"
                  >
                    <DollarSign className="w-4 h-4" />
                    Pago
                  </button>
                  <button
                    onClick={() => { setSelected(c); setModal('edit') }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-gray-700 font-semibold hover:bg-gray-50"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal: Create/Edit */}
      {(modal === 'create' || modal === 'edit') && (
        <ClienteModal
          mode={modal}
          isAdmin={isAdmin}
          cliente={selected}
          isSaving={createOrUpdateMutation.isPending}
          onClose={() => { setModal(null); setSelected(null) }}
          onSave={(payload) => createOrUpdateMutation.mutate(payload)}
        />
      )}

      {/* Modal: Pago */}
      {modal === 'pago' && selected && (
        <PagoModal
          cliente={selected}
          isSaving={pagoMutation.isPending}
          onClose={() => { setModal(null); setSelected(null) }}
          onSave={(payload) => pagoMutation.mutate(payload)}
        />
      )}
    </div>
  )
}

function ClienteModal({
  mode,
  isAdmin,
  cliente,
  isSaving,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit'
  isAdmin: boolean
  cliente: ClienteSaldoItem | null
  isSaving: boolean
  onClose: () => void
  onSave: (payload: ClienteCreateParams & { id?: string }) => void
}) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? '')
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp_e164 ?? '')
  const [linkPago, setLinkPago] = useState(cliente?.link_pago ?? '')
  const [limiteCredito, setLimiteCredito] = useState(cliente?.limite_credito?.toString() ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: ClienteCreateParams & { id?: string } = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      whatsapp_e164: whatsapp.trim() || null,
      link_pago: linkPago.trim() || null,
    }

    if (isAdmin) {
      payload.limite_credito = limiteCredito.trim() === '' ? null : Number(limiteCredito)
    }

    if (mode === 'edit' && cliente) payload.id = cliente.cliente_id
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title-client">
        <div className="p-4 border-b flex items-center justify-between">
          <div id="modal-title-client" className="font-bold text-gray-900">{mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Teléfono</label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">WhatsApp (E.164)</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+54911..."
                className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Link de pago</label>
              <input
                value={linkPago}
                onChange={(e) => setLinkPago(e.target.value)}
                className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isAdmin ? (
            <div>
              <label className="text-sm text-gray-600">Límite crédito</label>
              <input
                value={limiteCredito}
                onChange={(e) => setLimiteCredito(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">NULL = sin límite</div>
            </div>
          ) : (
            <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3 inline-flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold">Límite de crédito</div>
                <div className="text-xs text-orange-700">Solo admin puede configurarlo.</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PagoModal({
  cliente,
  isSaving,
  onClose,
  onSave,
}: {
  cliente: ClienteSaldoItem
  isSaving: boolean
  onClose: () => void
  onSave: (payload: { cliente_id: string; monto: number; descripcion?: string }) => void
}) {
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Number(monto)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Monto inválido')
      return
    }
    onSave({
      cliente_id: cliente.cliente_id,
      monto: parsed,
      descripcion: descripcion.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title-payment">
        <div className="p-4 border-b flex items-center justify-between">
          <div id="modal-title-payment" className="font-bold text-gray-900">Registrar Pago</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="rounded-xl border p-3 bg-gray-50">
            <div className="font-bold text-gray-900">{cliente.nombre}</div>
            <div className="text-sm text-gray-700">Saldo actual: <span className="font-semibold">${money(cliente.saldo ?? 0)}</span></div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Monto</label>
            <input
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Descripción (opcional)</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Pago efectivo"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-black text-white font-black hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
