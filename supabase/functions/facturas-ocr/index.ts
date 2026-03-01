/**
 * facturas-ocr — Edge Function for invoice OCR extraction
 *
 * Receives a factura_id, downloads the image from Storage,
 * sends it to Google Cloud Vision API for text extraction,
 * parses the response into structured invoice data,
 * and performs multi-level product matching.
 *
 * Auth: service_role only (invoked server-side or via service key).
 * Secret: GCV_API_KEY (Google Cloud Vision API key).
 */

import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { ok, fail } from '../_shared/response.ts';
import { requireServiceRoleAuth } from '../_shared/internal-auth.ts';
import {
  parseOcrText,
  normalizeText,
  enhanceLineItem,
  DEFAULT_SUPPLIER_PROFILE,
  canExtractFacturaOCR,
  VALID_FACTURA_OCR_EXTRAER_ESTADOS,
  resolveOcrFeatureType,
} from './helpers.ts';
import type {
  SupplierProfile,
  OcrResult,
  OcrLineItem,
  MatchResult,
} from './helpers.ts';

const logger = createLogger('facturas-ocr');
const GCV_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch supplier profile from database.
 * Returns default profile if none exists for this supplier.
 */
async function fetchSupplierProfile(
  supabaseUrl: string,
  headers: Record<string, string>,
  proveedorId: string,
): Promise<SupplierProfile> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/supplier_profiles?proveedor_id=eq.${proveedorId}&activo=eq.true&limit=1`,
      { headers, signal: AbortSignal.timeout(3000) },
    );
    if (res.ok) {
      const profiles = await res.json();
      if (profiles.length > 0) {
        const p = profiles[0];
        return {
          precio_es_bulto: p.precio_es_bulto ?? true,
          iva_incluido: p.iva_incluido ?? false,
          iva_tasa: p.iva_tasa != null ? Number(p.iva_tasa) / 100 : 0.21,
        };
      }
    }
  } catch {
    // Non-blocking: use defaults
  }
  return DEFAULT_SUPPLIER_PROFILE;
}

/**
 * Resolve proveedor name by CUIT from proveedores table.
 * Returns { id, nombre } if a matching active proveedor exists, otherwise null.
 * Non-blocking: errors are swallowed.
 */
async function resolveProveedorByCuit(
  supabaseUrl: string,
  headers: Record<string, string>,
  cuit: string,
): Promise<{ id: string; nombre: string } | null> {
  const digits = cuit.replace(/\D/g, '');
  const variants = new Set<string>([cuit]);
  if (digits.length === 11) {
    variants.add(digits);
    variants.add(`${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`);
  }
  const orFilter = Array.from(variants).map(v => `cuit.eq.${encodeURIComponent(v)}`).join(',');

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/proveedores?or=(${orFilter})&activo=eq.true&select=id,nombre&limit=1`,
      { headers, signal: AbortSignal.timeout(3000) },
    );
    if (res.ok) {
      const rows = await res.json();
      if (rows.length > 0) return { id: rows[0].id, nombre: rows[0].nombre };
    }
  } catch {
    // Non-blocking
  }
  return null;
}

// ============================================================
// Product Matching
// ============================================================

type MatchCacheEntry = MatchResult | null;

interface MatchCache {
  barcodeOrSku: Map<string, MatchCacheEntry>;
  aliasByNormalized: Map<string, MatchCacheEntry>;
  fuzzyByWords: Map<string, MatchCacheEntry>;
}

interface InsertFacturaItemPayload {
  factura_id: string;
  descripcion_original: string;
  producto_id: string | null;
  alias_usado: string | null;
  cantidad: number;
  unidad: string;
  precio_unitario: number | null;
  subtotal: number | null;
  estado_match: MatchResult['estado_match'];
  confianza_match: number;
  unidades_por_bulto: number | null;
  precio_unitario_costo: number | null;
  validacion_subtotal: 'ok' | 'warning' | 'error' | null;
  notas_calculo: string | null;
}

