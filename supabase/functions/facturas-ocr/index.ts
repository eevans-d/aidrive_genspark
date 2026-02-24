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
} from './helpers.ts';
import type { SupplierProfile, OcrResult, MatchResult } from './helpers.ts';

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

// ============================================================
// Product Matching
// ============================================================

async function matchItem(
  descripcion: string,
  headers: Record<string, string>,
  supabaseUrl: string,
): Promise<MatchResult> {
  const normalized = normalizeText(descripcion);

  // Layer 1: exact match by barcode/SKU (if description looks like a code)
  if (/^[0-9]{8,13}$/.test(descripcion.trim())) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/productos?or=(codigo_barras.eq.${descripcion.trim()},sku.eq.${descripcion.trim()})&limit=1`,
      { headers, signal: AbortSignal.timeout(5000) },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        return {
          producto_id: data[0].id,
          alias_usado: null,
          estado_match: 'auto_match',
          confianza_match: 1.0,
        };
      }
    }
  }

  // Layer 2: alias exact match (normalized)
  const aliasRes = await fetch(
    `${supabaseUrl}/rest/v1/producto_aliases?alias_normalizado=eq.${encodeURIComponent(normalized)}&activo=eq.true&limit=1`,
    { headers, signal: AbortSignal.timeout(5000) },
  );
  if (aliasRes.ok) {
    const aliases = await aliasRes.json();
    if (aliases.length > 0) {
      return {
        producto_id: aliases[0].producto_id,
        alias_usado: aliases[0].alias_texto,
        estado_match: 'alias_match',
        confianza_match: 0.9,
      };
    }
  }

  // Layer 3: fuzzy match against productos.nombre (simple contains)
  const words = normalized.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
  if (words.length > 0) {
    const ilike = words.map(w => `nombre.ilike.*${w}*`).join(',');
    const fuzzyRes = await fetch(
      `${supabaseUrl}/rest/v1/productos?and=(${ilike})&limit=1`,
      { headers, signal: AbortSignal.timeout(5000) },
    );
    if (fuzzyRes.ok) {
      const fuzzy = await fuzzyRes.json();
      if (fuzzy.length > 0) {
        return {
          producto_id: fuzzy[0].id,
          alias_usado: null,
          estado_match: 'fuzzy_pendiente',
          confianza_match: 0.5,
        };
      }
    }
  }

  // No match
  return {
    producto_id: null,
    alias_usado: null,
    estado_match: 'fuzzy_pendiente',
    confianza_match: 0,
  };
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
    const body = await req.json();
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

    if (!factura.imagen_url) {
      return fail('VALIDATION_ERROR', 'La factura no tiene imagen asociada', 400, corsHeaders, { requestId });
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

    const imageBytes = await imageRes.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));

    // 8. Call Google Cloud Vision API (or fallback)
    let ocrResult: OcrResult;

    if (gcvApiKey) {
      const gcvBody = {
        requests: [{
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION' }],
        }],
      };

      const gcvRes = await fetch(
        `${GCV_ENDPOINT}?key=${gcvApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gcvBody),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        },
      );

      if (!gcvRes.ok) {
        const errText = await gcvRes.text();
        logger.error('GCV_API_ERROR', { requestId, status: gcvRes.status, body: errText.slice(0, 500) });
        await updateFacturaEstado(supabaseUrl, srHeaders, factura_id, 'error');
        await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_error', { error: 'GCV API error', status: gcvRes.status, requestId });
        return fail('OCR_ERROR', 'Error en servicio OCR', 502, corsHeaders, { requestId });
      }

      const gcvData = await gcvRes.json();
      const fullText = gcvData.responses?.[0]?.fullTextAnnotation?.text || '';
      const confidence = gcvData.responses?.[0]?.fullTextAnnotation?.pages?.[0]?.confidence ?? 0.5;

      ocrResult = parseOcrText(fullText);
      ocrResult.confianza = Math.round(confidence * 100) / 100;

      logger.info('GCV_OCR_COMPLETED', { requestId, textLength: fullText.length, itemsFound: ocrResult.items.length });
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

    // 9. Update factura with extracted data
    await fetch(
      `${supabaseUrl}/rest/v1/facturas_ingesta?id=eq.${factura_id}`,
      {
        method: 'PATCH',
        headers: { ...srHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          datos_extraidos: {
            texto_completo: ocrResult.texto_completo,
            proveedor_detectado: ocrResult.proveedor_detectado,
            items_raw: ocrResult.items,
          },
          numero: ocrResult.numero || factura.numero,
          fecha_factura: ocrResult.fecha || factura.fecha_factura,
          tipo_comprobante: ocrResult.tipo_comprobante || factura.tipo_comprobante,
          total: ocrResult.total,
          score_confianza: ocrResult.confianza,
          estado: 'extraida',
          request_id: requestId,
          updated_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      },
    );

    // 10. Create factura_ingesta_items with matching and enhanced pricing
    let itemsCreated = 0;
    for (const item of ocrResult.items) {
      const match = await matchItem(item.descripcion, srHeaders, supabaseUrl);
      const enhanced = enhanceLineItem(item, supplierProfile);

      const insertRes = await fetch(
        `${supabaseUrl}/rest/v1/facturas_ingesta_items`,
        {
          method: 'POST',
          headers: { ...srHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
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
          }),
          signal: AbortSignal.timeout(5000),
        },
      );

      if (insertRes.ok) itemsCreated++;
    }

    // 11. Register audit event
    await registrarEvento(supabaseUrl, srHeaders, factura_id, 'ocr_completado', {
      requestId,
      items_detectados: ocrResult.items.length,
      items_creados: itemsCreated,
      confianza: ocrResult.confianza,
    });

    logger.info('OCR_EXTRACTION_COMPLETE', {
      requestId,
      factura_id,
      items_detectados: ocrResult.items.length,
      items_creados: itemsCreated,
      confianza: ocrResult.confianza,
    });

    return ok(
      { factura_id, items_count: itemsCreated, estado: 'extraida' },
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
