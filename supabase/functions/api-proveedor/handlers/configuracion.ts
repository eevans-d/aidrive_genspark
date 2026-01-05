import {
    analyzeConfiguration,
    assessConfigHealth,
    generateConfigHash,
    generateOptimizationSuggestions
} from '../utils/config.ts';

export async function getConfiguracionProveedorOptimizado(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
): Promise<Response> {
    console.log(JSON.stringify({ ...requestLog, event: 'CONFIG_REQUEST' }));

    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/configuracion_proveedor?select=*&nombre=eq.Maxiconsumo Necochea`,
            {
                headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error obteniendo configuración: ${response.statusText}`);
        }

        const configuraciones = await response.json();
        const configuracion = configuraciones[0] || null;

        const configAnalysis = analyzeConfiguration(configuracion);
        const healthStatus = assessConfigHealth(configuracion);
        const optimizationSuggestions = generateOptimizationSuggestions(configuracion);

        const resultado = {
            success: true,
            data: {
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
            }
        };

        console.log(
            JSON.stringify({
                ...requestLog,
                event: 'CONFIG_SUCCESS',
                health: healthStatus,
                score: configAnalysis.score
            })
        );

        return new Response(JSON.stringify(resultado), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(
            JSON.stringify({
                ...requestLog,
                event: 'CONFIG_ERROR',
                error: (error as Error).message
            })
        );

        throw new Error(`Error obteniendo configuración optimizado: ${(error as Error).message}`);
    }
}
