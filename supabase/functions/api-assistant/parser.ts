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
  // Sprint 2 — write intents (plan -> confirm)
  {
    intent: 'crear_tarea',
    patterns: [
      /cre[aá]r?\s*(una?\s*)?tarea/i,
      /nueva?\s*tarea/i,
      /agreg[aá]r?\s*(una?\s*)?tarea/i,
      /anot[aá]r?\s*(una?\s*)?tarea/i,
      /tarea\s*:\s*.+/i,
    ],
    extractParams: (msg: string) => {
      const params: Record<string, string> = {};
      // Try "tarea: <titulo>" or "crear tarea <titulo>"
      const colonMatch = msg.match(/tarea\s*:\s*(.+)/i);
      if (colonMatch) {
        params.titulo = colonMatch[1].trim();
        return params;
      }
      const afterCreate = msg.match(/(?:cre[aá]r?|nueva?|agreg[aá]r?|anot[aá]r?)\s*(?:una?\s*)?tarea\s+(.+)/i);
      if (afterCreate) {
        params.titulo = afterCreate[1].trim();
      }
      // Priority extraction
      const prioMatch = msg.match(/prioridad\s*(urgente|alta|baja|normal)/i);
      if (prioMatch) {
        const raw = prioMatch[1].toLowerCase();
        params.prioridad = raw === 'alta' ? 'urgente' : raw;
        // Remove priority from titulo if embedded
        params.titulo = (params.titulo || '').replace(/\s*prioridad\s*(urgente|alta|baja|normal)/i, '').trim();
      }
      return params;
    },
  },
  {
    intent: 'registrar_pago_cc',
    patterns: [
      /registr[aá]r?\s*(un\s*)?pago/i,
      /pago\s*(de|del?\s+cliente|cc|cuenta)/i,
      /cobr[aá]r?\s*(un\s*)?pago/i,
      /pag[oó]\s+\d/i,
      /recib[ií]r?\s*(un\s*)?pago/i,
    ],
    extractParams: (msg: string) => {
      const params: Record<string, string> = {};
      // Amount: "$5000", "5000 pesos", "de 5000"
      const montoMatch = msg.match(/\$?\s*(\d[\d.,]*)\s*(?:pesos)?/);
      if (montoMatch) {
        params.monto = montoMatch[1].replace(/\./g, '').replace(',', '.');
      }
      // Client name: "de <name>" / "cliente <name>"
      const nameMatch = msg.match(/(?:de|del?\s*cliente|cliente)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][\wÁÉÍÓÚÑáéíóúñ\s]{2,40}?)(?:\s*(?:por|de|\$|\d|$))/i);
      if (nameMatch) {
        params.cliente_nombre = nameMatch[1].trim();
      }
      return params;
    },
  },
  {
    intent: 'aplicar_factura',
    patterns: [
      /aplic[aá]r?\s*(?:la\s*)?factura/i,
      /factura\s*(?:a\s*)?(?:aplicar|ingresar|deposito)/i,
      /ingres[aá]r?\s*(?:la\s*)?factura\s*(?:al\s*)?(?:deposito|stock)/i,
      /pasar\s*(?:la\s*)?factura\s*(?:al\s*)?deposito/i,
    ],
    extractParams: (msg: string) => {
      const params: Record<string, string> = {};
      const numMatch = msg.match(/factura\s+(?:(?:n(?:u|ú)mero|nro|#)\s*)?(\d[\d\-]+)/i);
      if (numMatch) {
        params.factura_numero = numMatch[1];
      }
      return params;
    },
  },
  {
    intent: 'actualizar_estado_pedido',
    patterns: [
      /(?:cambiar?|actualizar?|mover?|pasar?|avanzar?)\s*(?:el\s*)?(?:estado\s*(?:del?\s*)?)?pedido/i,
      /pedido\s*#?\d+\s*(?:a\s+)(?:preparando|listo|entregado|cancelado)/i,
      /(?:marcar?|poner?)\s*(?:el\s*)?pedido\s*(?:como\s*)?(?:preparando|listo|entregado|cancelado)/i,
      /(?:preparar|entregar|cancelar)\s*(?:el\s*)?pedido/i,
    ],
    extractParams: (msg: string) => {
      const params: Record<string, string> = {};
      const numMatch = msg.match(/pedido\s*#?(\d+)/i);
      if (numMatch) {
        params.numero_pedido = numMatch[1];
      }
      const estadoMatch = msg.match(/(?:a|como|estado)\s+(preparando|listo|entregado|cancelado)/i);
      if (estadoMatch) {
        params.nuevo_estado = estadoMatch[1].toLowerCase();
      } else {
        if (/preparar/i.test(msg)) params.nuevo_estado = 'preparando';
        else if (/entregar/i.test(msg)) params.nuevo_estado = 'entregado';
        else if (/cancelar/i.test(msg)) params.nuevo_estado = 'cancelado';
      }
      return params;
    },
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
  'crear tarea',
  'registrar pago',
  'aplicar factura',
  'actualizar estado pedido',
  'ayuda',
];

export const WRITE_INTENTS = new Set(['crear_tarea', 'registrar_pago_cc', 'actualizar_estado_pedido', 'aplicar_factura']);

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
  if (/aplic.*factura|factura.*(?:aplicar|deposito|ingresar)|pasar.*factura/i.test(normalized)) relevant.push('aplicar factura');
  if (/stock|producto|reponer|falt[ea]/.test(normalized)) relevant.push('stock bajo');
  if (/pedido|orden|compra|entreg/.test(normalized)) relevant.push('pedidos pendientes');
  if (/(?:cambiar|actualizar|mover|pasar|preparar|entregar|cancelar).*pedido|pedido.*(?:a |como |estado)/i.test(normalized)) relevant.push('actualizar estado pedido');
  if (/venta|vendi[oó]|facturac|recaud/.test(normalized)) relevant.push('ventas del dia');
  if (/deuda|fiado|saldo|cuenta|corriente|cliente/.test(normalized)) relevant.push('cuentas corrientes');
  if (/tarea|pendiente|anotá|anotar|hacer/.test(normalized)) relevant.push('crear tarea');
  if (/pago|cobr[aá]|recib[ií]/.test(normalized)) relevant.push('registrar pago');

  // Fallback: if nothing keyword-matched, return full list (without 'ayuda')
  return relevant.length > 0 ? relevant : SUGGESTIONS.filter(s => s !== 'ayuda');
}
