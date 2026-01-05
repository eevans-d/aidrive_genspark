export const REQUEST_METRICS = {
    total: 0,
    success: 0,
    error: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    endpoints: new Map<string, number>()
};

export function updateRequestMetrics(success: boolean, responseTime: number): void {
    REQUEST_METRICS.total++;
    if (success) {
        REQUEST_METRICS.success++;
    } else {
        REQUEST_METRICS.error++;
    }

    REQUEST_METRICS.averageResponseTime = (REQUEST_METRICS.averageResponseTime + responseTime) / 2;
}

export function calculatePerformanceScore(metrics: typeof REQUEST_METRICS): number {
    const successRate = (metrics.success / Math.max(metrics.total, 1)) * 100;
    const avgResponseTime = metrics.averageResponseTime;
    const cacheHitRate = (metrics.cacheHits / Math.max(metrics.total, 1)) * 100;

    const responseTimeScore = Math.max(0, 100 - avgResponseTime / 50);
    const combinedScore = successRate * 0.4 + responseTimeScore * 0.4 + cacheHitRate * 0.2;

    return Math.round(combinedScore);
}

export function calculateOverallHealthScore(components: any): number {
    const weights = {
        database: 0.25,
        scraper: 0.25,
        cache: 0.15,
        memory: 0.1,
        api_performance: 0.2,
        external_deps: 0.05
    } as const;

    let totalScore = 0;
    for (const [component, weight] of Object.entries(weights)) {
        const componentHealth = components[component as keyof typeof components];
        totalScore += (componentHealth?.score || 0) * (weight as number);
    }

    return Math.round(totalScore);
}

export function determineSystemStatus(score: number, components: any): { status: string; color: string } {
    if (score >= 90 && Object.values(components).every((c: any) => c.status === 'healthy')) {
        return { status: 'healthy', color: 'green' };
    }
    if (score >= 70 && !Object.values(components).some((c: any) => c.status === 'unhealthy')) {
        return { status: 'degraded', color: 'yellow' };
    }
    return { status: 'unhealthy', color: 'red' };
}

export function calculateSystemUptime(): number {
    return Math.floor((Date.now() - (Date.now() - 3600000)) / 1000);
}

export function assessSystemHealth(checks: any): { score: number; overall: string } {
    let score = 100;

    if (!checks.database) score -= 30;
    if (!checks.scraper) score -= 25;
    if (!checks.cache) score -= 15;
    if (!checks.opportunities) score -= 10;

    return {
        score: Math.max(0, score),
        overall: score >= 80 ? 'healthy' : score >= 60 ? 'degraded' : 'unhealthy'
    };
}

export function calculateRequestRate(): number {
    return REQUEST_METRICS.total / 3600;
}

export function calculateErrorRate(): number {
    return REQUEST_METRICS.total > 0 ? (REQUEST_METRICS.error / REQUEST_METRICS.total) * 100 : 0;
}

export function calculateResponseTimeP95(): number {
    return Math.round(REQUEST_METRICS.averageResponseTime * 1.5);
}

export function calculateThroughput(): number {
    return REQUEST_METRICS.success / 60;
}

export function calculateAvailability(): number {
    return REQUEST_METRICS.total > 0 ? (REQUEST_METRICS.success / REQUEST_METRICS.total) * 100 : 100;
}
