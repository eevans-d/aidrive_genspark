/**
 * Parser determinístico para el Cuaderno Inteligente.
 * Extrae acción, producto, cantidad, prioridad y proveedor de texto libre.
 */

export type AccionCuaderno = 'reponer' | 'comprar' | 'observacion' | 'incidencia'
export type PrioridadCuaderno = 'alta' | 'normal' | 'baja'

export interface ParsedNote {
  accion: AccionCuaderno
  productoNombre: string | null
  cantidad: number | null
  unidad: string | null
  prioridad: PrioridadCuaderno
  proveedorMencionado: string | null
  textoOriginal: string
}

export interface ProveedorMatch {
  id: string
  nombre: string
}

export interface ProductoMatch {
  id: string
  nombre: string
  proveedor_principal_id: string | null
}

const ACTION_KEYWORDS: Record<string, AccionCuaderno> = {
  reponer: 'reponer',
  repone: 'reponer',
  repon: 'reponer',
  comprar: 'comprar',
  compra: 'comprar',
  pedir: 'comprar',
  pedido: 'comprar',
  traer: 'comprar',
  conseguir: 'comprar',
  falta: 'reponer',
  faltan: 'reponer',
  faltante: 'reponer',
  necesito: 'reponer',
  necesitamos: 'reponer',
  'se acabó': 'reponer',
  'se acabo': 'reponer',
  'no hay': 'reponer',
  'no queda': 'reponer',
  revisar: 'observacion',
  verificar: 'observacion',
  observar: 'observacion',
  observación: 'observacion',
  observacion: 'observacion',
  anotar: 'observacion',
  nota: 'observacion',
  rompió: 'incidencia',
  rompio: 'incidencia',
  roto: 'incidencia',
  averiado: 'incidencia',
  avería: 'incidencia',
  averia: 'incidencia',
  problema: 'incidencia',
  daño: 'incidencia',
  dano: 'incidencia',
  dañado: 'incidencia',
  danado: 'incidencia',
  vencido: 'incidencia',
  vencidos: 'incidencia',
}

const PRIORITY_HIGH_KEYWORDS = [
  'urgente', 'urgentes', 'importante', 'importantes', 'ya',
  'ahora', 'hoy', 'critico', 'crítico', 'prioridad alta',
  'inmediato', 'rápido', 'rapido'
]

const PRIORITY_LOW_KEYWORDS = [
  'cuando puedas', 'no urgente', 'baja prioridad',
  'sin apuro', 'tranqui', 'después', 'despues',
  'mañana', 'manana', 'la semana que viene'
]

const QUANTITY_PATTERN = /\b(\d+(?:[.,]\d+)?)\s*(unidad(?:es)?|un\.|paquete[s]?|pack[s]?|caja[s]?|bolsa[s]?|lata[s]?|botella[s]?|kg|kilo[s]?|litro[s]?|lt?|docena[s]?|atado[s]?|bandeja[s]?|sobre[s]?)?\b/i

const LEADING_QUANTITY_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(unidad(?:es)?|un\.|paquete[s]?|pack[s]?|caja[s]?|bolsa[s]?|lata[s]?|botella[s]?|kg|kilo[s]?|litro[s]?|lt?|docena[s]?|atado[s]?|bandeja[s]?|sobre[s]?)?\s+/i

const NOISE_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'para', 'por', 'con', 'que', 'y', 'o', 'a', 'al', 'en',
  'se', 'me', 'le', 'nos', 'les', 'hay', 'más', 'mas',
])

