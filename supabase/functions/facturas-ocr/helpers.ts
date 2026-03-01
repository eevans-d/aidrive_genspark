// ============================================================
// Types
// ============================================================

export interface SupplierProfile {
  precio_es_bulto: boolean;
  iva_incluido: boolean;
  iva_tasa: number;
}

export const DEFAULT_SUPPLIER_PROFILE: SupplierProfile = {
  precio_es_bulto: true,
  iva_incluido: false,
  iva_tasa: 0.21,
};

export interface OcrLineItem {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number | null;
  subtotal: number | null;
}

export interface EnhancedLineItem extends OcrLineItem {
  unidades_por_bulto: number | null;
  precio_unitario_costo: number | null;
  validacion_subtotal: 'ok' | 'warning' | 'error' | null;
  notas_calculo: string | null;
}

export interface OcrResult {
  proveedor_detectado: string | null;
  fecha: string | null;
  numero: string | null;
  tipo_comprobante: string | null;
  total: number | null;
  items: OcrLineItem[];
  texto_completo: string;
  confianza: number;
}

export interface MatchResult {
  producto_id: string | null;
  alias_usado: string | null;
  estado_match: 'auto_match' | 'alias_match' | 'fuzzy_pendiente';
  confianza_match: number;
}

export type OcrFeatureType = 'TEXT_DETECTION' | 'DOCUMENT_TEXT_DETECTION';

export const VALID_FACTURA_OCR_EXTRAER_ESTADOS = new Set(['pendiente', 'error']);

/**
 * Validate if a factura estado can start OCR extraction.
 * Allows retries from `error` with prior cleanup.
 */
export function canExtractFacturaOCR(estado: unknown): boolean {
  return typeof estado === 'string' && VALID_FACTURA_OCR_EXTRAER_ESTADOS.has(estado);
}

/**
 * Resolve OCR feature type according to content type and/or file extension.
 * Returns null for unsupported types.
 */
export function resolveOcrFeatureType(
  contentType: string | null | undefined,
  filePath: string | null | undefined,
): OcrFeatureType | null {
  const normalizedContentType = (contentType || '').toLowerCase();
  const normalizedPath = (filePath || '').toLowerCase();
  const isPdf = normalizedContentType.includes('application/pdf') || normalizedPath.endsWith('.pdf');
  if (isPdf) return 'DOCUMENT_TEXT_DETECTION';

  const isImage = normalizedContentType.startsWith('image/')
    || /\.(png|jpe?g|webp|bmp|gif|tiff?)$/.test(normalizedPath);
  if (isImage) return 'TEXT_DETECTION';

  return null;
}

// ============================================================
// OCR Parsing Helpers
// ============================================================

export function parseArgentineNumber(s: string): number | null {
  if (!s) return null;
  // Argentine format: 1.234,56 → 1234.56
  const cleaned = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
}

