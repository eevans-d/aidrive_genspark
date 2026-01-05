export function analyzeConfiguration(config: any): any {
    if (!config) {
        return { score: 0, issues: ['No configuration found'], needsUpdate: true, optimizationPotential: 0 };
    }

    let score = 100;
    const issues = [] as string[];
    let needsUpdate = false;
    let optimizationPotential = 0;

    if (!config.frecuencia_scraping) {
        issues.push('Frecuencia de scraping no configurada');
        score -= 20;
        needsUpdate = true;
    }

    if (!config.umbral_cambio_precio) {
        issues.push('Umbral de cambio de precio no configurado');
        score -= 15;
        needsUpdate = true;
        optimizationPotential += 10;
    }

    if (!config.cache_ttl) {
        optimizationPotential += 15;
    }

    return { score, issues, needsUpdate, optimizationPotential };
}

export function assessConfigHealth(config: any): string {
    if (!config) return 'unhealthy';

    const hasRequiredFields = config.frecuencia_scraping && config.umbral_cambio_precio;
    const isRecent = config.ultima_actualizacion
        ? Date.now() - new Date(config.ultima_actualizacion).getTime() < 86400000
        : false;

    if (hasRequiredFields && isRecent) return 'healthy';
    if (hasRequiredFields) return 'needs_update';
    return 'unhealthy';
}

export function generateOptimizationSuggestions(config: any): any[] {
    const suggestions = [] as any[];

    if (!config?.cache_aggressive) {
        suggestions.push({
            type: 'performance',
            title: 'Activar cache agresivo',
            description: 'Mejorar el rendimiento con estrategia de cache más agresiva'
        });
    }

    if (!config?.parallel_processing) {
        suggestions.push({
            type: 'scalability',
            title: 'Habilitar procesamiento paralelo',
            description: 'Aumentar el throughput con procesamiento paralelo'
        });
    }

    return suggestions;
}

export function generateConfigHash(config: any): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
        const char = configString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash;
    }
    return Math.abs(hash).toString(16);
}
