import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, AlertCircle, Lightbulb, ArrowRight, CheckCircle, XCircle, ShieldAlert } from 'lucide-react'
import { assistantApi, type AssistantMessage, type AssistantResponseData } from '../lib/assistantApi'
import { useLocation, Link } from 'react-router-dom'

const QUICK_PROMPTS = [
  { label: '📋 Briefing', prompt: 'briefing' },
  { label: 'Stock bajo', prompt: 'Que productos tienen stock bajo?' },
  { label: 'Pedidos pendientes', prompt: 'Hay pedidos pendientes?' },
  { label: 'Cuentas corrientes', prompt: 'Cuanto me deben?' },
  { label: 'Ventas del dia', prompt: 'Como fueron las ventas hoy?' },
  { label: 'Facturas OCR', prompt: 'Estado de las facturas?' },
  { label: 'Crear tarea', prompt: 'Crear tarea ' },
  { label: 'Registrar pago', prompt: 'Registrar pago de ' },
  { label: 'Ayuda', prompt: 'ayuda' },
]

const ROUTE_PROMPTS: Record<string, typeof QUICK_PROMPTS> = {
  '/stock': [
    { label: '📋 Briefing', prompt: 'briefing' },
    { label: 'Stock bajo', prompt: 'Que productos tienen stock bajo?' },
    { label: 'Crear reposición', prompt: 'Crear tarea reponer productos con stock bajo' },
  ],
  '/pedidos': [
    { label: '📋 Briefing', prompt: 'briefing' },
    { label: 'Pedidos pendientes', prompt: 'Hay pedidos pendientes?' },
    { label: 'Marcar como listo', prompt: 'Cambiar pedido # a listo' },
  ],
  '/clientes': [
    { label: '📋 Briefing', prompt: 'briefing' },
    { label: 'Deudas', prompt: 'Cuanto me deben?' },
    { label: 'Registrar pago', prompt: 'Registrar pago de ' },
  ],
  '/facturas': [
    { label: '📋 Briefing', prompt: 'briefing' },
    { label: 'Estado facturas', prompt: 'Estado de las facturas?' },
    { label: 'Aplicar factura', prompt: 'Aplicar factura ' },
  ],
}

const INTENT_LABELS: Record<string, string> = {
  consultar_stock_bajo: 'Stock bajo',
  consultar_pedidos_pendientes: 'Pedidos',
  consultar_resumen_cc: 'Cuentas corrientes',
  consultar_ventas_dia: 'Ventas del dia',
  consultar_estado_ocr_facturas: 'Facturas',
  briefing: 'Briefing',
  crear_tarea: 'Crear tarea',
  registrar_pago_cc: 'Registrar pago',
  saludo: 'Saludo',
  ayuda: 'Ayuda',
}

const RISK_COLORS: Record<string, string> = {
  bajo: 'text-green-600 dark:text-green-400',
  medio: 'text-yellow-600 dark:text-yellow-400',
  alto: 'text-red-600 dark:text-red-400',
}

const CHAT_STORAGE_KEY = 'assistant_chat_history_v1'
const MAX_STORED_MESSAGES = 80
const WELCOME_MESSAGE_CONTENT = 'Hola! Soy el asistente operativo. Puedo consultar informacion del negocio: stock, pedidos, cuentas corrientes, ventas y facturas.\n\nEscribi tu consulta o usa los accesos rapidos de abajo.'

function createWelcomeMessage(): AssistantMessage {
  return {
    role: 'assistant',
    content: WELCOME_MESSAGE_CONTENT,
    timestamp: new Date().toISOString(),
  }
}

function loadStoredMessages(): AssistantMessage[] | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const sanitized = parsed
      .filter((msg) =>
        msg &&
        (msg.role === 'assistant' || msg.role === 'user') &&
        typeof msg.content === 'string' &&
        typeof msg.timestamp === 'string',
      )
      .slice(-MAX_STORED_MESSAGES)

    return sanitized.length > 0 ? sanitized : null
  } catch {
    return null
  }
}

function loadInitialChatState(): { messages: AssistantMessage[]; fromStorage: boolean } {
  const stored = loadStoredMessages()

  if (stored) {
    return { messages: stored, fromStorage: true }
  }

  return { messages: [createWelcomeMessage()], fromStorage: false }
}

