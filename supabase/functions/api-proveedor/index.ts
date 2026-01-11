/**
 * API proveedor modularizada: orquesta routing, CORS, rate limiting y circuit breaker.
 */

import { FixedWindowRateLimiter } from '../_shared/rate-limit.ts';
import { getCircuitBreaker } from '../_shared/circuit-breaker.ts';
import { createLogger } from '../_shared/logger.ts';
import { toAppError, isAppError } from '../_shared/errors.ts';
import { fail } from '../_shared/response.ts';
import { parseAllowedOrigins, validateOrigin, handleCors, createCorsErrorResponse } from '../_shared/cors.ts';
import { EndpointContext, EndpointHandlerMap, routeRequest } from './router.ts';
import { EndpointName, isEndpointName } from './schemas.ts';
import { getAlertasActivasOptimizado } from './handlers/alertas.ts';
import { getComparacionConSistemaOptimizado } from './handlers/comparacion.ts';
import { getConfiguracionProveedorOptimizado } from './handlers/configuracion.ts';
import { getHealthCheckOptimizado } from './handlers/health.ts';
import { getEstadisticasScrapingOptimizado } from './handlers/estadisticas.ts';
import { getPreciosActualesOptimizado } from './handlers/precios.ts';
import { getProductosDisponiblesOptimizado } from './handlers/productos.ts';
import { triggerSincronizacionOptimizado } from './handlers/sincronizar.ts';
import { getEstadoSistemaOptimizado } from './handlers/status.ts';
import { CIRCUIT_BREAKER_OPTIONS } from './utils/constants.ts';
import { isRetryableAPIError } from './utils/http.ts';
import { updateRequestMetrics } from './utils/metrics.ts';

const logger = createLogger('api-proveedor');

const circuitBreaker = getCircuitBreaker('api-proveedor', CIRCUIT_BREAKER_OPTIONS);
const RATE_LIMITERS = new Map<string, FixedWindowRateLimiter>();
const HANDLERS = buildHandlerMap();

function getRateLimiter(key: string): FixedWindowRateLimiter {
    const existing = RATE_LIMITERS.get(key);
    if (existing) return existing;
    const limiter = new FixedWindowRateLimiter(120, 60_000);
    RATE_LIMITERS.set(key, limiter);
    return limiter;
}

function getEndpointFromPath(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
}

function buildHandlerMap(): EndpointHandlerMap {
    const map: EndpointHandlerMap = {
        precios: (ctx) =>
            getPreciosActualesOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        productos: (ctx) =>
            getProductosDisponiblesOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        comparacion: (ctx) =>
            getComparacionConSistemaOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        sincronizar: (ctx) =>
            triggerSincronizacionOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog,
                ctx.request
            ),
        status: (ctx) =>
            getEstadoSistemaOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.requestLog
            ),
        alertas: (ctx) =>
            getAlertasActivasOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        estadisticas: (ctx) =>
            getEstadisticasScrapingOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        configuracion: (ctx) =>
            getConfiguracionProveedorOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog,
                ctx.request
            ),
        health: (ctx) =>
            getHealthCheckOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.corsHeaders,
                ctx.requestLog
            )
    };

    return map;
}

function buildContext(
    request: Request,
    requestLog: Record<string, unknown>,
    corsHeaders: Record<string, string>
): EndpointContext {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Variables de entorno faltantes: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    }

    return {
        supabaseUrl,
        serviceRoleKey,
        url: new URL(request.url),
        corsHeaders,
        isAuthenticated: Boolean(request.headers.get('authorization')),
        requestLog,
        method: request.method,
        request
    };
}

function rateLimitRequest(
    endpoint: EndpointName,
    request: Request,
    corsHeaders: Record<string, string>
): Response | null {
    const clientId =
        request.headers.get('x-client-id') ||
        request.headers.get('x-user-id') ||
        request.headers.get('authorization') ||
        'anonymous';
    const limiterKey = `${endpoint}:${clientId}`;
    const limiter = getRateLimiter(limiterKey);
    const rate = limiter.check(limiterKey);

    if (!rate.allowed) {
        const body = {
            error: 'Rate limit exceeded',
            retry_after_ms: Math.max(rate.resetAt - Date.now(), 0)
        };
        return new Response(JSON.stringify(body), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return null;
}

Deno.serve(async (request: Request): Promise<Response> => {
    const start = performance.now();
    const url = new URL(request.url);

    const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
    const corsOverrides = {
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret'
    };
    const corsResult = validateOrigin(request, allowedOrigins, corsOverrides);
    const corsHeaders = corsResult.headers;

    if (!corsResult.allowed) {
        logger.warn('CORS_BLOCKED', { path: url.pathname, origin: corsResult.origin });
        return createCorsErrorResponse(undefined, corsHeaders);
    }

    const preflight = handleCors(request, corsHeaders);
    if (preflight) {
        return preflight;
    }

    const endpointRaw = getEndpointFromPath(url.pathname);
    if (!isEndpointName(endpointRaw)) {
        return new Response(JSON.stringify({ error: 'Endpoint no soportado' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const requestLog = {
        endpoint: endpointRaw,
        method: request.method,
        path: url.pathname,
        requestId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    };

    const rateLimited = rateLimitRequest(endpointRaw, request, corsHeaders);
    if (rateLimited) {
        return rateLimited;
    }

    if (!circuitBreaker.allowRequest()) {
        logger.warn('Circuit breaker open', { requestId: requestLog.requestId });
        return fail('CIRCUIT_OPEN', 'Circuit breaker abierto', 503, undefined, corsHeaders);
    }

    try {
        const context = buildContext(request, requestLog, corsHeaders);
        const response = await routeRequest(endpointRaw, context, HANDLERS);
        circuitBreaker.recordSuccess();
        updateRequestMetrics(true, performance.now() - start);
        logger.info('Request completed', { ...requestLog, durationMs: performance.now() - start });
        return response;
    } catch (error) {
        circuitBreaker.recordFailure();
        updateRequestMetrics(false, performance.now() - start);

        const appError = toAppError(error);
        const retryable = isRetryableAPIError(appError);
        logger.error('Request failed', { ...requestLog, error: appError.message, code: appError.code, retryable });

        return fail(appError.code, appError.message, appError.status, { retryable }, corsHeaders);
    }
});
