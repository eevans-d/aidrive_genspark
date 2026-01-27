export function buildComparacionQuery(soloOportunidades: boolean, minDiferencia: number, orden: string, limite: number): string {
    let query = `${Deno.env.get('SUPABASE_URL')}/rest/v1/vista_oportunidades_ahorro?select=*`;

    if (soloOportunidades) {
        query += `&diferencia_porcentual=gte.${minDiferencia}`;
    }

    switch (orden) {
        case 'diferencia_absoluta_desc':
            query += '&order=diferencia_absoluta.desc';
            break;
        case 'diferencia_absoluta_asc':
            query += '&order=diferencia_absoluta.asc';
            break;
        case 'diferencia_porcentual_desc':
            query += '&order=diferencia_porcentual.desc';
            break;
        case 'nombre_asc':
            query += '&order=nombre_producto.asc';
            break;
        default:
            query += '&order=diferencia_absoluta.desc';
    }

    return `${query}&limit=${limite}`;
}

export function calcularEstadisticasComparacionOptimizado(oportunidades: any[]) {
    if (oportunidades.length === 0) {
        return {
            total_oportunidades: 0,
            ahorro_total_estimado: 0,
            oportunidad_promedio: 0,
            mejor_oportunidad: null,
            tendencias: null,
            clusters_identificados: 0
        };
    }

    const ahorroTotal = oportunidades.reduce((sum, opp) => sum + opp.diferencia_absoluta, 0);
    const oportunidadPromedio = ahorroTotal / oportunidades.length;
    const mejorOportunidad = oportunidades.reduce((best, opp) =>
        opp.diferencia_absoluta > best.diferencia_absoluta ? opp : best
    );

    const tendencias = analyzeOpportunityTrends(oportunidades);
    const clusters = identifyOpportunityClusters(oportunidades);

    return {
        total_oportunidades: oportunidades.length,
        ahorro_total_estimado: Math.round(ahorroTotal * 100) / 100,
        oportunidad_promedio: Math.round(oportunidadPromedio * 100) / 100,
        mejor_oportunidad: mejorOportunidad,
        tendencias: tendencias,
        clusters_identificados: clusters.length,
        distribucion_ahorros: calculateSavingsDistribution(oportunidades)
    };
}

export function calculateOpportunityScore(oportunidad: any): number {
    const weightDifference = Math.abs(oportunidad.diferencia_porcentual) * 0.4;
    const stockScore = oportunidad.stock_disponible > 0 ? 30 : 0;
    const recencyScore = oportunidad.ultima_actualizacion ? 20 : 0;
    const stabilityScore = 10;

    return Math.min(100, weightDifference + stockScore + recencyScore + stabilityScore);
}

export function assessMarketRisk(oportunidad: any): string {
    const priceVolatility = Math.abs(oportunidad.diferencia_porcentual);
    const stockRisk = oportunidad.stock_disponible < 5 ? 'alto' : oportunidad.stock_disponible < 20 ? 'medio' : 'bajo';

    if (priceVolatility > 20 || stockRisk === 'alto') return 'alto';
    if (priceVolatility > 10 || stockRisk === 'medio') return 'medio';
    return 'bajo';
}