type StockBajoItem = {
  nombre?: string
  producto_nombre?: string
  cantidad_actual?: number | string | null
  stock_minimo?: number | string | null
}

type PedidoPendienteItem = {
  numero_pedido?: number | string
  cliente_nombre?: string
  monto_total?: number | string | null
  estado?: string
}

type VentasDiaData = {
  ventas?: unknown
  total?: number | string | null
  count?: number | string | null
}

type ResumenCuentaCorrienteData = {
  dinero_en_la_calle?: number | string | null
  clientes_con_deuda?: number | string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// M4: Data Renderer Component
function DataRenderer({ intent, data }: { intent: string; data: unknown }) {
  if (data == null) return null

  if (intent === 'consultar_stock_bajo' && Array.isArray(data)) {
    const items = data as StockBajoItem[]

    return (
      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.slice(0, 5).map((p, i) => (
            <li key={i} className="flex justify-between items-center p-3 text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">{p.nombre || p.producto_nombre}</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                  Stock: {p.cantidad_actual ?? '?'}
                </span>
                <span className="text-xs text-gray-500">Min: {p.stock_minimo ?? '?'}</span>
              </div>
            </li>
          ))}
        </ul>
        {items.length > 5 && <div className="p-2 text-center text-xs text-gray-500">...y {items.length - 5} más</div>}
      </div>
    )
  }

  if (intent === 'consultar_pedidos_pendientes' && Array.isArray(data)) {
    const items = data as PedidoPendienteItem[]

    return (
      <div className="mt-3 space-y-2">
        {items.slice(0, 5).map((p, i) => (
          <div key={i} className="flex flex-col p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-gray-900 dark:text-gray-100">#{p.numero_pedido} — {p.cliente_nombre}</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">${Number(p.monto_total || 0).toLocaleString('es-AR')}</span>
            </div>
            <span className="mt-1 self-start px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {p.estado}
            </span>
          </div>
        ))}
        {items.length > 5 && <div className="text-center text-xs text-gray-500">...y {items.length - 5} más</div>}
      </div>
    )
  }

  if (intent === 'consultar_ventas_dia' && isRecord(data) && 'ventas' in data) {
    const ventasData = data as VentasDiaData

    return (
      <div className="mt-3 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30">
        <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Total Facturado</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${Number(ventasData.total || 0).toLocaleString('es-AR')}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ventasData.count} ventas registradas hoy</p>
      </div>
    )
  }

  if (intent === 'consultar_resumen_cc' && isRecord(data)) {
    const resumen = data as ResumenCuentaCorrienteData

    return (
      <div className="mt-3 p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30">
        <p className="text-xs font-medium text-rose-800 dark:text-rose-300 uppercase tracking-wider">Dinero en la calle (Deuda Total)</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${Number(resumen.dinero_en_la_calle || 0).toLocaleString('es-AR')}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{resumen.clientes_con_deuda} clientes con saldo pendiente</p>
      </div>
    )
  }

  return null
}

