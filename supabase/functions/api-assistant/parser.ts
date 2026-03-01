/**
 * Intent Parser for AI Assistant (rule-based v1)
 *
 * Pure functions — no Deno/runtime dependencies.
 * Importable from both the edge function and unit tests.
 */

export interface ParsedIntent {
  intent: string | null;
  confidence: number;
  params: Record<string, string>;
}

interface IntentRule {
  intent: string;
  patterns: RegExp[];
  extractParams?: (message: string) => Record<string, string>;
}

export const INTENT_RULES: IntentRule[] = [
  {
    intent: 'consultar_stock_bajo',
    patterns: [
      /stock\s*(bajo|m[ií]nimo|cr[ií]tico|falta)/i,
      /falta\s*(reponer|stock)/i,
      /qu[ée]\s*(me\s*)?falta\s+reponer/i,
      /productos?\s*(con\s*)?(stock\s*)?(bajo|m[ií]nimo)/i,
      /reponer|reposici[oó]n/i,
    ],
  },
  {
    intent: 'consultar_pedidos_pendientes',
    patterns: [
      /pedidos?\s*(pendiente|abierto|sin\s*entregar)/i,
      /pedidos?\s*(que\s*)?(faltan|quedan|hay)/i,
      /cu[aá]ntos?\s*pedidos/i,
      /hay\s*pedidos/i,
      /pedidos?\s*del\s*d[ií]a/i,
      /estado\s*(de\s*los?\s*)?pedidos/i,
    ],
  },
  {
    intent: 'consultar_resumen_cc',
    patterns: [
      /cuenta(s)?\s*corriente(s)?/i,
      /dinero\s*(en\s*la\s*)?calle/i,
      /fiado|deuda(s)?|saldo(s)?/i,
      /cu[aá]nto\s*(me\s*)?deben/i,
      /clientes?\s*(con\s*)?deuda/i,
      /resumen\s*(de\s*)?(cc|cuenta)/i,
    ],
  },
  {
    intent: 'consultar_ventas_dia',
    patterns: [
      /ventas?\s*(del\s*)?(d[ií]a|hoy|jornada)/i,
      /cu[aá]nto\s*(se\s*)?vendi[oó]/i,
      /resumen\s*(de\s*)?ventas/i,
      /c[oó]mo\s*(fueron?|van?|est[aá]n?)\s*(las\s*)?ventas/i,
      /facturaci[oó]n\s*(del\s*)?(d[ií]a|hoy)/i,
    ],
  },
  {
    intent: 'consultar_estado_ocr_facturas',
    patterns: [
      /factura(s)?\s*(ocr|cargada|pendiente|estado)/i,
      /estado\s*(de\s*las?\s*)?factura/i,
      /ocr\s*(de\s*)?(factura|ingesta)/i,
      /factura(s)?\s*(sin\s*)?(procesar|validar|aplicar)/i,
      /ingesta\s*(de\s*)?factura/i,
    ],
  },
  // Non-data intents — placed last so specific queries always match first
  {
    intent: 'saludo',
    patterns: [
      /^(hola|buenas?|buen\s*d[ií]a|buenas?\s*(tardes?|noches?)|hey|qu[eé]\s*tal)/i,
    ],
  },
  {
    intent: 'ayuda',
    patterns: [
      /^(ayuda|help)$/i,
      /qu[eé]\s*(puedo|pod[eé]s|sab[eé]s)\s*(hacer|preguntar|consultar)/i,
      /c[oó]mo\s*(te\s*)?(uso|funciona)/i,
      /qu[eé]\s*(hac[eé]s|sab[eé]s)\s*\??$/i,
    ],
  },
];

export const SUGGESTIONS = [
  'stock bajo',
  'pedidos pendientes',
  'cuentas corrientes',
  'ventas del dia',
  'facturas OCR',
  'ayuda',
];

export function parseIntent(message: string): ParsedIntent {
  const normalized = message.trim().toLowerCase();

  if (normalized.length < 3) {
    return { intent: null, confidence: 0, params: {} };
  }

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        const params = rule.extractParams ? rule.extractParams(normalized) : {};
        return { intent: rule.intent, confidence: 0.90, params };
      }
    }
  }

  return { intent: null, confidence: 0, params: {} };
}

/**
 * When no intent is matched, detect keywords in the message and return
 * the most relevant suggestions instead of the full static list.
 */
export function findRelevantSuggestions(message: string): string[] {
  const normalized = message.toLowerCase();
  const relevant: string[] = [];

  if (/factura|ocr|ingesta/.test(normalized)) relevant.push('estado de las facturas');
  if (/stock|producto|reponer|falt[ea]/.test(normalized)) relevant.push('stock bajo');
  if (/pedido|orden|compra|entreg/.test(normalized)) relevant.push('pedidos pendientes');
  if (/venta|vendi[oó]|facturac|recaud/.test(normalized)) relevant.push('ventas del dia');
  if (/deuda|fiado|saldo|cuenta|corriente|cliente/.test(normalized)) relevant.push('cuentas corrientes');

  // Fallback: if nothing keyword-matched, return full list (without 'ayuda')
  return relevant.length > 0 ? relevant : SUGGESTIONS.filter(s => s !== 'ayuda');
}
