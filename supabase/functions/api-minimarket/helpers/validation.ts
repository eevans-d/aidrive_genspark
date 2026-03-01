/**
 * Input validation helpers for api-minimarket.
 *
 * All validators are pure functions that return parsed values or null on failure.
 * No throwing - caller decides how to handle invalid input.
 */

/**
 * UUID v4 regex pattern.
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if string is a valid UUID.
 */
export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Parse a positive number (> 0).
 */
export function parsePositiveNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Parse a non-negative number (>= 0).
 */
export function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

/**
 * Parse a positive integer (> 0).
 */
export function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

/**
 * Parse a non-negative integer (>= 0).
 */
export function parseNonNegativeInt(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : null;
}

/**
 * Sanitize text parameter - removes special/injection characters while preserving Unicode letters.
 */
export function sanitizeTextParam(value: string): string {
  return value.trim().replace(/[^\p{L}\p{N} _.-]/gu, '');
}

/**
 * Validate ISO date string (YYYY-MM-DD or full ISO datetime).
 */
export function isValidISODateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

/**
 * Valid pedido estados.
 */
export const VALID_PEDIDO_ESTADOS = new Set(['pendiente', 'preparando', 'listo', 'entregado', 'cancelado']);

/**
 * Valid pedido payment estados.
 */
export const VALID_PEDIDO_ESTADOS_PAGO = new Set(['pendiente', 'parcial', 'pagado']);

/**
 * Valid estados de factura para permitir extraccion OCR desde gateway.
 */
export const VALID_FACTURA_OCR_EXTRAER_ESTADOS = new Set(['pendiente', 'error']);

/**
 * Validate that factura estado is eligible for OCR extraction.
 */
export function canExtractFacturaOCR(estado: unknown): boolean {
  return typeof estado === 'string' && VALID_FACTURA_OCR_EXTRAER_ESTADOS.has(estado);
}

/**
 * Default OCR confidence threshold to allow stock application.
 */
export const DEFAULT_OCR_MIN_SCORE_APPLY = 0.7;

/**
 * Resolve OCR confidence threshold from env/config input.
 * Accepts numeric values in [0, 1]. Falls back to DEFAULT_OCR_MIN_SCORE_APPLY.
 */
export function resolveOcrMinScoreApply(raw: unknown): number {
  const value = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN;
  if (Number.isFinite(value) && value >= 0 && value <= 1) {
    return value;
  }
  return DEFAULT_OCR_MIN_SCORE_APPLY;
}

/**
 * Check whether a factura OCR confidence score meets the required threshold.
 */
export function hasSufficientOcrConfidence(score: unknown, minScore: number): boolean {
  const value = typeof score === 'string' || typeof score === 'number' ? Number(score) : NaN;
  return Number.isFinite(value) && value >= minScore;
}

/**
 * Valid tarea prioridades (unified superset).
 */
export const VALID_TAREA_PRIORIDADES = new Set(['baja', 'normal', 'media', 'alta', 'urgente']);

/**
 * Validate boolean query param.
 * Returns true/false/null (null = invalid).
 */
export function parseBooleanParam(value: string | null): boolean | null {
  if (value === null) return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

/**
 * Validate and parse ISO date string.
 */
export function parseISODate(value: string | null): Date | null {
  if (!value) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  return new Date(ms);
}

/**
 * Valid movement types for inventory operations.
 */
export const VALID_MOVIMIENTO_TIPOS = new Set(['entrada', 'salida', 'ajuste', 'transferencia']);

/**
 * Validate movement type.
 */
export function isValidMovimientoTipo(tipo: string): boolean {
  return VALID_MOVIMIENTO_TIPOS.has(tipo.toLowerCase());
}

/**
 * Allowed fields for product updates (whitelist).
 */
export const PRODUCTO_UPDATE_FIELDS = new Set([
  'sku',
  'nombre',
  'categoria_id',
  'marca',
  'contenido_neto',
  'activo',
  'precio_actual',
  'precio_costo',
  'margen_ganancia',
]);

/**
 * Validate that object only contains allowed fields.
 */
export function validateAllowedFields(
  obj: Record<string, unknown>,
  allowedFields: Set<string>,
): { valid: boolean; unknownFields: string[] } {
  const unknownFields = Object.keys(obj).filter((k) => !allowedFields.has(k));
  return {
    valid: unknownFields.length === 0,
    unknownFields,
  };
}

/**
 * Validate codigo pattern (alphanumeric + dashes/underscores).
 */
export function isValidCodigo(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}
