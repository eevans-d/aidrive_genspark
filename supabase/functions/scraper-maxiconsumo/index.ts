/**
 * scraper-maxiconsumo - Entry Point Modularizado
 * Orquesta scraping, comparación, alertas y status
 * @module scraper-maxiconsumo
 */

import { AdaptiveRateLimiter } from '../_shared/rate-limit.ts';
import { getCircuitBreaker, getCircuitBreakersSnapshot } from '../_shared/circuit-breaker.ts';
import type { StructuredLog, PerformanceMetrics } from './types.ts';
import { getFromCache, addToCache, getCacheStats, GLOBAL_CACHE } from './cache.ts';
import { ejecutarScrapingCompleto } from './scraping.ts';
import { guardarProductosExtraidosOptimizado, fetchProductosProveedor, fetchProductosSistema, batchSaveComparisons, batchSaveAlerts } from './storage.ts';
import { performAdvancedMatching, calculateMatchConfidence, generateComparacion } from './matching.ts';
import { MAXICONSUMO_BREAKER_OPTIONS } from './config.ts';
import { buildAlertasDesdeComparaciones } from './alertas.ts';
import { createLogger } from '../_shared/logger.ts';
import { parseAllowedOrigins, validateOrigin, handleCors, createCorsErrorResponse } from '../_shared/cors.ts';
import { validateApiSecret } from '../api-proveedor/utils/auth.ts';

const logger = createLogger('scraper-maxiconsumo:index');

const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const rateLimiter = new AdaptiveRateLimiter({ baseRate: 10, burstRate: 20, windowMs: 60000, adaptiveFactor: 0.8 });
const PERFORMANCE_METRICS: PerformanceMetrics = {
  memoryUsage: { used: 0, total: 0, percentage: 0 },
  requestMetrics: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
  scrapingMetrics: { categoriesScraped: 0, productsExtracted: 0, errorsEncountered: 0, captchasDetected: 0 }
};

