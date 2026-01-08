import {
    aggregateTemporalMetrics,
    buildEstadisticasQuery,
    calcularMetricasScraping,
    calcularMetricasScrapingOptimizado,
    calculateKPIs,
    calculatePerformanceMetrics,
    calculateTrendAnalysis,
    estimateOptimalTiming,
    forecastScrapingSuccess,
    identifyAnomalies,
    identifyAnomalies,
    predictPerformanceTrends
} from '../utils/estadisticas.ts';
import { createLogger } from '../../_shared/logger.ts';
import { validateEstadisticasParams } from '../validators.ts';

const logger = createLogger('api-proveedor:estadisticas');

export async function getEstadisticasScrapingOptimizado(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
): Promise<Response> {
    const { dias, categoria, granularidad, incluirPredicciones } = validateEstadisticasParams(url);

    logger.info('ESTADISTICAS_REQUEST', {
        ...requestLog,
        dias,
        categoria,
        granularidad
    });

    try {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - dias);

        const query = buildEstadisticasQuery(fechaInicio, categoria, granularidad);

        const response = await fetch(query, {
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo estadísticas: ${response.statusText}`);
        }

        const estadisticas = await response.json();

        const metricasPromise = Promise.allSettled([
            calculatePerformanceMetrics(estadisticas),
            calculateTrendAnalysis(estadisticas),
            identifyAnomalies(estadisticas),
            calcularMetricasScrapingOptimizado(estadisticas)
        ]);

        const prediccionesPromise = incluirPredicciones
            ? Promise.allSettled([
                  predictPerformanceTrends(estadisticas),
                  forecastScrapingSuccess(estadisticas),
                  estimateOptimalTiming(estadisticas)
              ])
            : Promise.resolve(null);

        const [performance, trends, anomalies, baseMetrics] = await metricasPromise;
        const [perfPred, successPred, timingPred] = await prediccionesPromise;

        const metricasTemporales = aggregateTemporalMetrics(estadisticas, granularidad);

        const resultado = {
            success: true,
            data: {
                estadisticas_periodo: estadisticas,
                metricas_agregadas: {
                    ...(baseMetrics.status === 'fulfilled' ? baseMetrics.value : calcularMetricasScraping(estadisticas)),
                    performance: performance.status === 'fulfilled' ? performance.value : null,
                    trends: trends.status === 'fulfilled' ? trends.value : null,
                    anomalies: anomalies.status === 'fulfilled' ? anomalies.value : null
                },
                metricas_temporales: metricasTemporales,
                predicciones: incluirPredicciones
                    ? {
                          performance_trends: perfPred?.status === 'fulfilled' ? perfPred.value : null,
                          success_forecast: successPred?.status === 'fulfilled' ? successPred.value : null,
                          optimal_timing: timingPred?.status === 'fulfilled' ? timingPred.value : null
                      }
                    : null,
                parametros: {
                    dias_analizados: dias,
                    categoria,
                    granularidad,
                    fecha_inicio: fechaInicio.toISOString(),
                    fecha_fin: new Date().toISOString(),
                    incluir_predicciones: incluirPredicciones
                },
                kpis: calculateKPIs(estadisticas),
                timestamp: new Date().toISOString()
            }
        };

        logger.info('ESTADISTICAS_SUCCESS', {
            ...requestLog,
            estadisticas: estadisticas.length,
            predicciones: incluirPredicciones
        });

        return new Response(JSON.stringify(resultado), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        logger.error('ESTADISTICAS_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw new Error(`Error obteniendo estadísticas optimizado: ${(error as Error).message}`);
    }
}