export function normalizeUnit(u: string): string {
  const lower = u.toLowerCase().replace(/\.$/, '');
  const map: Record<string, string> = {
    'u': 'u', 'un': 'u', 'uni': 'u', 'unid': 'u', 'unidad': 'u', 'unidades': 'u',
    'kg': 'kg', 'kgs': 'kg', 'kilo': 'kg', 'kilos': 'kg',
    'lt': 'lt', 'l': 'lt', 'lts': 'lt', 'litro': 'lt', 'litros': 'lt',
    'paq': 'paq', 'pack': 'paq',
    'cja': 'caja', 'caj': 'caja', 'caja': 'caja', 'cajas': 'caja',
  };
  return map[lower] || lower;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function parsePackSize(description: string): number | null {
  // First try AxBxC pattern (e.g., "12X3X250" → 12*3 = 36 units)
  const multiMatch = description.match(/(\d+)\s*[xX]\s*(\d+)\s*[xX]\s*(\d+)/);
  if (multiMatch) {
    const a = parseInt(multiMatch[1], 10);
    const b = parseInt(multiMatch[2], 10);
    if (a >= 2 && a <= 200 && b >= 2 && b <= 200) {
      return a * b;
    }
  }

  // Standard NxM pattern (e.g., "20X500" → 20 units)
  const match = description.match(/(\d+)\s*[xX]\s*(\d+)/);
  if (match) {
    const packCount = parseInt(match[1], 10);
    const weight = parseInt(match[2], 10);

    if (packCount >= 2 && packCount <= 500) {
      if (packCount > weight && weight < 50) {
        // Trust the format as-is since suppliers are consistent
      }
      return packCount;
    }
  }

  return null;
}

export function calculateUnitCost(
  precioBulto: number,
  unidadesPorBulto: number,
  profile: SupplierProfile,
): number {
  const precioUnitarioNeto = precioBulto / unidadesPorBulto;

  if (profile.iva_incluido) {
    return Math.round(precioUnitarioNeto * 10000) / 10000;
  }

  return Math.round(precioUnitarioNeto * (1 + profile.iva_tasa) * 10000) / 10000;
}

export function crossValidateSubtotal(
  cantidad: number,
  precioUnitario: number | null,
  subtotalInvoice: number | null,
): { status: 'ok' | 'warning' | 'error' | null; deviation: number | null } {
  if (subtotalInvoice === null || precioUnitario === null || subtotalInvoice === 0) {
    return { status: null, deviation: null };
  }

  const expected = cantidad * precioUnitario;
  const deviation = Math.abs(expected - subtotalInvoice) / subtotalInvoice;

  if (deviation <= 0.005) return { status: 'ok', deviation };
  if (deviation <= 0.02) return { status: 'warning', deviation };
  return { status: 'error', deviation };
}

export function enhanceLineItem(item: OcrLineItem, profile: SupplierProfile): EnhancedLineItem {
  const packSize = parsePackSize(item.descripcion);
  const unidadesPorBulto = packSize ?? 1;

  let precioUnitarioCosto: number | null = null;
  let notasCalculo: string | null = null;

  if (item.precio_unitario !== null && profile.precio_es_bulto) {
    precioUnitarioCosto = calculateUnitCost(item.precio_unitario, unidadesPorBulto, profile);

    const parts: string[] = [];
    if (packSize && packSize > 1) {
      parts.push(`Pack ${packSize}u`);
      parts.push(`$${item.precio_unitario}/${packSize} = $${(item.precio_unitario / packSize).toFixed(4)}/u neto`);
    }
    if (!profile.iva_incluido) {
      parts.push(`+IVA ${(profile.iva_tasa * 100).toFixed(0)}%`);
    }
    parts.push(`= $${precioUnitarioCosto.toFixed(4)}/u final`);
    notasCalculo = parts.join(' | ');
  } else if (item.precio_unitario !== null && !profile.precio_es_bulto) {
    precioUnitarioCosto = profile.iva_incluido
      ? item.precio_unitario
      : Math.round(item.precio_unitario * (1 + profile.iva_tasa) * 10000) / 10000;
    notasCalculo = profile.iva_incluido
      ? 'Precio unitario (IVA incluido)'
      : `Precio unitario +IVA ${(profile.iva_tasa * 100).toFixed(0)}% = $${precioUnitarioCosto.toFixed(4)}/u`;
  }

  const validation = crossValidateSubtotal(item.cantidad, item.precio_unitario, item.subtotal);

  return {
    ...item,
    unidades_por_bulto: packSize,
    precio_unitario_costo: precioUnitarioCosto,
    validacion_subtotal: validation.status,
    notas_calculo: notasCalculo,
  };
}

/**
 * Extract Argentine CUIT from OCR text.
 * Formats supported: 30-12345678-9, 30.12345678.9, 30 12345678 9
 * Returns normalized CUIT as "XX-XXXXXXXX-X" or null if not found.
 */
export function extractCuit(text: string): string | null {
  // Labeled patterns: "CUIT:", "C.U.I.T.:", "CUIT Nº", etc.
  const labeled = text.match(/C\.?U\.?I\.?T\.?\s*[Nº°#:]?\s*(\d{2})[-.\s]?(\d{8})[-.\s]?(\d)/i);
  if (labeled) {
    return `${labeled[1]}-${labeled[2]}-${labeled[3]}`;
  }

  // Unlabeled: sequence matching XX-XXXXXXXX-X or XX.XXXXXXXX.X
  const raw = text.match(/\b(\d{2})[-.](\d{8})[-.]([\d])\b/);
  if (raw) {
    return `${raw[1]}-${raw[2]}-${raw[3]}`;
  }

  return null;
}

export function parseOcrText(fullText: string): OcrResult {
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract invoice number
  let numero: string | null = null;
  const numMatch = fullText.match(/(?:N[°ºro.]+|Factura|Comp\.?)\s*[:#]?\s*([A-Z0-9]+-[0-9]+|[0-9]{4,})/i);
  if (numMatch) numero = numMatch[1];

  // Extract date (DD/MM/YYYY or YYYY-MM-DD)
  let fecha: string | null = null;
  const dateMatch = fullText.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : y;
    fecha = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Extract total
  let total: number | null = null;
  const totalMatch = fullText.match(/TOTAL\s*:?\s*\$?\s*([\d.,]+)/i);
  if (totalMatch) {
    total = parseArgentineNumber(totalMatch[1]);
  }

  // Extract CUIT of issuing supplier
  const cuitDetectado = extractCuit(fullText);

  // Extract line items
  const items: OcrLineItem[] = [];
  const itemRegex = /^(\d+(?:[.,]\d+)?)\s+(?:([a-záéíóúñü]+\.?)\s+)?(.+?)\s+\$?\s*([\d.,]+)(?:\s+\$?\s*([\d.,]+))?$/i;

  for (const line of lines) {
    const match = line.match(itemRegex);
    if (match) {
      const cantidad = parseArgentineNumber(match[1]) || 1;
      const unidad = match[2] || 'u';
      const descripcion = match[3].trim();
      const precio = parseArgentineNumber(match[4]);
      const subtotal = match[5] ? parseArgentineNumber(match[5]) : (precio ? precio * cantidad : null);

      items.push({
        descripcion,
        cantidad,
        unidad: normalizeUnit(unidad),
        precio_unitario: precio,
        subtotal,
      });
    }
  }

  // Detect tipo_comprobante
  let tipo_comprobante: string | null = null;
  if (/factura\s*[a-c]/i.test(fullText)) tipo_comprobante = 'factura';
  else if (/remito/i.test(fullText)) tipo_comprobante = 'remito';
  else if (/nota\s*de\s*cr[eé]dito/i.test(fullText)) tipo_comprobante = 'nota_credito';
  else if (/recibo/i.test(fullText)) tipo_comprobante = 'recibo';
  else tipo_comprobante = 'factura';

  return {
    proveedor_detectado: cuitDetectado,
    fecha,
    numero,
    tipo_comprobante,
    total,
    items,
    texto_completo: fullText,
    confianza: items.length > 0 ? 0.7 : 0.3,
  };
}