export function parseNote(
  text: string,
  proveedores: ProveedorMatch[] = [],
  productos: ProductoMatch[] = [],
): ParsedNote {
  const textoOriginal = text.trim()
  const lower = textoOriginal.toLowerCase()

  // 1. Extract action
  let accion: AccionCuaderno = 'reponer' // default
  for (const [keyword, action] of Object.entries(ACTION_KEYWORDS)) {
    if (lower.includes(keyword)) {
      accion = action
      break
    }
  }

  // 2. Extract priority
  let prioridad: PrioridadCuaderno = 'normal'
  if (PRIORITY_HIGH_KEYWORDS.some(kw => lower.includes(kw))) {
    prioridad = 'alta'
  } else if (PRIORITY_LOW_KEYWORDS.some(kw => lower.includes(kw))) {
    prioridad = 'baja'
  }
  // Incidencias are high priority by default
  if (accion === 'incidencia' && prioridad === 'normal') {
    prioridad = 'alta'
  }

  // 3. Extract quantity
  let cantidad: number | null = null
  let unidad: string | null = null
  const qtyMatch = lower.match(QUANTITY_PATTERN)
  if (qtyMatch && qtyMatch[1]) {
    cantidad = parseFloat(qtyMatch[1].replace(',', '.'))
    unidad = qtyMatch[2] || null
  }

  // 4. Match proveedor
  let proveedorMencionado: string | null = null
  if (proveedores.length > 0) {
    const sorted = [...proveedores].sort((a, b) => b.nombre.length - a.nombre.length)
    for (const prov of sorted) {
      if (lower.includes(prov.nombre.toLowerCase())) {
        proveedorMencionado = prov.nombre
        break
      }
    }
  }

  // 5. Extract product name (clean text)
  let productoNombre = extractProductName(textoOriginal, lower, accion, proveedorMencionado)

  // 6. Try to match with known products
  if (productoNombre && productos.length > 0) {
    const prodLower = productoNombre.toLowerCase()
    const matched = productos.find(p => prodLower.includes(p.nombre.toLowerCase()) || p.nombre.toLowerCase().includes(prodLower))
    if (matched) {
      productoNombre = matched.nombre
    }
  }

  return {
    accion,
    productoNombre,
    cantidad,
    unidad,
    prioridad,
    proveedorMencionado,
    textoOriginal,
  }
}

