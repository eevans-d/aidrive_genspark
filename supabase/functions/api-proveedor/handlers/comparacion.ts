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

export async function getComparacionConSistemaOptimizado(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
): Promise<Response> {
    const { soloOportunidades, minDiferencia, limite, orden, incluirAnalisis } = validateComparacionParams(url);

    console.log(
        JSON.stringify({
            ...requestLog,
            event: 'COMPARACION_REQUEST',
            solo_oportunidades: soloOportunidades,
            min_diferencia: minDiferencia,
            limite
        })
    );

    try {
        const query = buildComparacionQuery(soloOportunidades, minDiferencia, orden, limite);

        const response = await fetch(query, {
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo comparación: ${response.statusText}`);
        }

        const oportunidades = await response.json();

        const analisisPromise = incluirAnalisis
            ? Promise.allSettled([
                  calculateMarketTrends(oportunidades),
                  identifyProductPatterns(oportunidades),
                  generateRecommendations(oportunidades)
              ])
            : Promise.resolve(null);

        const [marketTrends, productPatterns, recommendations] = await analisisPromise;

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

        const resultado = {
            success: true,
            data: {
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
            }
        };

        console.log(
            JSON.stringify({
                ...requestLog,
                event: 'COMPARACION_SUCCESS',
                oportunidades: oportunidadesFinales.length,
                analisis_incluido: incluirAnalisis
            })
        );

        return new Response(JSON.stringify(resultado), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(
            JSON.stringify({
                ...requestLog,
                event: 'COMPARACION_ERROR',
                error: (error as Error).message
            })
        );

        throw new Error(`Error obteniendo comparación optimizado: ${(error as Error).message}`);
    }
}
