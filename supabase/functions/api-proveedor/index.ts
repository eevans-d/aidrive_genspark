/**
 * API proveedor modularizada: orquesta routing, CORS, rate limiting y circuit breaker.
 *
 * ## Autenticación
 * Esta API usa autenticación mediante shared secret, enviado en el header `x-api-secret`.
 * El valor debe coincidir con la variable de entorno `API_PROVEEDOR_SECRET`.
 *
 * ## Cómo consumir desde api-minimarket (gateway)
 * Las llamadas server-to-server no requieren CORS. Ejemplo de fetch interno:
 * ```ts
 * const proveedorSecret = Deno.env.get('API_PROVEEDOR_SECRET');
 * const response = await fetch(`${supabaseUrl}/functions/v1/api-proveedor/precios`, {
 *   method: 'GET',
 *   headers: {
 *     'x-api-secret': proveedorSecret,
 *     'Content-Type': 'application/json',
 *     'x-request-id': requestId, // propagate for tracing
 *   },
 * });
 * ```
 *
 * ## Formato de respuestas
 * Todas las respuestas siguen el formato estándar:
 * - Éxito: { success: true, data: ..., requestId: string }
 * - Error: { success: false, error: { code, message, details? }, requestId: string }
 */

import { FixedWindowRateLimiter } from '../_shared/rate-limit.ts';
import { getCircuitBreaker } from '../_shared/circuit-breaker.ts';
import { createLogger } from '../_shared/logger.ts';
import { toAppError, isAppError } from '../_shared/errors.ts';
import { fail } from '../_shared/response.ts';
import { parseAllowedOrigins, validateOrigin, handleCors, createCorsErrorResponse } from '../_shared/cors.ts';
import { EndpointContext, EndpointHandlerMap, routeRequest } from './router.ts';
import { EndpointName, endpointSchemas, isEndpointName } from './schemas.ts';
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
import {
    validateApiSecret,
    validateInternalOrigin,
    createAuthErrorResponse,
    buildSupabaseReadHeaders,
    parseReadAuthMode
} from './utils/auth.ts';

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
                ctx.supabaseReadHeaders,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        productos: (ctx) =>
            getProductosDisponiblesOptimizado(
                ctx.supabaseUrl,
                ctx.supabaseReadHeaders,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        comparacion: (ctx) =>
            getComparacionConSistemaOptimizado(
                ctx.supabaseUrl,
                ctx.supabaseReadHeaders,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        sincronizar: (ctx) =>
            triggerSincronizacionOptimizado(
                ctx.supabaseUrl,
                ctx.serviceRoleKey,
                ctx.supabaseReadHeaders,
                ctx.apiSecret,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog,
                ctx.request
            ),
        status: (ctx) =>
            getEstadoSistemaOptimizado(
                ctx.supabaseUrl,
                ctx.supabaseReadHeaders,
                ctx.apiSecret,
                ctx.url,
                ctx.corsHeaders,
                ctx.requestLog
            ),
        alertas: (ctx) =>
            getAlertasActivasOptimizado(
                ctx.supabaseUrl,
                ctx.supabaseReadHeaders,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        estadisticas: (ctx) =>
            getEstadisticasScrapingOptimizado(
                ctx.supabaseUrl,
                ctx.supabaseReadHeaders,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog
            ),
        configuracion: (ctx) =>
            getConfiguracionProveedorOptimizado(
                ctx.supabaseUrl,
                ctx.supabaseReadHeaders,
                ctx.url,
                ctx.corsHeaders,
                ctx.isAuthenticated,
                ctx.requestLog,
                ctx.request
            ),
        health: (ctx) =>
            getHealthCheckOptimizado(
                ctx.supabaseUrl,
                ctx.supabaseReadHeaders,
                ctx.apiSecret,
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
        throw toAppError(
            new Error('Variables de entorno faltantes: SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY'),
            'CONFIG_MISSING',
            500
        );
    }

    const authHeader = request.headers.get('authorization');
    const readAuthMode = parseReadAuthMode(Deno.env.get('API_PROVEEDOR_READ_MODE'));
    const readAuth = buildSupabaseReadHeaders({
        anonKey: supabaseAnonKey,
        serviceRoleKey,
        authHeader,
        readMode: readAuthMode
    });
    const apiSecret = Deno.env.get('API_PROVEEDOR_SECRET');

    return {
        supabaseUrl,
        supabaseAnonKey,
        serviceRoleKey,
        supabaseReadHeaders: readAuth.headers,
        apiSecret: apiSecret ?? null,
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
    corsHeaders: Record<string, string>,
    requestId: string
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
        const retryAfterMs = Math.max(rate.resetAt - Date.now(), 0);
        return fail(
            'RATE_LIMIT_EXCEEDED',
            'Límite de peticiones excedido',
            429,
            corsHeaders,
            { requestId, extra: { retry_after_ms: retryAfterMs } }
        );
    }

    return null;
}

Deno.serve(async (request: Request): Promise<Response> => {
    const start = performance.now();
    const url = new URL(request.url);
    const requestId = request.headers.get('x-request-id') ||
        crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
    const corsOverrides = {
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret, x-request-id'
    };
    const corsResult = validateOrigin(request, allowedOrigins, corsOverrides);
    const corsHeaders = { ...corsResult.headers, 'x-request-id': requestId };

    // Requiere encabezado Origin para evitar fallback permisivo
    if (!corsResult.origin) {
        logger.warn('CORS_MISSING_ORIGIN', { path: url.pathname, requestId });
        return createCorsErrorResponse(requestId, corsHeaders);
    }

    if (!corsResult.allowed) {
        logger.warn('CORS_BLOCKED', { path: url.pathname, origin: corsResult.origin, requestId });
        return createCorsErrorResponse(requestId, corsHeaders);
    }

    const preflight = handleCors(request, corsHeaders);
    if (preflight) {
        return preflight;
    }

    const endpointRaw = getEndpointFromPath(url.pathname);
    if (!isEndpointName(endpointRaw)) {
        return fail(
            'ENDPOINT_NOT_FOUND',
            `Endpoint no soportado: ${endpointRaw}`,
            404,
            corsHeaders,
            { requestId }
        );
    }

    const requestLog = {
        endpoint: endpointRaw,
        method: request.method,
        path: url.pathname,
        requestId,
        timestamp: new Date().toISOString()
    };

    const schema = endpointSchemas[endpointRaw];
    const requiresAuth = schema?.requiresAuth ?? true;
    const authResult = validateApiSecret(request);
    const isAuthenticated = authResult.valid;

    if (requiresAuth && !isAuthenticated) {
        logger.warn('AUTH_FAILED', { ...requestLog, requestId, endpoint: endpointRaw });
        return createAuthErrorResponse(authResult.error || 'Unauthorized', corsHeaders, requestId);
    }

    // Validar origen interno (advertencia, no bloqueo)
    const originCheck = validateInternalOrigin(request);
    if (originCheck.warning) {
        logger.warn('INTERNAL_API_ORIGIN_WARNING', { ...requestLog, warning: originCheck.warning });
    }

    const rateLimited = rateLimitRequest(endpointRaw, request, corsHeaders, requestId);
    if (rateLimited) {
        return rateLimited;
    }

    if (!circuitBreaker.allowRequest()) {
        logger.warn('Circuit breaker open', { requestId });
        return fail('CIRCUIT_OPEN', 'Circuit breaker abierto', 503, corsHeaders, { requestId });
    }

    try {
        const context = buildContext(request, requestLog, corsHeaders);
        context.isAuthenticated = isAuthenticated;
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

        return fail(
            appError.code,
            appError.message,
            appError.status,
            corsHeaders,
            { requestId, extra: { retryable } }
        );
    }
});
