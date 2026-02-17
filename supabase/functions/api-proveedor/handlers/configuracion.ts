import {
    analyzeConfiguration,
    assessConfigHealth,
    generateConfigHash,
    generateOptimizationSuggestions
} from '../utils/config.ts';
import { fetchWithTimeout } from '../utils/http.ts';
import { createLogger } from '../../_shared/logger.ts';
import { validateApiSecret, createAuthErrorResponse } from '../utils/auth.ts';
import { ok } from '../../_shared/response.ts';
import { fromFetchResponse, toAppError } from '../../_shared/errors.ts';

const logger = createLogger('api-proveedor:configuracion');

export async function getConfiguracionProveedorOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any,
    request: Request
): Promise<Response> {
    const authResult = validateApiSecret(request);
    if (!authResult.valid) {
        logger.warn('CONFIG_AUTH_FAILED', { ...requestLog, error: authResult.error });
        return createAuthErrorResponse(authResult.error || 'Auth failed', corsHeaders, requestLog.requestId);
    }

    logger.info('CONFIG_REQUEST', { ...requestLog });

    try {
        const response = await fetchWithTimeout(
            `${supabaseUrl}/rest/v1/configuracion_proveedor?select=*&nombre=eq.Maxiconsumo Necochea`,
            {
                headers: supabaseReadHeaders
            },
            5000
        );

        if (!response.ok) {
            throw await fromFetchResponse(response, 'Error obteniendo configuración');
        }

        const configuraciones = await response.json();
        const configuracion = configuraciones[0] || null;

        const configAnalysis = analyzeConfiguration(configuracion);
        const healthStatus = assessConfigHealth(configuracion);
        const optimizationSuggestions = generateOptimizationSuggestions(configuracion);

        const data = {
            configuracion: {
                ...configuracion,
                ultima_validacion: new Date().toISOString(),
                hash_config: configuracion ? generateConfigHash(configuracion) : null
            },
            analisis: {
                health_status: healthStatus,
                configuration_score: configAnalysis.score,
                issues_found: configAnalysis.issues,
                optimization_potential: configAnalysis.optimizationPotential
            },
            sugerencias_optimizacion: optimizationSuggestions,
            parametros_disponibles: {
                frecuencia_scraping: ['cada_hora', 'diaria', 'semanal'],
                severidad_alertas: ['baja', 'media', 'alta', 'critica'],
                tipos_cambio: ['aumento', 'disminucion', 'nuevo_producto'],
                estrategias_cache: ['aggressive', 'balanced', 'conservative'],
                modos_error_recovery: ['automatic', 'manual', 'hybrid']
            },
            configuracion_actual_analizada: {
                es_optima: healthStatus === 'healthy',
                necesita_actualizacion: configAnalysis.needsUpdate,
                recomendaciones_activas: optimizationSuggestions.length
            },
            timestamp: new Date().toISOString()
        };

        logger.info('CONFIG_SUCCESS', {
            ...requestLog,
            health: healthStatus,
            score: configAnalysis.score
        });

        return ok(data, 200, corsHeaders, { requestId: requestLog.requestId });
    } catch (error) {
        logger.error('CONFIG_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw toAppError(error, 'CONFIGURACION_ERROR', 500);
    }
}
