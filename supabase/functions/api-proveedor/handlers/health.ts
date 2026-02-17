import { formatUptime } from '../utils/format.ts';
import {
    calculateOverallHealthScore,
    calculateSystemUptime,
    determineSystemStatus
} from '../utils/metrics.ts';
import {
    buildRealtimeMetrics,
    checkAPIPerformance,
    checkCacheHealth,
    checkDatabaseHealth,
    checkExternalDependencies,
    checkMemoryHealth,
    checkScraperHealth,
    generateHealthAlerts,
    generateHealthRecommendations
} from '../utils/health.ts';
import { createLogger } from '../../_shared/logger.ts';
import { ok, fail } from '../../_shared/response.ts';

const logger = createLogger('api-proveedor:health');

export async function getHealthCheckOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    apiSecret: string | null,
    corsHeaders: Record<string, string>,
    requestLog: any
): Promise<Response> {
    logger.info('HEALTH_REQUEST', { ...requestLog });

    try {
        const healthChecks = await Promise.allSettled([
            checkDatabaseHealth(supabaseUrl, supabaseReadHeaders),
            checkScraperHealth(supabaseUrl, apiSecret, requestLog.requestId),
            Promise.resolve(checkCacheHealth()),
            Promise.resolve(checkMemoryHealth()),
            Promise.resolve(checkAPIPerformance()),
            checkExternalDependencies(supabaseUrl, supabaseReadHeaders, apiSecret, requestLog.requestId)
        ]);

        const [dbHealth, scraperHealth, cacheHealth, memHealth, apiPerf, extDeps] = healthChecks;

        const healthComponents = {
            database: dbHealth.status === 'fulfilled' ? dbHealth.value : { status: 'unhealthy', score: 0 },
            scraper: scraperHealth.status === 'fulfilled' ? scraperHealth.value : { status: 'unhealthy', score: 0 },
            cache: cacheHealth.status === 'fulfilled' ? cacheHealth.value : { status: 'healthy', score: 100 },
            memory: memHealth.status === 'fulfilled' ? memHealth.value : { status: 'healthy', score: 100 },
            api_performance: apiPerf.status === 'fulfilled' ? apiPerf.value : { status: 'healthy', score: 100 },
            external_deps: extDeps.status === 'fulfilled' ? extDeps.value : { status: 'unknown', score: 50 }
        };

        const overallHealthScore = calculateOverallHealthScore(healthComponents);
        const systemStatus = determineSystemStatus(overallHealthScore, healthComponents);

        const data = {
            status: systemStatus.status,
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: calculateSystemUptime(),
                human_readable: formatUptime(calculateSystemUptime())
            },
            health_score: overallHealthScore,
            components: healthComponents,
            metrics: buildRealtimeMetrics(),
            alerts: generateHealthAlerts(healthComponents, overallHealthScore),
            recommendations: generateHealthRecommendations(healthComponents, overallHealthScore),
            version: '2.0.0',
            environment: Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development'
        };

        logger.info('HEALTH_SUCCESS', {
            ...requestLog,
            score: overallHealthScore,
            status: systemStatus.status
        });

        return ok(data, 200, corsHeaders, { requestId: requestLog.requestId });
    } catch (error) {
        logger.error('HEALTH_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        return fail(
            'HEALTH_CHECK_FAILED',
            'No se pudo obtener el estado del proveedor',
            503,
            corsHeaders,
            {
                requestId: requestLog.requestId,
                details: {
                    error: (error as Error).message,
                    timestamp: new Date().toISOString()
                }
            }
        );
    }
}
