export function buildAlertasQuery(severidad: string, tipo: string, limite: number): string {
    let query = `${Deno.env.get('SUPABASE_URL')}/rest/v1/vista_alertas_activas?select=*`;

    const filtros = [] as string[];

    if (severidad !== 'todos') {
        filtros.push(`severidad=eq.${severidad}`);
    }

    if (tipo !== 'todos') {
        filtros.push(`tipo_cambio=eq.${tipo}`);
    }

    if (filtros.length > 0) {
        query += `&${filtros.join('&')}`;
    }

    return `${query}&order=fecha_alerta.desc&limit=${limite}`;
}

export async function detectAlertPatterns(alertas: any[]): Promise<any> {
    const patterns = [] as any[];
    const recentAlerts = alertas.filter(
        (alert) => Date.now() - new Date(alert.fecha_alerta).getTime() < 86400000
    );

    if (recentAlerts.length > 10) {
        patterns.push({
            type: 'high_frequency',
            description: 'Alta frecuencia de alertas en las últimas 24 horas',
            severity: 'medium'
        });
    }

    return patterns;
}

export async function predictAlertTrends(alertas: any[]): Promise<any> {
    const trend = {
        direction: 'stable',
        confidence: 0.7,
        prediction: 'Se mantendrá el nivel actual de alertas'
    };

    const recentCount = alertas.filter(
        (alert) => Date.now() - new Date(alert.fecha_alerta).getTime() < 3600000
    ).length;

    if (recentCount > 5) {
        trend.direction = 'increasing';
        trend.prediction = 'Se espera un aumento en las alertas';
    } else if (recentCount < 2) {
        trend.direction = 'decreasing';
        trend.prediction = 'Se espera una disminución en las alertas';
    }

    return trend;
}

export async function calculateAlertRiskScore(alertas: any[]): Promise<any> {
    const scores = alertas.map((alert) => {
        let score = 0;

        if (alert.severidad === 'critica') score += 40;
        else if (alert.severidad === 'alta') score += 25;
        else if (alert.severidad === 'media') score += 15;
        else score += 5;

        if (alert.tipo_cambio === 'aumento') score += 20;
        else if (alert.tipo_cambio === 'disminucion') score += 15;

        const hoursOld = (Date.now() - new Date(alert.fecha_alerta).getTime()) / 3600000;
        if (hoursOld < 1) score += 10;
        else if (hoursOld < 6) score += 5;

        return Math.min(100, score);
    });

    return {
        average_score: scores.reduce((a, b) => a + b, 0) / scores.length,
        high_risk_count: scores.filter((s) => s > 70).length,
        risk_distribution: {
            low: scores.filter((s) => s < 30).length,
            medium: scores.filter((s) => s >= 30 && s < 70).length,
            high: scores.filter((s) => s >= 70).length
        }
    };
}

export function calculateAlertImpact(alerta: any): number {
    let impact = 0;

    const severityImpact = {
        critica: 40,
        alta: 25,
        media: 15,
        baja: 5
    } as Record<string, number>;
    impact += severityImpact[alerta.severidad] || 5;

    if (alerta.diferencia_absoluta) {
        impact += Math.min(30, Math.log(alerta.diferencia_absoluta + 1) * 10);
    }

    if (alerta.stock_disponible < 10) {
        impact += 15;
    } else if (alerta.stock_disponible < 50) {
        impact += 8;
    }

    return Math.min(100, impact);
}

export function generateAlertRecommendations(alerta: any): string[] {
    const recommendations = [] as string[];

    if (alerta.severidad === 'critica') {
        recommendations.push('Revisión inmediata requerida');
    }

    if (alerta.diferencia_absoluta > 100) {
        recommendations.push('Considerar actualización de precios del sistema');
    }

    if (alerta.stock_disponible < 10) {
        recommendations.push('Evaluar reposición de inventario');
    }

    return recommendations;
}

export async function assignAlertCluster(alerta: any): Promise<string> {
    return `${alerta.categoria}_${alerta.tipo_cambio}_${alerta.severidad}`;
}

export function calculateAlertPriority(alerta: any): number {
    let priority = 0;

    if (alerta.severidad === 'critica') priority += 100;
    else if (alerta.severidad === 'alta') priority += 75;
    else if (alerta.severidad === 'media') priority += 50;
    else priority += 25;

    const hoursOld = (Date.now() - new Date(alerta.fecha_alerta).getTime()) / 3600000;
    if (hoursOld < 1) priority += 20;
    else if (hoursOld < 6) priority += 10;

    if (alerta.diferencia_absoluta > 50) priority += 15;

    return Math.min(150, priority);
}

export function determineActionRequired(alerta: any): boolean {
    const isCritical = alerta.severidad === 'critica';
    const hasHighImpact = alerta.diferencia_absoluta > 100;
    const isRecent = Date.now() - new Date(alerta.fecha_alerta).getTime() < 3600000;

    return isCritical || (hasHighImpact && isRecent);
}

export function generateAlertInsights(alertas: any[]): any {
    const insights = [] as any[];

    const criticalCount = alertas.filter((a) => a.severidad === 'critica').length;
    if (criticalCount > 0) {
        insights.push({
            type: 'critical_alerts',
            message: `${criticalCount} alertas críticas requieren atención inmediata`,
            urgency: 'high'
        });
    }

    const recentAlerts = alertas.filter(
        (a) => Date.now() - new Date(a.fecha_alerta).getTime() < 3600000
    ).length;

    if (recentAlerts > 5) {
        insights.push({
            type: 'high_activity',
            message: `${recentAlerts} alertas en la última hora - actividad elevada`,
            urgency: 'medium'
        });
    }

    return insights;
}
