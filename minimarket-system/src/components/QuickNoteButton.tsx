import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Plus, X, Send, AlertCircle, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCreateFaltante, useRecentFaltantes } from '../hooks/queries'
import {
  parseNote, resolveProveedor, isDuplicate,
  type ProveedorMatch, type ProductoMatch, type ParsedNote,
} from '../utils/cuadernoParser'

interface QuickNoteButtonProps {
  prefillText?: string
  onClose?: () => void
  autoOpen?: boolean
}

export default function QuickNoteButton({ prefillText, onClose, autoOpen }: QuickNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(autoOpen ?? false)
  const [text, setText] = useState(prefillText ?? '')
  const [parsed, setParsed] = useState<ParsedNote | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()

  const createFaltante = useCreateFaltante()
  const { data: recentFaltantes } = useRecentFaltantes()

  // Fetch proveedores list for matching
  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores', 'all-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id,nombre')
        .eq('activo', true)
        .order('nombre')
      if (error) throw error
      return (data || []) as ProveedorMatch[]
    },
    staleTime: 1000 * 60 * 10,
  })

  // Fetch productos list for matching
  const { data: productosData } = useQuery({
    queryKey: ['productos', 'all-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('id,nombre,proveedor_principal_id')
        .eq('activo', true)
        .limit(500)
      if (error) throw error
      return (data || []) as ProductoMatch[]
    },
    staleTime: 1000 * 60 * 10,
  })

  const proveedores = useMemo(() => proveedoresData ?? [], [proveedoresData])
  const productos = useMemo(() => productosData ?? [], [productosData])

  // Auto-parse as user types (debounced)
  useEffect(() => {
    if (text.trim().length < 2) {
      setParsed(null)
      setShowPreview(false)
      setDuplicateWarning(false)
      return
    }

    const timer = setTimeout(() => {
      const result = parseNote(text, proveedores, productos)
      setParsed(result)
      setShowPreview(true)

      // Check dedup
      const resolved = resolveProveedor(result, proveedores, productos)
      const isDup = isDuplicate(
        { productoNombre: result.productoNombre, productoId: resolved.productoId },
        recentFaltantes ?? [],
      )
      setDuplicateWarning(isDup)
    }, 300)

    return () => clearTimeout(timer)
  }, [text, proveedores, productos, recentFaltantes])

  const openModal = useCallback(() => {
    setIsOpen(true)
    setText(prefillText ?? '')
    navigator.vibrate?.(50)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [prefillText])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setText('')
    setParsed(null)
    setShowPreview(false)
    setDuplicateWarning(false)
    onClose?.()
  }, [onClose])

  // Supports route-driven quick actions (auto-open + optional prefill).
  useEffect(() => {
    if (!autoOpen) return
    setIsOpen(true)
    if (prefillText) setText(prefillText)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [autoOpen, prefillText])

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) {
      toast.error('Escribí algo para anotar')
      return
    }

    const result = parsed ?? parseNote(text, proveedores, productos)
    const resolved = resolveProveedor(result, proveedores, productos)

    // Get user display name
    const { data: personalData } = await supabase
      .from('personal')
      .select('nombre')
      .eq('user_auth_id', user?.id ?? '')
      .single()

    const reporterName = personalData?.nombre ?? user?.email ?? 'Usuario'

    createFaltante.mutate({
      producto_id: resolved.productoId,
      producto_nombre: result.productoNombre || text.trim().slice(0, 100),
      cantidad_faltante: result.cantidad,
      prioridad: result.prioridad,
      estado: 'pendiente',
      observaciones: result.textoOriginal,
      proveedor_asignado_id: resolved.proveedorId,
      reportado_por_nombre: reporterName,
    }, {
      onSuccess: () => {
        const provMsg = resolved.proveedorId
          ? ` (asignado a proveedor)`
          : ''
        toast.success(`Anotado${provMsg}`)
        navigator.vibrate?.(30)
        closeModal()
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : 'Error al guardar'
        toast.error(msg)
      },
    })
  }, [text, parsed, proveedores, productos, user, createFaltante, closeModal])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      closeModal()
    }
  }, [handleSubmit, closeModal])

  const ACCION_LABELS: Record<string, string> = {
    reponer: 'Reponer',
    comprar: 'Comprar',
    observacion: 'Observación',
    incidencia: 'Incidencia',
  }

  const PRIORIDAD_COLORS: Record<string, string> = {
    alta: 'bg-red-100 text-red-700',
    normal: 'bg-blue-100 text-blue-700',
    baja: 'bg-gray-100 text-gray-600',
  }

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={openModal}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Anotar faltante u observación"
        title="Anotar faltante"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />

          <div
            className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl mx-0 sm:mx-4 max-h-[85vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Anotar faltante u observación"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Anotar faltante</h3>
              <button
                onClick={closeModal}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Qué falta o qué pasó?
                </label>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Ej: "Falta pan lactal", "3 latas de tomate", "Se rompió la heladera"'
                  className="w-full border rounded-xl px-4 py-3 text-base resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[80px]"
                  rows={3}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ctrl+Enter para guardar
                </p>
              </div>

              {/* Duplicate warning */}
              {duplicateWarning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Posible duplicado</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Ya existe un registro similar reciente. ¿Querés anotarlo igual?
                    </p>
                  </div>
                </div>
              )}

              {/* Preview parsed result */}
              {showPreview && parsed && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vista previa</p>

                  <div className="flex flex-wrap gap-1.5">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      parsed.accion === 'incidencia' ? 'bg-red-100 text-red-700' :
                      parsed.accion === 'observacion' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {ACCION_LABELS[parsed.accion] ?? parsed.accion}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PRIORIDAD_COLORS[parsed.prioridad] ?? 'bg-gray-100'}`}>
                      {parsed.prioridad === 'alta' ? 'Urgente' : parsed.prioridad === 'baja' ? 'Baja' : 'Normal'}
                    </span>
                  </div>

                  {parsed.productoNombre && (
                    <div className="text-sm">
                      <span className="text-gray-500">Producto:</span>{' '}
                      <span className="font-medium text-gray-800">{parsed.productoNombre}</span>
                    </div>
                  )}

                  {parsed.cantidad && (
                    <div className="text-sm">
                      <span className="text-gray-500">Cantidad:</span>{' '}
                      <span className="font-medium text-gray-800">
                        {parsed.cantidad}{parsed.unidad ? ` ${parsed.unidad}` : ''}
                      </span>
                    </div>
                  )}

                  {parsed.proveedorMencionado && (
                    <div className="text-sm flex items-center gap-1">
                      <span className="text-gray-500">Proveedor:</span>{' '}
                      <span className="font-medium text-blue-700">{parsed.proveedorMencionado}</span>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </div>
                  )}

                  {!parsed.proveedorMencionado && parsed.productoNombre && (
                    (() => {
                      const resolved = resolveProveedor(parsed, proveedores, productos)
                      if (resolved.proveedorId) {
                        const prov = proveedores.find(p => p.id === resolved.proveedorId)
                        return (
                          <div className="text-sm flex items-center gap-1">
                            <span className="text-gray-500">Proveedor (auto):</span>{' '}
                            <span className="font-medium text-blue-600">{prov?.nombre ?? 'detectado'}</span>
                          </div>
                        )
                      }
                      return (
                        <div className="text-xs text-gray-400">
                          Sin proveedor detectado — se puede asignar después
                        </div>
                      )
                    })()
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="p-4 border-t shrink-0">
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || createFaltante.isPending}
                className="w-full py-3 min-h-[48px] bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {createFaltante.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
