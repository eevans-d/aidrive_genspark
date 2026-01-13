import { validateAlertasParams } from '../validators.ts';
import { formatTiempoTranscurrido } from '../utils/format.ts';
import {
    assignAlertCluster,
    buildAlertasQuery,
    calculateAlertImpact,
    calculateAlertPriority,
    calculateAlertRiskScore,
    determineActionRequired,
    detectAlertPatterns,
    generateAlertInsights,
    generateAlertRecommendations,
    predictAlertTrends
} from '../utils/alertas.ts';
import { createLogger } from '../../_shared/logger.ts';
import { ok } from '../../_shared/response.ts';

const logger = createLogger('api-proveedor:alertas');

export async function getAlertasActivasOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
): Promise<Response> {
    const { severidad, tipo, limite, soloNoProcesadas, incluirAnalisis } = validateAlertasParams(url);

    logger.info('ALERTAS_REQUEST', {
        ...requestLog,
        severidad,
        tipo,
        limite
    });

    try {
        const query = buildAlertasQuery(severidad, tipo, limite);

        const response = await fetch(query, {
            headers: supabaseReadHeaders
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo alertas: ${response.statusText}`);
        }

        const alertas = await response.json();
        const analisisResults = incluirAnalisis
            ? await Promise.allSettled([
                  detectAlertPatterns(alertas),
                  predictAlertTrends(alertas),
                  calculateAlertRiskScore(alertas)
              ])
            : null;

        const [patterns, trends, riskScores] = analisisResults ?? [];

        const alertasEnriquecidas = await Promise.allSettled(
            alertas.map(async (alerta: any) => ({
                ...alerta,
                impacto_estimado: calculateAlertImpact(alerta),
                recomendaciones: generateAlertRecommendations(alerta),
                tiempo_transcurrido: formatTiempoTranscurrido(alerta.fecha_alerta),
                cluster_id: await assignAlertCluster(alerta),
                priority_score: calculateAlertPriority(alerta),
                action_required: determineActionRequired(alerta)
            }))
        );

        const alertasFinales = alertasEnriquecidas
            .filter((result) => result.status === 'fulfilled')
            .map((result) => (result as PromiseFulfilledResult<any>).value);

        const estadisticas = {
            total_alertas: alertasFinales.length,
            criticas: alertasFinales.filter((a: any) => a.severidad === 'critica').length,
            altas: alertasFinales.filter((a: any) => a.severidad === 'alta').length,
            medias: alertasFinales.filter((a: any) => a.severidad === 'media').length,
            bajas: alertasFinales.filter((a: any) => a.severidad === 'baja').length,
            aumentos: alertasFinales.filter((a: any) => a.tipo_cambio === 'aumento').length,
            disminuciones: alertasFinales.filter((a: any) => a.tipo_cambio === 'disminucion').length,
            nuevos_productos: alertasFinales.filter((a: any) => a.tipo_cambio === 'nuevo_producto').length,
            promedio_impacto:
                alertasFinales.reduce((sum: number, a: any) => sum + (a.impacto_estimado || 0), 0) /
                Math.max(alertasFinales.length, 1),
            alertas_requieren_accion: alertasFinales.filter((a: any) => a.action_required).length
        };

        const data = {
            alertas: alertasFinales,
            estadisticas,
            analisis_inteligente: incluirAnalisis
                ? {
                      patrones_detectados: patterns?.status === 'fulfilled' ? patterns.value : null,
                      tendencias_predichas: trends?.status === 'fulfilled' ? trends.value : null,
                      scores_riesgo: riskScores?.status === 'fulfilled' ? riskScores.value : null
                  }
                : null,
            filtros_aplicados: {
                severidad,
                tipo,
                solo_no_procesadas: soloNoProcesadas,
                incluir_analisis: incluirAnalisis
            },
            insights: generateAlertInsights(alertasFinales),
            timestamp: new Date().toISOString()
        };

        logger.info('ALERTAS_SUCCESS', {
            ...requestLog,
            alertas: alertasFinales.length,
            analisis: incluirAnalisis
        });

        return ok(data, 200, corsHeaders, { requestId: requestLog.requestId });
    } catch (error) {
        logger.error('ALERTAS_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw new Error(`Error obteniendo alertas optimizado: ${(error as Error).message}`);
    }
}