function extractProductName(
  original: string,
  lower: string,
  accion: AccionCuaderno,
  proveedorMencionado: string | null,
): string | null {
  let cleaned = original

  // Remove action keywords at the start
  for (const keyword of Object.keys(ACTION_KEYWORDS)) {
    const re = new RegExp(`^${escapeRegex(keyword)}\\b[:\\s,.-]*`, 'i')
    cleaned = cleaned.replace(re, '')
  }

  // Remove priority keywords
  for (const kw of [...PRIORITY_HIGH_KEYWORDS, ...PRIORITY_LOW_KEYWORDS]) {
    const re = new RegExp(`\\b${escapeRegex(kw)}\\b[,.]?`, 'gi')
    cleaned = cleaned.replace(re, '')
  }

  // Remove supplier mention
  if (proveedorMencionado) {
    const re = new RegExp(`\\b(?:para|de|a)\\s+${escapeRegex(proveedorMencionado)}\\b`, 'gi')
    cleaned = cleaned.replace(re, '')
    const re2 = new RegExp(`\\b${escapeRegex(proveedorMencionado)}\\b`, 'gi')
    cleaned = cleaned.replace(re2, '')
  }

  // Remove leading quantity
  cleaned = cleaned.replace(LEADING_QUANTITY_PATTERN, '')

  // Remove common trailing connectors
  cleaned = cleaned.replace(/[,.\s]+$/, '').replace(/^[,.\s]+/, '')

  // Clean remaining noise
  const words = cleaned.split(/\s+/).filter(w => w.length > 0)
  const meaningful = words.filter(w => !NOISE_WORDS.has(w.toLowerCase()))

  const result = meaningful.join(' ').trim()
  return result.length > 0 ? result : null
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Resolve proveedor assignment from parsed note:
 * 1. If text mentions a supplier name → assign that supplier
 * 2. If matched product has a proveedor_principal_id → assign that
 * 3. Otherwise → null (sin proveedor asignado)
 */
export function resolveProveedor(
  parsed: ParsedNote,
  proveedores: ProveedorMatch[],
  productos: ProductoMatch[],
): { proveedorId: string | null; productoId: string | null; confidence: 'alta' | 'media' | 'sin_match' } {
  let proveedorId: string | null = null
  let productoId: string | null = null
  let confidence: 'alta' | 'media' | 'sin_match' = 'sin_match'

  // Match product
  if (parsed.productoNombre) {
    const prodLower = parsed.productoNombre.toLowerCase()
    const matched = productos.find(p =>
      prodLower.includes(p.nombre.toLowerCase()) ||
      p.nombre.toLowerCase().includes(prodLower)
    )
    if (matched) {
      productoId = matched.id
      if (matched.proveedor_principal_id) {
        proveedorId = matched.proveedor_principal_id
        confidence = 'media'
      }
    }
  }

  // Explicit supplier mention wins over product-based assignment
  if (parsed.proveedorMencionado) {
    const provMatch = proveedores.find(
      p => p.nombre.toLowerCase() === parsed.proveedorMencionado!.toLowerCase()
    )
    if (provMatch) {
      proveedorId = provMatch.id
      confidence = 'alta'
    }
  }

  if (!proveedorId && !productoId) {
    confidence = 'sin_match'
  }

  return { proveedorId, productoId, confidence }
}

/**
 * Check for duplicate faltantes within a time window.
 * Returns true if a near-duplicate exists.
 */
export function isDuplicate(
  newNote: { productoNombre: string | null; productoId: string | null },
  existing: Array<{ producto_nombre: string | null; producto_id: string | null; created_at: string | null; resuelto: boolean | null }>,
  windowMinutes = 60,
): boolean {
  if (!newNote.productoNombre && !newNote.productoId) return false

  const now = Date.now()
  const windowMs = windowMinutes * 60 * 1000

  return existing.some(item => {
    if (item.resuelto) return false

    // Check time window
    if (item.created_at) {
      const itemTime = new Date(item.created_at).getTime()
      if (now - itemTime > windowMs) return false
    }

    // Exact product_id match
    if (newNote.productoId && item.producto_id === newNote.productoId) return true

    // Fuzzy name match
    if (newNote.productoNombre && item.producto_nombre) {
      const a = newNote.productoNombre.toLowerCase().trim()
      const b = item.producto_nombre.toLowerCase().trim()
      if (a === b) return true
      // Simple containment check
      if (a.length > 3 && b.length > 3 && (a.includes(b) || b.includes(a))) return true
    }

    return false
  })
}

/**
 * Generate a purchase summary text for a supplier, ready to copy/share.
 */
export function generatePurchaseSummary(
  proveedorNombre: string,
  items: Array<{
    producto_nombre: string | null
    cantidad_faltante: number | null
    prioridad: string | null
    observaciones: string | null
  }>,
): string {
  const date = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const lines: string[] = [
    `PEDIDO PARA: ${proveedorNombre}`,
    `Fecha: ${date}`,
    `---`,
  ]

  const urgentes = items.filter(i => i.prioridad === 'alta')
  const normales = items.filter(i => i.prioridad !== 'alta')

  if (urgentes.length > 0) {
    lines.push('URGENTE:')
    urgentes.forEach(item => {
      const qty = item.cantidad_faltante ? ` x${item.cantidad_faltante}` : ''
      const obs = item.observaciones ? ` (${item.observaciones})` : ''
      lines.push(`  - ${item.producto_nombre || 'Sin nombre'}${qty}${obs}`)
    })
    lines.push('')
  }

  if (normales.length > 0) {
    if (urgentes.length > 0) lines.push('NORMAL:')
    normales.forEach(item => {
      const qty = item.cantidad_faltante ? ` x${item.cantidad_faltante}` : ''
      const obs = item.observaciones ? ` (${item.observaciones})` : ''
      lines.push(`  - ${item.producto_nombre || 'Sin nombre'}${qty}${obs}`)
    })
  }

  lines.push('')
  lines.push(`Total items: ${items.length}`)
  return lines.join('\n')
}
