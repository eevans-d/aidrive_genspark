import type { AlertaVistaRow } from '../../_shared/types.ts';
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
import { fetchWithTimeout } from '../utils/http.ts';
import { createLogger } from '../../_shared/logger.ts';
import { ok } from '../../_shared/response.ts';
import { fromFetchResponse, toAppError } from '../../_shared/errors.ts';

const logger = createLogger('api-proveedor:alertas');

export async function getAlertasActivasOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: Record<string, unknown>
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

        const response = await fetchWithTimeout(query, {
            headers: supabaseReadHeaders
        }, 5000);

        if (!response.ok) {
            throw await fromFetchResponse(response, 'Error obteniendo alertas');
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
            alertas.map(async (alerta: AlertaVistaRow) => ({
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
            .map((result) => (result as PromiseFulfilledResult<unknown>).value);

        const estadisticas = {
            total_alertas: alertasFinales.length,
            criticas: alertasFinales.filter((a: Record<string, unknown>) => a.severidad === 'critica').length,
            altas: alertasFinales.filter((a: Record<string, unknown>) => a.severidad === 'alta').length,
            medias: alertasFinales.filter((a: Record<string, unknown>) => a.severidad === 'media').length,
            bajas: alertasFinales.filter((a: Record<string, unknown>) => a.severidad === 'baja').length,
            aumentos: alertasFinales.filter((a: Record<string, unknown>) => a.tipo_cambio === 'aumento').length,
            disminuciones: alertasFinales.filter((a: Record<string, unknown>) => a.tipo_cambio === 'disminucion').length,
            nuevos_productos: alertasFinales.filter((a: Record<string, unknown>) => a.tipo_cambio === 'nuevo_producto').length,
            promedio_impacto:
                alertasFinales.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.impacto_estimado as number) || 0), 0) /
                Math.max(alertasFinales.length, 1),
            alertas_requieren_accion: alertasFinales.filter((a: Record<string, unknown>) => a.action_required).length
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

        throw toAppError(error, 'ALERTAS_ERROR', 500);
    }
}
