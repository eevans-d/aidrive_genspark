import { getCircuitBreaker } from '../../_shared/circuit-breaker.ts';
import { CIRCUIT_BREAKER_OPTIONS } from '../utils/constants.ts';
import { addToAPICache, IN_MEMORY_CACHE_TTL_MS, PERSISTENT_CACHE_TTL_SECONDS, invalidateRelatedCaches } from '../utils/cache.ts';
import { fetchWithRetry } from '../utils/http.ts';
import { validateSincronizacionParams } from '../validators.ts';
import { getPreciosActualesOptimizado } from './precios.ts';
import { getProductosDisponiblesOptimizado } from './productos.ts';
import { createLogger } from '../../_shared/logger.ts';
import { validateApiSecret, createAuthErrorResponse } from '../utils/auth.ts';
import { ok } from '../../_shared/response.ts';

const logger = createLogger('api-proveedor:sincronizar');

export async function triggerSincronizacionOptimizado(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any,
    request: Request
): Promise<Response> {
    const authResult = validateApiSecret(request);
    if (!authResult.valid) {
        logger.warn('SINCRONIZACION_AUTH_FAILED', { ...requestLog, error: authResult.error });
        return createAuthErrorResponse(authResult.error || 'Auth failed', corsHeaders, requestLog.requestId);
    }

    const { categoria, forceFull, priority } = validateSincronizacionParams(url);

    logger.info('SINCRONIZACION_REQUEST', {
        ...requestLog,
        categoria,
        force_full: forceFull,
        priority
    });

    try {
        const circuitKey = 'scraper-maxiconsumo';
        const circuitBreaker = getCircuitBreaker(circuitKey, CIRCUIT_BREAKER_OPTIONS);

        if (!circuitBreaker.allowRequest()) {
            throw new Error('Servicio de scraping temporalmente no disponible (circuit breaker abierto)');
        }

        const scrapingUrl = `${supabaseUrl}/functions/v1/scraper-maxiconsumo/scrape`;
        const requestBody = {
            trigger_type: 'manual',
            force_full: forceFull,
            categoria,
            priority,
            initiated_by: 'api_proveedor_manual',
            request_id: requestLog.requestId,
            timestamp: new Date().toISOString()
        };

        const scrapingResponse = await fetchWithRetry(
            scrapingUrl,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestLog.requestId
                },
                body: JSON.stringify(requestBody)
            },
            3,
            1000
        );

        if (!scrapingResponse.ok) {
            circuitBreaker.recordFailure();
            throw new Error(`Error en sincronización: ${scrapingResponse.statusText}`);
        }

        circuitBreaker.recordSuccess();

        const resultadoScraping = await scrapingResponse.json();

        if (resultadoScraping.success) {
            await persistProveedorSnapshots(supabaseUrl, serviceRoleKey, url, corsHeaders, requestLog);
        }

        let resultadoComparacion = null;
        if (resultadoScraping.success) {
            try {
                const comparacionUrl = `${supabaseUrl}/functions/v1/scraper-maxiconsumo/compare`;
                const comparacionResponse = await fetchWithRetry(
                    comparacionUrl,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json',
                            'X-Request-ID': requestLog.requestId
                        },
                        body: JSON.stringify({
                            request_id: requestLog.requestId,
                            timestamp: new Date().toISOString()
                        })
                    },
                    2,
                    2000
                );

                if (comparacionResponse.ok) {
                    resultadoComparacion = await comparacionResponse.json();
                }
            } catch (error) {
                logger.warn('COMPARACION_WARNING', {
                    ...requestLog,
                    error: (error as Error).message
                });
            }
        }

        const syncMetrics = {
            duracion_total: Date.now() - new Date(requestLog.timestamp).getTime(),
            productos_procesados: resultadoScraping.data?.productos_procesados || 0,
            comparaciones_generadas:
                resultadoComparacion?.success ? resultadoComparacion.data?.oportunidades_encontradas || 0 : 0,
            cache_invalidations: await invalidateRelatedCaches(categoria),
            priority_level: priority
        };

        const data = {
            sincronizacion: {
                ...resultadoScraping,
                metrics: syncMetrics
            },
            comparacion_generada: resultadoComparacion,
            parametros: {
                categoria,
                force_full: forceFull,
                priority,
                request_id: requestLog.requestId
            },
            estado_circuit_breaker: { state: circuitBreaker.getState() },
            timestamp: new Date().toISOString()
        };

        logger.info('SINCRONIZACION_SUCCESS', {
            ...requestLog,
            productos: syncMetrics.productos_procesados,
            duracion: syncMetrics.duracion_total
        });

        return ok(data, 200, corsHeaders, { requestId: requestLog.requestId });
    } catch (error) {
        logger.error('SINCRONIZACION_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw new Error(`Error en sincronización optimizado: ${(error as Error).message}`);
    }
}

async function persistProveedorSnapshots(
    supabaseUrl: string,
    serviceRoleKey: string,
    baseUrl: URL,
    corsHeaders: Record<string, string>,
    requestLog: any
): Promise<void> {
    const snapshotTargets = [
        { endpoint: 'precios', handler: getPreciosActualesOptimizado },
        { endpoint: 'productos', handler: getProductosDisponiblesOptimizado }
    ];

    for (const target of snapshotTargets) {
        try {
            const snapshotUrl = new URL(baseUrl.toString());
            snapshotUrl.pathname = snapshotUrl.pathname.replace(/\/sincronizar\/?$/, `/${target.endpoint}`);
            snapshotUrl.search = '';

            const response = await target.handler(
                supabaseUrl,
                serviceRoleKey,
                snapshotUrl,
                corsHeaders,
                true,
                requestLog
            );

            if (!response.ok) continue;

            const payload = await response.json();
            const cacheKey = `${target.endpoint}:${snapshotUrl.searchParams.toString()}`;
            const ttlMs = IN_MEMORY_CACHE_TTL_MS[target.endpoint] || 60000;
            const ttlSeconds = PERSISTENT_CACHE_TTL_SECONDS[target.endpoint] || Math.ceil(ttlMs / 1000);

            await addToAPICache(cacheKey, payload, ttlMs, {
                supabaseUrl,
                serviceRoleKey,
                ttlSeconds,
                forcePersistent: true,
                logMeta: { ...requestLog, endpoint: target.endpoint }
            });
        } catch (error) {
            logger.warn('SNAPSHOT_WARNING', {
                ...requestLog,
                endpoint: target.endpoint,
                error: (error as Error).message
            });
        }
    }
}