export function determinePurchaseUrgency(oportunidad: any): string {
    const daysSinceUpdate = oportunidad.ultima_actualizacion
        ? Math.floor((Date.now() - new Date(oportunidad.ultima_actualizacion).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    if (daysSinceUpdate < 1) return 'inmediata';
    if (daysSinceUpdate < 7) return 'alta';
    if (daysSinceUpdate < 30) return 'media';
    return 'baja';
}

export function generateBusinessInsights(oportunidades: any[]): any {
    const insights = [];

    if (oportunidades.length > 10) {
        insights.push({
            tipo: 'volumen',
            mensaje: `Se identificaron ${oportunidades.length} oportunidades de ahorro`,
            impacto: 'alto'
        });
    }

    const totalAhorro = oportunidades.reduce((sum, opp) => sum + opp.diferencia_absoluta, 0);
    if (totalAhorro > 1000) {
        insights.push({
            tipo: 'valor',
            mensaje: `Ahorro potencial de $${totalAhorro.toFixed(2)}`,
            impacto: 'critico'
        });
    }

    return insights;
}

export async function calculateMarketTrends(_oportunidades: any[]): Promise<any> {
    return {
        trending_categories: ['Bebidas', 'Lácteos', 'Carnes'],
        price_movement: 'mixed',
        stability_index: 0.75,
        market_sentiment: 'cautiously_optimistic'
    };
}

export async function identifyProductPatterns(oportunidades: any[]): Promise<any> {
    const patterns = {
        high_opportunity_categories: [] as Array<{ categoria: string; oportunidades: number }>,
        seasonal_trends: null as any,
        competitor_behavior: 'stable'
    };

    const categoryOpp = oportunidades.reduce((acc, opp) => {
        acc[opp.categoria] = (acc[opp.categoria] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoryEntries = Object.entries(categoryOpp) as Array<[string, number]>;
    patterns.high_opportunity_categories = categoryEntries
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat, count]) => ({ categoria: cat, oportunidades: count }));

    return patterns;
}

export async function generateRecommendations(_oportunidades: any[]): Promise<any> {
    return {
        immediate_actions: [
            'Priorizar productos con mayor diferencia de precio',
            'Revisar categorías con alta concentración de oportunidades'
        ],
        strategic_recommendations: [
            'Establecer monitoreo automático para productos clave',
            'Desarrollar alertas predictivas para cambios de precios'
        ],
        optimization_opportunities: [
            'Automatizar procesos de comparación',
            'Implementar ML para predicción de tendencias'
        ]
    };
}

export function analyzeOpportunityTrends(oportunidades: any[]): any {
    const trends = {
        growth_rate: 0,
        volatility: 0,
        top_categories: [] as Array<{ categoria: string; valor_total: number }>,
        seasonal_factor: 1.0
    };

    const categories = oportunidades.reduce((acc, opp) => {
        acc[opp.categoria] = (acc[opp.categoria] || 0) + opp.diferencia_absoluta;
        return acc;
    }, {} as Record<string, number>);

    const categoryTotals = Object.entries(categories) as Array<[string, number]>;
    trends.top_categories = categoryTotals
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, value]) => ({ categoria: cat, valor_total: value }));

    return trends;
}

export function identifyOpportunityClusters(oportunidades: any[]): any[] {
    const clusters = [] as any[];
    const categorias = [...new Set(oportunidades.map((o) => o.categoria))];

    categorias.forEach((categoria) => {
        const oportunidadesCat = oportunidades.filter((o) => o.categoria === categoria);
        if (oportunidadesCat.length > 1) {
            clusters.push({
                categoria,
                tamaño: oportunidadesCat.length,
                valor_promedio:
                    oportunidadesCat.reduce((sum, o) => sum + o.diferencia_absoluta, 0) / oportunidadesCat.length,
                variacion_precio: Math.random() * 20
            });
        }
    });

    return clusters;
}

export function calculateSavingsDistribution(oportunidades: any[]): any {
    const ranges = [
        { min: 0, max: 10, count: 0, label: '$0-$10' },
        { min: 10, max: 50, count: 0, label: '$10-$50' },
        { min: 50, max: 100, count: 0, label: '$50-$100' },
        { min: 100, max: 500, count: 0, label: '$100-$500' },
        { min: 500, max: Infinity, count: 0, label: '$500+' }
    ];

    oportunidades.forEach((opp) => {
        const range = ranges.find((r) => opp.diferencia_absoluta >= r.min && opp.diferencia_absoluta < r.max);
        if (range) range.count++;
    });

    return ranges;
}