interface FailedInsertItem {
  descripcion_original: string;
  error: string;
}

interface BatchInsertResult {
  itemsCreated: number;
  failedItems: FailedInsertItem[];
  insertMode: 'batch' | 'fallback';
}

function createMatchCache(): MatchCache {
  return {
    barcodeOrSku: new Map<string, MatchCacheEntry>(),
    aliasByNormalized: new Map<string, MatchCacheEntry>(),
    fuzzyByWords: new Map<string, MatchCacheEntry>(),
  };
}

function noMatchResult(): MatchResult {
  return {
    producto_id: null,
    alias_usado: null,
    estado_match: 'fuzzy_pendiente',
    confianza_match: 0,
  };
}

async function lookupBarcodeOrSku(
  rawCode: string,
  headers: Record<string, string>,
  supabaseUrl: string,
  cache: MatchCache,
): Promise<MatchResult | null> {
  const code = rawCode.trim();
  if (!code) return null;

  if (cache.barcodeOrSku.has(code)) {
    return cache.barcodeOrSku.get(code) ?? null;
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/productos?or=(codigo_barras.eq.${code},sku.eq.${code})&limit=1`,
    { headers, signal: AbortSignal.timeout(5000) },
  );
  if (res.ok) {
    const data = await res.json();
    if (data.length > 0) {
      const match: MatchResult = {
        producto_id: data[0].id,
        alias_usado: null,
        estado_match: 'auto_match',
        confianza_match: 1.0,
      };
      cache.barcodeOrSku.set(code, match);
      return match;
    }
  }

  cache.barcodeOrSku.set(code, null);
  return null;
}

async function lookupAliasNormalized(
  normalized: string,
  headers: Record<string, string>,
  supabaseUrl: string,
  cache: MatchCache,
): Promise<MatchResult | null> {
  if (!normalized) return null;

  if (cache.aliasByNormalized.has(normalized)) {
    return cache.aliasByNormalized.get(normalized) ?? null;
  }

  const aliasRes = await fetch(
    `${supabaseUrl}/rest/v1/producto_aliases?alias_normalizado=eq.${encodeURIComponent(normalized)}&activo=eq.true&limit=1`,
    { headers, signal: AbortSignal.timeout(5000) },
  );
  if (aliasRes.ok) {
    const aliases = await aliasRes.json();
    if (aliases.length > 0) {
      const match: MatchResult = {
        producto_id: aliases[0].producto_id,
        alias_usado: aliases[0].alias_texto,
        estado_match: 'alias_match',
        confianza_match: 0.9,
      };
      cache.aliasByNormalized.set(normalized, match);
      return match;
    }
  }

  cache.aliasByNormalized.set(normalized, null);
  return null;
}

async function lookupFuzzy(
  words: string[],
  headers: Record<string, string>,
  supabaseUrl: string,
  cache: MatchCache,
): Promise<MatchResult | null> {
  if (words.length === 0) return null;
  const cacheKey = words.join('|');
  if (cache.fuzzyByWords.has(cacheKey)) {
    return cache.fuzzyByWords.get(cacheKey) ?? null;
  }

  const ilike = words.map(w => `nombre.ilike.*${w}*`).join(',');
  const fuzzyRes = await fetch(
    `${supabaseUrl}/rest/v1/productos?and=(${ilike})&limit=1`,
    { headers, signal: AbortSignal.timeout(5000) },
  );
  if (fuzzyRes.ok) {
    const fuzzy = await fuzzyRes.json();
    if (fuzzy.length > 0) {
      const match: MatchResult = {
        producto_id: fuzzy[0].id,
        alias_usado: null,
        estado_match: 'fuzzy_pendiente',
        confianza_match: 0.5,
      };
      cache.fuzzyByWords.set(cacheKey, match);
      return match;
    }
  }

  cache.fuzzyByWords.set(cacheKey, null);
  return null;
}

async function preloadMatchCache(
  items: OcrLineItem[],
  headers: Record<string, string>,
  supabaseUrl: string,
  cache: MatchCache,
): Promise<void> {
  const possibleCodes = new Set<string>();
  const normalizedAliases = new Set<string>();

  for (const item of items) {
    const raw = item.descripcion.trim();
    if (/^[0-9]{8,13}$/.test(raw)) {
      possibleCodes.add(raw);
    }
    const normalized = normalizeText(item.descripcion);
    if (normalized) {
      normalizedAliases.add(normalized);
    }
  }

  await Promise.all([
    ...Array.from(possibleCodes).map((code) => lookupBarcodeOrSku(code, headers, supabaseUrl, cache)),
    ...Array.from(normalizedAliases).map((alias) => lookupAliasNormalized(alias, headers, supabaseUrl, cache)),
  ]);
}

async function matchItem(
  descripcion: string,
  headers: Record<string, string>,
  supabaseUrl: string,
  cache: MatchCache,
): Promise<MatchResult> {
  const normalized = normalizeText(descripcion);
  const raw = descripcion.trim();

  // Layer 1: exact match by barcode/SKU (if description looks like a code)
  if (/^[0-9]{8,13}$/.test(raw)) {
    const codeMatch = await lookupBarcodeOrSku(raw, headers, supabaseUrl, cache);
    if (codeMatch) {
      return codeMatch;
    }
  }

  // Layer 2: alias exact match (normalized)
  const aliasMatch = await lookupAliasNormalized(normalized, headers, supabaseUrl, cache);
  if (aliasMatch) {
    return aliasMatch;
  }

  // Layer 3: fuzzy match against productos.nombre (simple contains)
  const words = normalized.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
  if (words.length > 0) {
    const fuzzyMatch = await lookupFuzzy(words, headers, supabaseUrl, cache);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }
  }

  // No match
  return noMatchResult();
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  // 1. CORS preflight
  const corsHeaders = getCorsHeaders();
  const preflight = handleCors(req, corsHeaders);
  if (preflight) return preflight;

  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // 2. Environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const gcvApiKey = Deno.env.get('GCV_API_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return fail('CONFIG_ERROR', 'Configuración de Supabase faltante', 500, corsHeaders, { requestId });
    }

    // 3. Auth
    const authCheck = requireServiceRoleAuth(req, serviceRoleKey, corsHeaders, requestId);
    if (!authCheck.authorized) {
      logger.warn('UNAUTHORIZED_REQUEST', { requestId });
      return authCheck.errorResponse as Response;
    }

    // 4. Only POST
    if (req.method !== 'POST') {
      return fail('METHOD_NOT_ALLOWED', 'Solo se acepta POST', 405, corsHeaders, { requestId });
    }

    // 5. Parse body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return fail('VALIDATION_ERROR', 'El body debe ser JSON válido', 400, corsHeaders, { requestId });
    }
    const { factura_id } = body;

    if (!factura_id || typeof factura_id !== 'string') {
      return fail('VALIDATION_ERROR', 'factura_id es requerido', 400, corsHeaders, { requestId });
    }

    const srHeaders = {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    };

    // 6. Fetch factura record
    const facturaRes = await fetch(
      `${supabaseUrl}/rest/v1/facturas_ingesta?id=eq.${factura_id}&limit=1`,
      { headers: srHeaders, signal: AbortSignal.timeout(5000) },
    );

    if (!facturaRes.ok) {
      return fail('DB_ERROR', 'Error al obtener factura', 500, corsHeaders, { requestId });
    }

    const facturas = await facturaRes.json();
    if (facturas.length === 0) {
      return fail('NOT_FOUND', 'Factura no encontrada', 404, corsHeaders, { requestId });
    }

    const factura = facturas[0];
    const estadoActual = typeof factura.estado === 'string' ? factura.estado : '';
    const estadosPermitidos = Array.from(VALID_FACTURA_OCR_EXTRAER_ESTADOS);
    if (!canExtractFacturaOCR(estadoActual)) {
      return fail('INVALID_STATE', `Factura en estado no permitido para OCR: ${estadoActual || 'desconocido'}`, 409, corsHeaders, {
        requestId,
        details: {
          estado_actual: estadoActual || null,
          estados_permitidos: estadosPermitidos,
        },
      });
    }

    if (!factura.imagen_url) {
      return fail('VALIDATION_ERROR', 'La factura no tiene imagen asociada', 400, corsHeaders, { requestId });
    }

    let itemsPreviosEliminados = 0;
    if (estadoActual === 'error') {
      try {
        itemsPreviosEliminados = await cleanupFacturaItems(supabaseUrl, srHeaders, factura_id);
        await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_reintento', {
          requestId,
          estado_previo: estadoActual,
          items_previos_eliminados: itemsPreviosEliminados,
        });
      } catch (cleanupError) {
        const cleanupErrorMsg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        logger.error('RETRY_CLEANUP_FAILED', { requestId, factura_id, error: cleanupErrorMsg });
        return fail('DB_ERROR', 'No se pudo preparar la reextraccion OCR', 500, corsHeaders, { requestId });
      }
    }

    logger.info('OCR_STARTED', { requestId, factura_id, imagen_url: factura.imagen_url });

    // 6b. Fetch supplier profile for pricing rules
    const supplierProfile = await fetchSupplierProfile(supabaseUrl, srHeaders, factura.proveedor_id);
    logger.info('SUPPLIER_PROFILE_LOADED', { requestId, proveedor_id: factura.proveedor_id, profile: supplierProfile });

    // 7. Download image from storage
    const imageRes = await fetch(
      `${supabaseUrl}/storage/v1/object/facturas/${factura.imagen_url}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!imageRes.ok) {
      await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
      await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', { error: 'No se pudo descargar imagen', requestId });
      return fail('STORAGE_ERROR', 'No se pudo descargar la imagen', 500, corsHeaders, { requestId });
    }

    const ocrFeatureType = resolveOcrFeatureType(imageRes.headers.get('content-type'), factura.imagen_url);
    if (!ocrFeatureType) {
      await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
      await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', {
        requestId,
        error: 'Tipo de archivo no soportado para OCR',
        content_type: imageRes.headers.get('content-type') || null,
      });
      return fail('UNSUPPORTED_FILE_TYPE', 'Solo se soportan imagenes y PDF para OCR', 400, corsHeaders, { requestId });
    }

    const imageBytes = await imageRes.arrayBuffer();

    // Guard: reject images that are too large (>10MB) to avoid memory exhaustion
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (imageBytes.byteLength > MAX_IMAGE_SIZE) {
      await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
      await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', {
        requestId,
        error: `Imagen demasiado grande: ${(imageBytes.byteLength / 1024 / 1024).toFixed(1)}MB (max 10MB)`,
      });
      return fail('VALIDATION_ERROR', 'La imagen excede el tamaño máximo de 10MB', 400, corsHeaders, { requestId });
    }

    // Guard: reject zero-byte or too-small files (likely corrupt)
    if (imageBytes.byteLength < 1024) {
      await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
      await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', {
        requestId,
        error: `Imagen demasiado pequeña o corrupta: ${imageBytes.byteLength} bytes`,
      });
      return fail('VALIDATION_ERROR', 'Imagen corrupta o vacía', 400, corsHeaders, { requestId });
    }

    // Chunked base64 encoding to avoid stack overflow with large images
    const uint8 = new Uint8Array(imageBytes);
    let binary = '';
    const CHUNK_SIZE = 8192;
    for (let i = 0; i < uint8.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...uint8.subarray(i, Math.min(i + CHUNK_SIZE, uint8.length)));
    }
    const base64Image = btoa(binary);

    // 8. Call Google Cloud Vision API (or fallback)
    let ocrResult: OcrResult;

    if (gcvApiKey) {
      const gcvBody = {
        requests: [{
          image: { content: base64Image },
          features: [{ type: ocrFeatureType }],
        }],
      };

      let gcvRes: Response;
      try {
        gcvRes = await fetch(
          `${GCV_ENDPOINT}?key=${gcvApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gcvBody),
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          },
        );
      } catch (gcvFetchErr) {
        const errMsg = gcvFetchErr instanceof Error ? gcvFetchErr.message : String(gcvFetchErr);
        // Sanitize: never log or return the GCV API key
        const sanitized = errMsg.replace(/key=[^&\s]+/gi, 'key=REDACTED');
        logger.error('GCV_FETCH_FAILED', { requestId, error: sanitized });
        await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
        await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', { error: `GCV fetch failed: ${sanitized}`, requestId });
        return fail('OCR_TIMEOUT', `Error de conexión con servicio OCR: ${sanitized}`, 504, corsHeaders, { requestId });
      }

      if (!gcvRes.ok) {
        const errText = await gcvRes.text();
        logger.error('GCV_API_ERROR', { requestId, status: gcvRes.status, body: errText.slice(0, 500) });
        await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
        await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', { error: 'GCV API error', status: gcvRes.status, requestId });
        return fail('OCR_ERROR', 'Error en servicio OCR', 502, corsHeaders, { requestId });
      }

      // F1 fix: guard against malformed GCV JSON response
      let gcvData: Record<string, unknown>;
      try {
        gcvData = await gcvRes.json();
      } catch (jsonErr) {
        logger.error('GCV_JSON_PARSE_FAILED', { requestId, error: String(jsonErr) });
        await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
        await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', { error: 'GCV devolvió respuesta no-JSON', requestId });
        return fail('OCR_ERROR', 'Respuesta malformada del servicio OCR', 502, corsHeaders, { requestId });
      }

      const responses = gcvData.responses as Array<Record<string, unknown>> | undefined;
      const firstResponse = responses?.[0] as Record<string, unknown> | undefined;
      const annotation = firstResponse?.fullTextAnnotation as Record<string, unknown> | undefined;
      const fullText = (annotation?.text as string) || '';
      const pages = annotation?.pages as Array<Record<string, unknown>> | undefined;
      const confidence = (pages?.[0]?.confidence as number) ?? 0.5;

      ocrResult = parseOcrText(fullText);
      ocrResult.confianza = Math.round(confidence * 100) / 100;

      logger.info('GCV_OCR_COMPLETED', {
        requestId,
        textLength: fullText.length,
        itemsFound: ocrResult.items.length,
        feature_type: ocrFeatureType,
      });
    } else {
      // No GCV_API_KEY: mark as error with clear message
      logger.warn('GCV_API_KEY_NOT_SET', { requestId });
      await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
      await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', {
        error: 'GCV_API_KEY no configurado. Configure el secret en Supabase.',
        requestId,
      });
      return fail('CONFIG_ERROR', 'Servicio OCR no configurado (GCV_API_KEY faltante)', 503, corsHeaders, { requestId });
    }

    // 8b. Resolve detected CUIT to proveedor name (non-blocking enrichment)
    let proveedorNombre: string | null = null;
    if (ocrResult.proveedor_detectado) {
      const resolved = await resolveProveedorByCuit(supabaseUrl, srHeaders, ocrResult.proveedor_detectado);
      if (resolved) {
        proveedorNombre = resolved.nombre;
        if (resolved.id !== factura.proveedor_id) {
          logger.warn('CUIT_PROVEEDOR_MISMATCH', {
            requestId,
            cuit: ocrResult.proveedor_detectado,
            detectado_id: resolved.id,
            seleccionado_id: factura.proveedor_id,
          });
        }
      }
    }

    // 9. Save extracted data (without estado change yet — items first, then estado)
    const patchPayload = {
      datos_extraidos: {
        texto_completo: ocrResult.texto_completo,
        cuit_detectado: ocrResult.proveedor_detectado,
        proveedor_nombre: proveedorNombre,
        items_raw: ocrResult.items,
      },
      numero: ocrResult.numero || factura.numero,
      fecha_factura: ocrResult.fecha || factura.fecha_factura,
      tipo_comprobante: ocrResult.tipo_comprobante || factura.tipo_comprobante,
      total: ocrResult.total,
      score_confianza: ocrResult.confianza,
      request_id: requestId,
      updated_at: new Date().toISOString(),
    };

    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/facturas_ingesta?id=eq.${factura_id}`,
      {
        method: 'PATCH',
        headers: { ...srHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify(patchPayload),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!patchRes.ok) {
      const patchErrText = await patchRes.text().catch(() => '');
      logger.error('FACTURA_PATCH_FAILED', { requestId, factura_id, status: patchRes.status, body: patchErrText.slice(0, 200) });
      await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
      await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', {
        requestId,
        error: `No se pudo actualizar datos extraidos (HTTP ${patchRes.status})`,
      });
      return fail('DB_ERROR', 'Error al guardar datos extraidos', 500, corsHeaders, { requestId });
    }

    // 10. Create factura_ingesta_items with cache-assisted matching + batch insert
    const matchCache = createMatchCache();
    await preloadMatchCache(ocrResult.items, srHeaders, supabaseUrl, matchCache);

    const itemsPayload: InsertFacturaItemPayload[] = [];
    for (const item of ocrResult.items) {
      const match = await matchItem(item.descripcion, srHeaders, supabaseUrl, matchCache);
      const enhanced = enhanceLineItem(item, supplierProfile);

      itemsPayload.push({
        factura_id,
        descripcion_original: item.descripcion,
        producto_id: match.producto_id,
        alias_usado: match.alias_usado,
        cantidad: item.cantidad,
        unidad: item.unidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        estado_match: match.estado_match,
        confianza_match: match.confianza_match,
        unidades_por_bulto: enhanced.unidades_por_bulto,
        precio_unitario_costo: enhanced.precio_unitario_costo,
        validacion_subtotal: enhanced.validacion_subtotal,
        notas_calculo: enhanced.notas_calculo,
      });
    }

    const { itemsCreated, failedItems, insertMode } = await insertFacturaItemsBatch(
      supabaseUrl,
      srHeaders,
      itemsPayload,
    );

    // 10b. NOW transition estado to 'extraida' only after items are persisted
    const estadoRes = await fetch(
      `${supabaseUrl}/rest/v1/facturas_ingesta?id=eq.${factura_id}`,
      {
        method: 'PATCH',
        headers: { ...srHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ estado: 'extraida', updated_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!estadoRes.ok) {
      logger.error('FACTURA_ESTADO_EXTRAIDA_FAILED', { requestId, factura_id, status: estadoRes.status });
      // Items are already saved — log but don't delete them. Operator can manually fix estado.
    }

    // 11. Register audit event
    await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_completado', {
      requestId,
      items_detectados: ocrResult.items.length,
      items_creados: itemsCreated,
      items_fallidos: failedItems,
      confianza: ocrResult.confianza,
      cuit_detectado: ocrResult.proveedor_detectado,
      proveedor_nombre: proveedorNombre,
      insert_mode: insertMode,
      feature_type: ocrFeatureType,
      items_previos_eliminados: itemsPreviosEliminados,
    });

    logger.info('OCR_EXTRACTION_COMPLETE', {
      requestId,
      factura_id,
      items_detectados: ocrResult.items.length,
      items_creados: itemsCreated,
      items_fallidos: failedItems.length,
      confianza: ocrResult.confianza,
      insert_mode: insertMode,
      feature_type: ocrFeatureType,
      items_previos_eliminados: itemsPreviosEliminados,
    });

    return ok(
      {
        factura_id,
        items_count: itemsCreated,
        items_failed_count: failedItems.length,
        items_failed: failedItems,
        insert_mode: insertMode,
        items_previos_eliminados: itemsPreviosEliminados,
        estado: 'extraida',
      },
      200,
      corsHeaders,
      { requestId },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('UNHANDLED_ERROR', { requestId, error: msg });
    return fail('INTERNAL_ERROR', 'Error interno de procesamiento', 500, corsHeaders, { requestId });
  }
});

