import { validateComparacionParams } from '../validators.ts';
import {
    assessMarketRisk,
    buildComparacionQuery,
    calculateMarketTrends,
    calculateOpportunityScore,
    calcularEstadisticasComparacionOptimizado,
    determinePurchaseUrgency,
    generateBusinessInsights,
    generateRecommendations,
    identifyProductPatterns
} from '../utils/comparacion.ts';
import { fetchWithTimeout } from '../utils/http.ts';
import { createLogger } from '../../_shared/logger.ts';
import { ok } from '../../_shared/response.ts';
import { fromFetchResponse, toAppError } from '../../_shared/errors.ts';

const logger = createLogger('api-proveedor:comparacion');

export async function getComparacionConSistemaOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
): Promise<Response> {
    const { soloOportunidades, minDiferencia, limite, orden, incluirAnalisis } = validateComparacionParams(url);

    logger.info('COMPARACION_REQUEST', {
        ...requestLog,
        solo_oportunidades: soloOportunidades,
        min_diferencia: minDiferencia,
        limite
    });

    try {
        const query = buildComparacionQuery(soloOportunidades, minDiferencia, orden, limite);

        const response = await fetchWithTimeout(query, {
            headers: supabaseReadHeaders
        }, 5000);

        if (!response.ok) {
            throw await fromFetchResponse(response, 'Error obteniendo comparación');
        }

        const oportunidades = await response.json();

        const analisisResults = incluirAnalisis
            ? await Promise.allSettled([
                  calculateMarketTrends(oportunidades),
                  identifyProductPatterns(oportunidades),
                  generateRecommendations(oportunidades)
              ])
            : ([null, null, null] as const);

        const [marketTrends, productPatterns, recommendations] = analisisResults;

        const estadisticas = calcularEstadisticasComparacionOptimizado(oportunidades);

        const oportunidadesScored = await Promise.allSettled(
            oportunidades.map(async (opp: any) => ({
                ...opp,
                score_oportunidad: calculateOpportunityScore(opp),
                riesgo_mercado: assessMarketRisk(opp),
                potencial_ahorro_anual: opp.diferencia_absoluta * 12,
                urgencia_compra: determinePurchaseUrgency(opp),
                analisis_competitivo: {
                    posicionamiento: opp.precio_proveedor < opp.precio_sistema ? 'ventajoso' : 'desventajoso',
                    diferencia_porcentual_absoluta: Math.abs(opp.diferencia_porcentual)
                }
            }))
        );

        const oportunidadesFinales = oportunidadesScored
            .filter((result) => result.status === 'fulfilled')
            .map((result) => (result as PromiseFulfilledResult<any>).value);

        const data = {
            oportunidades: oportunidadesFinales,
            estadisticas,
            analisis_avanzado: incluirAnalisis
                ? {
                      tendencias_mercado: marketTrends?.status === 'fulfilled' ? marketTrends.value : null,
                      patrones_productos: productPatterns?.status === 'fulfilled' ? productPatterns.value : null,
                      recomendaciones: recommendations?.status === 'fulfilled' ? recommendations.value : null
                  }
                : null,
            filtros_aplicados: {
                solo_oportunidades: soloOportunidades,
                min_diferencia: minDiferencia,
                orden,
                incluir_analisis: incluirAnalisis
            },
            insights: generateBusinessInsights(oportunidadesFinales),
            timestamp: new Date().toISOString()
        };

        logger.info('COMPARACION_SUCCESS', {
            ...requestLog,
            oportunidades: oportunidadesFinales.length,
            analisis_incluido: incluirAnalisis
        });

        return ok(data, 200, corsHeaders, { requestId: requestLog.requestId });
    } catch (error) {
        logger.error('COMPARACION_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw toAppError(error, 'COMPARACION_ERROR', 500);
    }
}