function getEnvOrThrow(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

function jsonResponse(
  data: unknown,
  status = 200,
  corsHeaders: Record<string, string> = DEFAULT_CORS_HEADERS,
  requestId?: string
): Response {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (requestId) headers['x-request-id'] = requestId;
  const body =
    requestId && typeof data === 'object' && data !== null && !Array.isArray(data) && !(data as Record<string, unknown>).requestId
      ? { ...(data as Record<string, unknown>), requestId }
      : data;
  return new Response(JSON.stringify(body), { status, headers });
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handleScraping(
  log: StructuredLog,
  url: string,
  key: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const cached = getFromCache<any>('scraping:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true }, 200, corsHeaders, log.requestId);

  const { productos, categorias_procesadas, errores } = await ejecutarScrapingCompleto(log, url, key);
  const guardados = await guardarProductosExtraidosOptimizado(productos, url, key, log);
  
  const result = { success: true, data: { productos_extraidos: productos.length, guardados, categorias_procesadas, errores, timestamp: new Date().toISOString() } };
  addToCache('scraping:latest', result, 300000);
  return jsonResponse(result, 200, corsHeaders, log.requestId);
}

async function handleComparacion(
  log: StructuredLog,
  url: string,
  key: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const cached = getFromCache<any>('comparison:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true }, 200, corsHeaders, log.requestId);

  const [pProv, pSist] = await Promise.all([fetchProductosProveedor(url, key), fetchProductosSistema(url, key)]);
  const matches = await performAdvancedMatching(pProv, pSist, log);
  const comparaciones = matches.map(m => { const c = calculateMatchConfidence(m); return generateComparacion(m, c); }).filter(c => c.confidence_score! > 30);
  
  await batchSaveComparisons(comparaciones, url, key, log);
  const result = { success: true, data: { comparaciones: comparaciones.length, oportunidades: comparaciones.filter(c => c.es_oportunidad_ahorro).length, top: comparaciones.slice(0, 50), timestamp: new Date().toISOString() } };
  addToCache('comparison:latest', result, 600000);
  return jsonResponse(result, 200, corsHeaders, log.requestId);
}

async function handleAlertas(
  log: StructuredLog,
  url: string,
  key: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const cached = getFromCache<any>('alerts:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true }, 200, corsHeaders, log.requestId);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [comparacionesRes, existentesRes] = await Promise.all([
    fetch(`${url}/rest/v1/comparacion_precios?select=*&fecha_comparacion=gte.${since}`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    }),
    fetch(`${url}/rest/v1/alertas_cambios_precios?select=producto_id&fecha_alerta=gte.${since}`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    })
  ]);

  const comparaciones = comparacionesRes.ok ? await comparacionesRes.json() : [];
  const existentes = existentesRes.ok ? await existentesRes.json() : [];
  const existingIds = new Set((existentes || []).map((a: any) => a.producto_id).filter(Boolean));

  const alertas = buildAlertasDesdeComparaciones(comparaciones, existingIds);

  const guardadas = await batchSaveAlerts(alertas, url, key, log);
  const result = {
    success: true,
    data: {
      alertas_generadas: guardadas,
      total_comparaciones: comparaciones.length,
      timestamp: new Date().toISOString()
    }
  };
  addToCache('alerts:latest', result, 300000);
  return jsonResponse(result, 200, corsHeaders, log.requestId);
}

async function handleStatus(
  log: StructuredLog,
  url: string,
  key: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const cached = getFromCache<any>('status:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true }, 200, corsHeaders, log.requestId);

  const cacheStats = getCacheStats();
  const breakers = Object.fromEntries(getCircuitBreakersSnapshot().map(([n, b]) => [n, { state: b.state, failures: b.failures }]));
  
  const result = {
    success: true, data: {
      estado: 'operativo', version: '2.0.0-modular',
      cache: cacheStats, circuit_breakers: breakers,
      metrics: PERFORMANCE_METRICS, timestamp: new Date().toISOString()
    }
  };
  addToCache('status:latest', result, 60000);
  return jsonResponse(result, 200, corsHeaders, log.requestId);
}

async function handleHealth(
  url: string,
  key: string,
  corsHeaders: Record<string, string>,
  requestId: string
): Promise<Response> {
  try {
    const res = await fetch(`${url}/rest/v1/precios_proveedor?select=count&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    return jsonResponse(
      { status: res.ok ? 'healthy' : 'degraded', db: res.ok, timestamp: new Date().toISOString() },
      200,
      corsHeaders,
      requestId
    );
  } catch {
    return jsonResponse(
      { status: 'unhealthy', db: false, timestamp: new Date().toISOString() },
      503,
      corsHeaders,
      requestId
    );
  }
}

// ============================================================================
// MAIN SERVER
// ============================================================================

Deno.serve(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const requestId = crypto.randomUUID();

  const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  const corsResult = validateOrigin(request, allowedOrigins, DEFAULT_CORS_HEADERS);
  const corsHeaders = { ...corsResult.headers, 'x-request-id': requestId };

  if (!corsResult.origin) {
    logger.warn('CORS_MISSING_ORIGIN', { endpoint, requestId });
    return createCorsErrorResponse(requestId, corsHeaders);
  }

  if (!corsResult.allowed) {
    return createCorsErrorResponse(requestId, corsHeaders);
  }

  const preflight = handleCors(request, corsHeaders);
  if (preflight) return preflight;

  const authResult = validateApiSecret(request);
  if (!authResult.valid) {
    logger.warn('AUTH_FAILED', { endpoint, requestId });
    return jsonResponse({ error: authResult.error || 'Unauthorized' }, 401, corsHeaders, requestId);
  }

  const endpoint = url.pathname.split('/').filter(Boolean).pop() || '';
  const log: StructuredLog = { requestId, endpoint, method: request.method, timestamp: new Date().toISOString() };


  logger.info('REQUEST_START', log);
  PERFORMANCE_METRICS.requestMetrics.total++;

  // Rate limiting
  const clientId = request.headers.get('x-client-id') || 'anonymous';
  if (!rateLimiter.tryAcquire(clientId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders, requestId);
  }

  // Circuit breaker
  const breaker = getCircuitBreaker('scraper-main', MAXICONSUMO_BREAKER_OPTIONS);
  if (!breaker.allowRequest()) {
    return jsonResponse({ error: 'Service temporarily unavailable' }, 503, corsHeaders, requestId);
  }

  try {
    const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
    const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');

    let response: Response;
    switch (endpoint) {
      case 'scraping': case 'scrape': response = await handleScraping(log, supabaseUrl, serviceRoleKey, corsHeaders); break;
      case 'comparacion': case 'compare': response = await handleComparacion(log, supabaseUrl, serviceRoleKey, corsHeaders); break;
      case 'alertas': case 'alerts': response = await handleAlertas(log, supabaseUrl, serviceRoleKey, corsHeaders); break;
      case 'status': response = await handleStatus(log, supabaseUrl, serviceRoleKey, corsHeaders); break;
      case 'health': response = await handleHealth(supabaseUrl, serviceRoleKey, corsHeaders, requestId); break;
      default: response = jsonResponse({ error: 'Unknown endpoint', available: ['scraping', 'comparacion', 'alertas', 'status', 'health'] }, 404, corsHeaders, requestId);
    }

    breaker.recordSuccess();
    PERFORMANCE_METRICS.requestMetrics.successful++;
    return response;
  } catch (e) {
    breaker.recordFailure();
    PERFORMANCE_METRICS.requestMetrics.failed++;
    logger.error('ERROR', { ...log, error: (e as Error).message });
    return jsonResponse({ error: (e as Error).message }, 500, corsHeaders, requestId);
  }
});
