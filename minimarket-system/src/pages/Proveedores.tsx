import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, Mail, Package, Plus, Edit3, X, Loader2 } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { useProveedores, ProveedorConProductos } from '../hooks/queries'
import { proveedoresApi, CreateProveedorParams } from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType } from '../components/errorMessageUtils'
import { money } from '../utils/currency'

type ModalMode = 'create' | 'edit' | null

const emptyForm: CreateProveedorParams = {
  nombre: '',
  contacto: '',
  email: '',
  telefono: '',
  direccion: '',
  cuit: '',
  sitio_web: '',
  productos_ofrecidos: [],
}

export default function Proveedores() {
  const [page, setPage] = useState(1)
  const [selectedProveedor, setSelectedProveedor] = useState<ProveedorConProductos | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [form, setForm] = useState<CreateProveedorParams>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const pageSize = 20
  const qc = useQueryClient()

  const { data, isLoading, isError, error, refetch, isFetching } = useProveedores({ page, pageSize })

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProveedorParams & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload as CreateProveedorParams & { id: string }
        return proveedoresApi.update(id, rest)
      }
      return proveedoresApi.create(payload)
    },
    onSuccess: () => {
      toast.success(editId ? 'Proveedor actualizado' : 'Proveedor creado')
      closeModal()
      qc.invalidateQueries({ queryKey: ['proveedores'] })
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Error guardando proveedor'
      toast.error(msg)
    },
  })

  function openCreate() {
    setForm(emptyForm)
    setEditId(null)
    setModalMode('create')
  }

  function openEdit(prov: ProveedorConProductos) {
    setForm({
      nombre: prov.nombre || '',
      contacto: prov.contacto || '',
      email: prov.email || '',
      telefono: prov.telefono || '',
      direccion: '',
      cuit: '',
      sitio_web: '',
      productos_ofrecidos: prov.productos_ofrecidos || [],
    })
    setEditId(prov.id)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setForm(emptyForm)
    setEditId(null)
    setTagInput('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    const payload: CreateProveedorParams & { id?: string } = {
      ...form,
      nombre: form.nombre.trim(),
      ...(editId ? { id: editId } : {}),
    }
    saveMutation.mutate(payload)
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !(form.productos_ofrecidos || []).includes(tag)) {
      setForm({ ...form, productos_ofrecidos: [...(form.productos_ofrecidos || []), tag] })
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm({ ...form, productos_ofrecidos: (form.productos_ofrecidos || []).filter(t => t !== tag) })
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gesti&oacute;n de Proveedores</h1>
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  const { proveedores = [], total = 0 } = data ?? {}
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gesti&oacute;n de Proveedores</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proveedor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Mostrando {proveedores.length} de {total} proveedores
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || isFetching}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            P&aacute;gina {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || isFetching}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de proveedores */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Proveedores</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {proveedores.map((proveedor) => (
                <div
                  key={proveedor.id}
                  onClick={() => setSelectedProveedor(proveedor)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedProveedor?.id === proveedor.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{proveedor.nombre}</h3>
                      {proveedor.contacto && (
                        <p className="text-sm text-gray-600">Contacto: {proveedor.contacto}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {proveedor.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {proveedor.telefono}
                          </span>
                        )}
                        {proveedor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {proveedor.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Productos</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {proveedor.productos?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalle del proveedor */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Detalle del Proveedor</h2>
            {selectedProveedor && (
              <button
                onClick={() => openEdit(selectedProveedor)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
          <div className="p-6">
            {selectedProveedor ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedProveedor.nombre}
                  </h3>
                  {selectedProveedor.contacto && (
                    <p className="text-gray-600 mt-1">Contacto: {selectedProveedor.contacto}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedProveedor.telefono && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600">Tel&eacute;fono</div>
                        <div className="font-medium">{selectedProveedor.telefono}</div>
                      </div>
                    </div>
                  )}
                  {selectedProveedor.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{selectedProveedor.email}</div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedProveedor.productos_ofrecidos && selectedProveedor.productos_ofrecidos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Categor&iacute;as que Ofrece</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProveedor.productos_ofrecidos.map((categoria, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {categoria}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProveedor.productos && selectedProveedor.productos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Productos ({selectedProveedor.productos.length})
                    </h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {selectedProveedor.productos.map((producto) => (
                        <div
                          key={producto.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{producto.nombre}</div>
                              <div className="text-sm text-gray-500">{producto.categoria}</div>
                            </div>
                            <div className="text-right">
                              {producto.precio_actual !== null && (
                                <div className="font-bold text-blue-600">
                                  ${money(producto.precio_actual)}
                                </div>
                              )}
                              {producto.margen_ganancia !== null && (
                                <div className="text-xs text-gray-500">
                                  Margen: {producto.margen_ganancia.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProveedor.productos && selectedProveedor.productos.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No hay productos asignados a este proveedor
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Seleccione un proveedor para ver sus detalles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">
                {modalMode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                  <input
                    type="text"
                    value={form.contacto || ''}
                    onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
                  <input
                    type="text"
                    value={form.cuit || ''}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tel&eacute;fono</label>
                  <input
                    type="text"
                    value={form.telefono || ''}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direcci&oacute;n</label>
                <input
                  type="text"
                  value={form.direccion || ''}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input
                  type="text"
                  value={form.sitio_web || ''}
                  onChange={(e) => setForm({ ...form, sitio_web: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categor&iacute;as / Productos Ofrecidos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Agregar categor&iacute;a..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.productos_ofrecidos || []).map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modalMode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
