import { API_CACHE } from './cache.ts';
import { fetchWithTimeout } from './http.ts';
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
        const response = await fetchWithTimeout(`${supabaseUrl}/rest/v1/precios_proveedor?select=count&limit=1`, {
            headers: supabaseReadHeaders
        }, 5000);
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
        const response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/scraper-maxiconsumo/health`, {
            headers
        }, 5000);

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

export async function checkExternalDependencies(
    supabaseUrl?: string,
    supabaseReadHeaders?: Record<string, string>,
    apiSecret?: string | null,
    requestId?: string
): Promise<any> {
    const PROBE_TIMEOUT_MS = 3000;
    const probeEntries: Array<[string, Promise<{ ok: boolean }>]> = [];

    if (supabaseUrl && supabaseReadHeaders) {
        probeEntries.push(['supabase_api', fetchProbe(
            `${supabaseUrl}/rest/v1/?limit=0`,
            { headers: supabaseReadHeaders },
            PROBE_TIMEOUT_MS
        )]);
    }

    if (supabaseUrl) {
        const scraperHeaders: Record<string, string> = {};
        if (apiSecret) scraperHeaders['x-api-secret'] = apiSecret;
        if (requestId) scraperHeaders['x-request-id'] = requestId;
        probeEntries.push(['scraper_endpoint', fetchProbe(
            `${supabaseUrl}/functions/v1/scraper-maxiconsumo/health`,
            { headers: scraperHeaders },
            PROBE_TIMEOUT_MS
        )]);
    }

    if (probeEntries.length === 0) {
        return { status: 'unknown', score: 0, dependencies: {} };
    }

    const keys = probeEntries.map(([k]) => k);
    const results = await Promise.allSettled(probeEntries.map(([, p]) => p));

    const dependencies: Record<string, string> = {};
    let healthyCount = 0;

    keys.forEach((key, i) => {
        const result = results[i];
        const isOk = result.status === 'fulfilled' && result.value.ok;
        dependencies[key] = isOk ? 'healthy' : 'unhealthy';
        if (isOk) healthyCount++;
    });

    const total = keys.length;
    const score = Math.round((healthyCount / total) * 100);

    return {
        status: score === 100 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy',
        score,
        dependencies
    };
}

async function fetchProbe(url: string, options: RequestInit, timeoutMs: number): Promise<{ ok: boolean }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return { ok: response.ok };
    } catch {
        clearTimeout(timeoutId);
        return { ok: false };
    }
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
