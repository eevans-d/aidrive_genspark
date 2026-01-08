import { API_CACHE } from '../utils/cache.ts';
import { fetchWithTimeout } from '../utils/http.ts';
import {
    REQUEST_METRICS,
    assessSystemHealth,
    calculatePerformanceScore,
    calculateSystemUptime
} from '../utils/metrics.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('api-proveedor:status');

export async function getEstadoSistemaOptimizado(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: URL,
    corsHeaders: Record<string, string>,
    requestLog: any
): Promise<Response> {
    logger.info('STATUS_REQUEST', { ...requestLog });

    try {
        const statusPromises = await Promise.allSettled([
            fetchWithTimeout(
                `${supabaseUrl}/rest/v1/estadisticas_scraping?select=*&order=created_at.desc&limit=1`,
                { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
                5000
            ),
            fetchWithTimeout(
                `${supabaseUrl}/rest/v1/precios_proveedor?select=count&fuente=eq.Maxiconsumo Necochea&activo=eq.true`,
                { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
                3000
            ),
            fetchWithTimeout(
                `${supabaseUrl}/rest/v1/vista_oportunidades_ahorro?select=count`,
                { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
                3000
            ),
            fetchWithTimeout(
                `${supabaseUrl}/rest/v1/configuracion_proveedor?select=*&nombre=eq.Maxiconsumo Necochea`,
                { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
                3000
            ),
            fetchWithTimeout(
                `${supabaseUrl}/functions/v1/scraper-maxiconsumo/health`,
                { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
                5000
            )
        ]);

        const [statsRes, productosRes, oportunidadesRes, configRes, scraperHealthRes] = statusPromises;

        const ultimaEstadistica = statsRes.status === 'fulfilled' && statsRes.value.ok ? (await statsRes.value.json())[0] : null;
        const totalProductos =
            productosRes.status === 'fulfilled' && productosRes.value.ok ? (await productosRes.value.json())[0]?.count || 0 : 0;
        const totalOportunidades =
            oportunidadesRes.status === 'fulfilled' && oportunidadesRes.value.ok
                ? (await oportunidadesRes.value.json())[0]?.count || 0
                : 0;
        const configuracion = configRes.status === 'fulfilled' && configRes.value.ok
            ? (await configRes.value.json())[0] || null
            : null;
        const scraperHealth = scraperHealthRes.status === 'fulfilled' && scraperHealthRes.value.ok
            ? await scraperHealthRes.value.json()
            : { status: 'unknown' };

        const uptime = calculateSystemUptime();
        const performanceScore = calculatePerformanceScore(REQUEST_METRICS);
        const systemHealth = assessSystemHealth({
            scraper: scraperHealth,
            database: totalProductos > 0,
            cache: API_CACHE.size > 0,
            opportunities: totalOportunidades
        });

        const resultado = {
            success: true,
            data: {
                sistema: {
                    estado: systemHealth.overall === 'healthy' ? 'operativo' : 'degradado',
                    version: '2.0.0',
                    proveedor: 'Maxiconsumo Necochea',
                    uptime_seconds: uptime,
                    health_score: systemHealth.score,
                    environment: Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development'
                },
                estadisticas: {
                    ultima_ejecucion: ultimaEstadistica?.created_at || 'Nunca',
                    productos_totales: totalProductos,
                    oportunidades_activas: totalOportunidades,
                    ultima_sincronizacion: configuracion?.ultima_sincronizacion || 'Nunca',
                    proximo_scrape_programado: calcularProximoScrape(configuracion),
                    productos_nuevos_24h: ultimaEstadistica?.productos_nuevos || 0,
                    tasa_exito_24h: ultimaEstadistica?.tasa_exito || 0
                },
                configuracion: {
                    ...configuracion,
                    cache_stats: {
                        entries: API_CACHE.size,
                        hit_rate: ((REQUEST_METRICS.cacheHits / Math.max(REQUEST_METRICS.total, 1)) * 100).toFixed(2)
                    }
                },
                health_checks: {
                    database: totalProductos > 0 ? 'healthy' : 'unhealthy',
                    scraper: scraperHealth.status || 'unknown',
                    cache: API_CACHE.size >= 0 ? 'healthy' : 'unhealthy',
                    rate_limiter: 'healthy'
                },
                performance: {
                    api_metrics: {
                        total_requests: REQUEST_METRICS.total,
                        success_rate: ((REQUEST_METRICS.success / Math.max(REQUEST_METRICS.total, 1)) * 100).toFixed(2),
                        avg_response_time: Math.round(REQUEST_METRICS.averageResponseTime),
                        cache_hit_rate: ((REQUEST_METRICS.cacheHits / Math.max(REQUEST_METRICS.total, 1)) * 100).toFixed(2)
                    },
                    score: performanceScore
                },
                endpoints_disponibles: [
                    'GET /proveedor/precios',
                    'GET /proveedor/productos',
                    'GET /proveedor/comparacion',
                    'POST /proveedor/sincronizar',
                    'GET /proveedor/status',
                    'GET /proveedor/alertas',
                    'GET /proveedor/estadisticas',
                    'GET /proveedor/configuracion',
                    'GET /proveedor/health'
                ],
                timestamp: new Date().toISOString()
            }
        };

        logger.info('STATUS_SUCCESS', {
            ...requestLog,
            health_score: systemHealth.score,
            productos: totalProductos
        });

        return new Response(JSON.stringify(resultado), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        logger.error('STATUS_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw new Error(`Error obteniendo estado del sistema optimizado: ${(error as Error).message}`);
    }
}

function calcularProximoScrape(configuracion: any): string {
    if (!configuracion?.proxima_sincronizacion) {
        const proximo = new Date();
        proximo.setHours(proximo.getHours() + 6);
        return proximo.toISOString();
    }

    return configuracion.proxima_sincronizacion;
}
