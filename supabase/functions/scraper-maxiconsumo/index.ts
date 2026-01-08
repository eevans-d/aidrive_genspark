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

const logger = createLogger('scraper-maxiconsumo:index');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handleScraping(log: StructuredLog, url: string, key: string): Promise<Response> {
  const cached = getFromCache<any>('scraping:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true });

  const { productos, categorias_procesadas, errores } = await ejecutarScrapingCompleto(log, url, key);
  const guardados = await guardarProductosExtraidosOptimizado(productos, url, key, log);
  
  const result = { success: true, data: { productos_extraidos: productos.length, guardados, categorias_procesadas, errores, timestamp: new Date().toISOString() } };
  addToCache('scraping:latest', result, 300000);
  return jsonResponse(result);
}

async function handleComparacion(log: StructuredLog, url: string, key: string): Promise<Response> {
  const cached = getFromCache<any>('comparison:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true });

  const [pProv, pSist] = await Promise.all([fetchProductosProveedor(url, key), fetchProductosSistema(url, key)]);
  const matches = await performAdvancedMatching(pProv, pSist, log);
  const comparaciones = matches.map(m => { const c = calculateMatchConfidence(m); return generateComparacion(m, c); }).filter(c => c.confidence_score! > 30);
  
  await batchSaveComparisons(comparaciones, url, key, log);
  const result = { success: true, data: { comparaciones: comparaciones.length, oportunidades: comparaciones.filter(c => c.es_oportunidad_ahorro).length, top: comparaciones.slice(0, 50), timestamp: new Date().toISOString() } };
  addToCache('comparison:latest', result, 600000);
  return jsonResponse(result);
}

async function handleAlertas(log: StructuredLog, url: string, key: string): Promise<Response> {
  const cached = getFromCache<any>('alerts:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true });

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
  return jsonResponse(result);
}

async function handleStatus(log: StructuredLog, url: string, key: string): Promise<Response> {
  const cached = getFromCache<any>('status:latest');
  if (cached) return jsonResponse({ ...cached, fromCache: true });

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
  return jsonResponse(result);
}

async function handleHealth(url: string, key: string): Promise<Response> {
  try {
    const res = await fetch(`${url}/rest/v1/precios_proveedor?select=count&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    return jsonResponse({ status: res.ok ? 'healthy' : 'degraded', db: res.ok, timestamp: new Date().toISOString() });
  } catch {
    return jsonResponse({ status: 'unhealthy', db: false, timestamp: new Date().toISOString() }, 503);
  }
}

// ============================================================================
// MAIN SERVER
// ============================================================================

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(request.url);
  const endpoint = url.pathname.split('/').filter(Boolean).pop() || '';
  const requestId = crypto.randomUUID();
  const log: StructuredLog = { requestId, endpoint, method: request.method, timestamp: new Date().toISOString() };


  logger.info('REQUEST_START', log);
  PERFORMANCE_METRICS.requestMetrics.total++;

  // Rate limiting
  const clientId = request.headers.get('x-client-id') || 'anonymous';
  if (!rateLimiter.tryAcquire(clientId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  // Circuit breaker
  const breaker = getCircuitBreaker('scraper-main', MAXICONSUMO_BREAKER_OPTIONS);
  if (!breaker.allowRequest()) {
    return jsonResponse({ error: 'Service temporarily unavailable' }, 503);
  }

  try {
    const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
    const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');

    let response: Response;
    switch (endpoint) {
      case 'scraping': case 'scrape': response = await handleScraping(log, supabaseUrl, serviceRoleKey); break;
      case 'comparacion': case 'compare': response = await handleComparacion(log, supabaseUrl, serviceRoleKey); break;
      case 'alertas': case 'alerts': response = await handleAlertas(log, supabaseUrl, serviceRoleKey); break;
      case 'status': response = await handleStatus(log, supabaseUrl, serviceRoleKey); break;
      case 'health': response = await handleHealth(supabaseUrl, serviceRoleKey); break;
      default: response = jsonResponse({ error: 'Unknown endpoint', available: ['scraping', 'comparacion', 'alertas', 'status', 'health'] }, 404);
    }

    breaker.recordSuccess();
    PERFORMANCE_METRICS.requestMetrics.successful++;
    return response;
  } catch (e) {
    breaker.recordFailure();
    PERFORMANCE_METRICS.requestMetrics.failed++;
    logger.error('ERROR', { ...log, error: (e as Error).message });
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
