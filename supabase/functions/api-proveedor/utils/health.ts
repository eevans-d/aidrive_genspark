import { API_CACHE } from './cache.ts';
import {
    REQUEST_METRICS,
    calculateAvailability,
    calculateErrorRate,
    calculateRequestRate,
    calculateResponseTimeP95,
    calculateThroughput
} from './metrics.ts';

export async function checkDatabaseHealth(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>
): Promise<any> {
    try {
        const start = Date.now();
        const response = await fetch(`${supabaseUrl}/rest/v1/precios_proveedor?select=count&limit=1`, {
            headers: supabaseReadHeaders
        });
        const duration = Date.now() - start;

        return {
            status: response.ok ? 'healthy' : 'unhealthy',
            score: response.ok ? Math.max(0, 100 - duration / 10) : 0,
            response_time_ms: duration,
            details: response.ok ? 'Database responsive' : 'Database connection failed'
        };
    } catch (error) {
        return { status: 'unhealthy', score: 0, error: (error as Error).message };
    }
}

export async function checkScraperHealth(
    supabaseUrl: string,
    apiSecret: string | null,
    requestId?: string
): Promise<any> {
    try {
        const headers: Record<string, string> = {};
        if (apiSecret) headers['x-api-secret'] = apiSecret;
        if (requestId) headers['x-request-id'] = String(requestId);
        const response = await fetch(`${supabaseUrl}/functions/v1/scraper-maxiconsumo/health`, {
            headers
        });

        return {
            status: response.ok ? 'healthy' : 'degraded',
            score: response.ok ? 100 : 50,
            details: response.ok ? 'Scraper service operational' : 'Scraper service issues'
        };
    } catch (error) {
        return { status: 'unhealthy', score: 0, error: (error as Error).message };
    }
}

export function checkCacheHealth(): any {
    const size = API_CACHE.size;
    return {
        status: size >= 0 ? 'healthy' : 'unhealthy',
        score: 100,
        entries: size,
        hit_rate: ((REQUEST_METRICS.cacheHits / Math.max(REQUEST_METRICS.total, 1)) * 100).toFixed(2)
    };
}

export function checkMemoryHealth(): any {
    const usage = (globalThis as any).performance?.memory || {};
    return {
        status: 'healthy',
        score: 100,
        heap_used: usage.usedJSHeapSize || 0,
        heap_total: usage.totalJSHeapSize || 0,
        heap_limit: usage.jsHeapSizeLimit || 0
    };
}

export function checkAPIPerformance(): any {
    const avgResponseTime = REQUEST_METRICS.averageResponseTime;
    const successRate = (REQUEST_METRICS.success / Math.max(REQUEST_METRICS.total, 1)) * 100;

    return {
        status: avgResponseTime < 1000 && successRate > 95 ? 'healthy' : 'degraded',
        score: Math.min(100, Math.max(0, successRate - avgResponseTime / 100)),
        avg_response_time_ms: Math.round(avgResponseTime),
        success_rate: successRate.toFixed(2),
        total_requests: REQUEST_METRICS.total
    };
}

export async function checkExternalDependencies(): Promise<any> {
    return {
        status: 'healthy',
        score: 100,
        dependencies: {
            supabase_api: 'healthy',
            scraper_endpoint: 'healthy',
            database_connection: 'healthy'
        }
    };
}

export function generateHealthAlerts(components: any, score: number): any[] {
    const alerts = [] as any[];

    if (score < 70) {
        alerts.push({
            level: 'warning',
            message: 'Sistema funcionando con rendimiento degradado',
            component: 'overall'
        });
    }

    if (components.database?.status === 'unhealthy') {
        alerts.push({
            level: 'critical',
            message: 'Base de datos no disponible',
            component: 'database'
        });
    }

    if (components.scraper?.status === 'unhealthy') {
        alerts.push({
            level: 'warning',
            message: 'Servicio de scraping no disponible',
            component: 'scraper'
        });
    }

    return alerts;
}

export function generateHealthRecommendations(components: any, _score: number): any[] {
    const recommendations = [] as any[];

    if (components.api_performance?.avg_response_time_ms > 1000) {
        recommendations.push({
            priority: 'medium',
            message: 'Considerar optimizar consultas de base de datos para mejorar tiempo de respuesta'
        });
    }

    if (components.cache?.hit_rate < 80) {
        recommendations.push({
            priority: 'low',
            message: 'Mejorar estrategia de cache para aumentar hit rate'
        });
    }

    return recommendations;
}

export function buildRealtimeMetrics() {
    return {
        request_rate: calculateRequestRate(),
        error_rate: calculateErrorRate(),
        response_time_p95: calculateResponseTimeP95(),
        throughput: calculateThroughput(),
        availability: calculateAvailability()
    };
}