export default function Asistente() {
  const initialChatStateRef = useRef(loadInitialChatState())
  const [messages, setMessages] = useState<AssistantMessage[]>(() => initialChatStateRef.current.messages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const currentPrompts = ROUTE_PROMPTS[location.pathname] || QUICK_PROMPTS

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-briefing on first mount — proactive instead of passive
  const autoBriefingDone = useRef(false)
  const shouldAutoBriefOnMount = useRef(!initialChatStateRef.current.fromStorage)
  useEffect(() => {
    if (
      !autoBriefingDone.current &&
      shouldAutoBriefOnMount.current &&
      messages.length === 1 &&
      messages[0]?.role === 'assistant' &&
      messages[0]?.content === WELCOME_MESSAGE_CONTENT
    ) {
      autoBriefingDone.current = true
      handleSend('briefing')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
    } catch {
      // Best effort only, never block chat flow.
    }
  }, [messages])

  const handleSend = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim()
    if (!text || loading) return

    setInput('')
    setError(null)
    setLastFailedMessage(null)

    const userMsg: AssistantMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const response: AssistantResponseData = await assistantApi.sendMessage(text, {
        ui_route: location.pathname,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      const assistantMsg: AssistantMessage = {
        role: 'assistant',
        content: response.answer,
        intent: response.intent,
        confidence: response.confidence,
        mode: response.mode,
        data: response.data,
        suggestions: response.suggestions,
        navigation: response.navigation,
        confirm_token: response.confirm_token,
        action_plan: response.action_plan,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el asistente'
      setError(msg)
      setLastFailedMessage(text)
      const errorMsg: AssistantMessage = {
        role: 'assistant',
        content: `Error: ${msg}`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, location.pathname])

  const handleResetChat = useCallback(() => {
    setMessages([createWelcomeMessage()])
    setInput('')
    setError(null)
    setLastFailedMessage(null)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(CHAT_STORAGE_KEY)
      } catch {
        // Ignore persistence cleanup errors.
      }
    }
    inputRef.current?.focus()
  }, [])

  const handleConfirm = useCallback(async (confirmToken: string) => {
    if (confirming) return
    setConfirming(true)
    setError(null)

    try {
      const result = await assistantApi.confirmAction(confirmToken)
      const successMsg: AssistantMessage = {
        role: 'assistant',
        content: result.answer,
        intent: result.operation,
        mode: 'answer',
        data: result.result,
        timestamp: new Date().toISOString(),
      }
      // Remove confirm_token from the plan message to prevent double-confirm
      setMessages(prev => [
        ...prev.map(m => m.confirm_token === confirmToken ? { ...m, confirm_token: undefined } : m),
        successMsg,
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al confirmar accion'
      setError(msg)
      const errorMsg: AssistantMessage = {
        role: 'assistant',
        content: `Error al confirmar: ${msg}`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [
        ...prev.map(m => m.confirm_token === confirmToken ? { ...m, confirm_token: undefined } : m),
        errorMsg,
      ])
    } finally {
      setConfirming(false)
      inputRef.current?.focus()
    }
  }, [confirming])

  const handleCancelPlan = useCallback((confirmToken: string) => {
    // Remove confirm_token to disable the confirm button and add cancelled message
    const cancelMsg: AssistantMessage = {
      role: 'assistant',
      content: 'Accion cancelada. Podes hacerla de vuelta cuando quieras.',
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [
      ...prev.map(m => m.confirm_token === confirmToken ? { ...m, confirm_token: undefined } : m),
      cancelMsg,
    ])
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Asistente Operativo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Consultas rapidas sobre el negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetChat}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            Nuevo chat
          </button>
          <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {currentPrompts.map((qp) => (
          <button
            key={qp.label}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-3 h-3" />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : msg.content.startsWith('Error')
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : msg.mode === 'plan'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-gray-800 dark:text-gray-200 border-2 border-amber-300 dark:border-amber-700'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* M4: Rich Data Renderer */}
              {msg.role === 'assistant' && msg.intent && msg.data != null && (
                <DataRenderer intent={msg.intent} data={msg.data} />
              )}

              {msg.intent && (
                <div className="mt-2 text-xs opacity-60">
                  <span>{INTENT_LABELS[msg.intent] || msg.intent}</span>
                </div>
              )}
              {/* Plan confirmation card */}
              {msg.mode === 'plan' && msg.action_plan && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Accion a confirmar</span>
                    <span className={`text-xs font-medium ${RISK_COLORS[msg.action_plan.risk] || 'text-gray-500'}`}>
                      Riesgo: {msg.action_plan.risk}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-3">{msg.action_plan.summary}</p>
                  {msg.confirm_token ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(msg.confirm_token!)}
                        disabled={confirming || loading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {confirming ? 'Confirmando...' : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => handleCancelPlan(msg.confirm_token!)}
                        disabled={confirming || loading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">Accion ya procesada</p>
                  )}
                </div>
              )}
              {msg.navigation && msg.navigation.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.navigation.map((nav) => (
                    <Link
                      key={nav.path}
                      to={nav.path}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {nav.label}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              )}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      disabled={loading}
                      className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {(loading || confirming) && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{confirming ? 'Ejecutando accion...' : 'Consultando...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          {lastFailedMessage && (
            <button
              onClick={() => { setError(null); handleSend(lastFailedMessage); }}
              disabled={loading}
              className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors disabled:opacity-50"
            >
              Reintentar
            </button>
          )}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            &times;
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: cuantos productos tienen stock bajo?"
          disabled={loading}
          className="flex-1 px-4 py-3 min-h-[48px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          maxLength={500}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-4 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Enviar"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