// ============================================================
// Helpers
// ============================================================

async function cleanupFacturaItems(
  supabaseUrl: string,
  headers: Record<string, string>,
  facturaId: string,
): Promise<number> {
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/facturas_ingesta_items?factura_id=eq.${facturaId}&select=id`,
    {
      headers,
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!existingRes.ok) {
    throw new Error(`Error consultando items previos (${existingRes.status})`);
  }

  const existingItems = await existingRes.json();
  const previousCount = Array.isArray(existingItems) ? existingItems.length : 0;
  if (previousCount === 0) {
    return 0;
  }

  const deleteRes = await fetch(
    `${supabaseUrl}/rest/v1/facturas_ingesta_items?factura_id=eq.${facturaId}`,
    {
      method: 'DELETE',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!deleteRes.ok) {
    throw new Error(`Error eliminando items previos (${deleteRes.status})`);
  }

  return previousCount;
}

async function insertFacturaItemSingle(
  supabaseUrl: string,
  headers: Record<string, string>,
  payload: InsertFacturaItemPayload,
): Promise<{ ok: boolean; error: string | null }> {
  const insertRes = await fetch(
    `${supabaseUrl}/rest/v1/facturas_ingesta_items`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    },
  );

  if (insertRes.ok) {
    return { ok: true, error: null };
  }

  const bodyText = await insertRes.text().catch(() => '');
  return {
    ok: false,
    error: bodyText.slice(0, 160) || `HTTP ${insertRes.status}`,
  };
}

async function insertFacturaItemsBatch(
  supabaseUrl: string,
  headers: Record<string, string>,
  payloads: InsertFacturaItemPayload[],
): Promise<BatchInsertResult> {
  if (payloads.length === 0) {
    return {
      itemsCreated: 0,
      failedItems: [],
      insertMode: 'batch',
    };
  }

  const batchRes = await fetch(
    `${supabaseUrl}/rest/v1/facturas_ingesta_items`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(payloads),
      signal: AbortSignal.timeout(7000),
    },
  );

  if (batchRes.ok) {
    return {
      itemsCreated: payloads.length,
      failedItems: [],
      insertMode: 'batch',
    };
  }

  const failedItems: FailedInsertItem[] = [];
  let itemsCreated = 0;
  for (const payload of payloads) {
    const singleRes = await insertFacturaItemSingle(supabaseUrl, headers, payload);
    if (singleRes.ok) {
      itemsCreated++;
    } else {
      failedItems.push({
        descripcion_original: payload.descripcion_original,
        error: singleRes.error || 'Error desconocido',
      });
    }
  }

  return {
    itemsCreated,
    failedItems,
    insertMode: 'fallback',
  };
}

async function updateFacturaEstado(
  supabaseUrl: string,
  headers: Record<string, string>,
  facturaId: string,
  estado: string,
): Promise<void> {
  await fetch(
    `${supabaseUrl}/rest/v1/facturas_ingesta?id=eq.${facturaId}`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ estado, updated_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000),
    },
  ).catch(() => { /* best-effort */ });
}

async function registrarEvento(
  supabaseUrl: string,
  headers: Record<string, string>,
  facturaId: string,
  evento: string,
  datos: Record<string, unknown>,
): Promise<void> {
  await fetch(
    `${supabaseUrl}/rest/v1/facturas_ingesta_eventos`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ factura_id: facturaId, evento, datos }),
      signal: AbortSignal.timeout(5000),
    },
  ).catch(() => { /* best-effort */ });
}
