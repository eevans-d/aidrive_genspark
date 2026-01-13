import { validatePreciosParams } from '../validators.ts';
import { formatTiempoTranscurrido, getMemoryUsage } from '../utils/format.ts';
import { createLogger } from '../../_shared/logger.ts';
import { ok } from '../../_shared/response.ts';

const logger = createLogger('api-proveedor:precios');

export async function getPreciosActualesOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
): Promise<Response> {
    const { categoria, limite, offset, activo } = validatePreciosParams(url);

    logger.info('PRECIOS_REQUEST', { ...requestLog, categoria, limite, offset });

    try {
        const queries = await Promise.allSettled([
            buildPreciosQuery(supabaseUrl, supabaseReadHeaders, categoria, activo, limite, offset),
            buildPreciosCountQuery(supabaseUrl, supabaseReadHeaders, categoria, activo),
            buildPreciosStatsQuery(supabaseUrl, supabaseReadHeaders, categoria, activo)
        ]);

        const [preciosResult, countResult, statsResult] = queries;

        if (preciosResult.status === 'rejected') {
            throw new Error(`Error en consulta principal: ${preciosResult.reason}`);
        }

        const productos = await preciosResult.value.json();
        const total = countResult.status === 'fulfilled' ? countResult.value : productos.length;
        const estadisticas = statsResult.status === 'fulfilled' ? statsResult.value : {};

        const productosConStats = await Promise.allSettled(
            productos.map(async (producto: any) => {
                return {
                    ...producto,
                    tendencias: producto.precio_anterior ? {
                        cambio_absoluto: producto.precio_actual - producto.precio_anterior,
                        cambio_porcentual: ((producto.precio_actual - producto.precio_anterior) / producto.precio_anterior * 100).toFixed(2),
                        direccion: producto.precio_actual > producto.precio_anterior ? 'subida' : 'bajada'
                    } : null,
                    ultima_actualizacion_humanizada: formatTiempoTranscurrido(producto.ultima_actualizacion)
                };
            })
        );

        const productosFinales = productosConStats
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value);

        const data = {
            productos: productosFinales,
            paginacion: {
                total: total,
                limite: limite,
                offset: offset,
                productos_mostrados: productosFinales.length,
                tiene_mas: (offset + limite) < total,
                paginas_totales: Math.ceil(total / limite)
            },
            estadisticas_rapidas: estadisticas,
            filtros_aplicados: {
                categoria: categoria,
                activo: activo
            },
            cache_info: {
                ttl: 60000,
                can_cache: true
            },
            timestamp: new Date().toISOString()
        };
        const metrics = {
            productos_procesados: productosFinales.length,
            tiempo_procesamiento: Date.now() - new Date(requestLog.timestamp).getTime(),
            memory_usage: getMemoryUsage()
        };

        logger.info('PRECIOS_SUCCESS', {
            ...requestLog,
            productos: productosFinales.length,
            total: total
        });

        return ok(data, 200, corsHeaders, { requestId: requestLog.requestId, extra: { metrics } });

    } catch (error) {
        logger.error('PRECIOS_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw new Error(`Error obteniendo precios optimizado: ${(error as Error).message}`);
    }
}

function buildPreciosQuery(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    categoria: string,
    activo: string,
    limite: number,
    offset: number
): Promise<Response> {
    let query = `${supabaseUrl}/rest/v1/precios_proveedor?select=*&fuente=eq.Maxiconsumo Necochea&activo=eq.${activo}`;

    if (categoria !== 'todos') {
        query += `&categoria=eq.${encodeURIComponent(categoria)}`;
    }

    query += `&order=ultima_actualizacion.desc&limit=${limite}&offset=${offset}`;

    return fetch(query, {
        headers: supabaseReadHeaders
    });
}

function buildPreciosCountQuery(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    categoria: string,
    activo: string
): Promise<number> {
    let query = `${supabaseUrl}/rest/v1/precios_proveedor?select=count&fuente=eq.Maxiconsumo Necochea&activo=eq.${activo}`;

    if (categoria !== 'todos') {
        query += `&categoria=eq.${encodeURIComponent(categoria)}`;
    }

    return fetch(query, {
        headers: supabaseReadHeaders
    }).then(res => res.json()).then(data => data[0]?.count || 0);
}

function buildPreciosStatsQuery(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    categoria: string,
    activo: string
): Promise<any> {
    const query = `${supabaseUrl}/rest/v1/precios_proveedor?select=precio_actual,stock_disponible,categoria&fuente=eq.Maxiconsumo Necochea&activo=eq.true${categoria !== 'todos' ? `&categoria=eq.${encodeURIComponent(categoria)}` : ''}`;

    return fetch(query, {
        headers: supabaseReadHeaders
    }).then(res => res.json()).then(data => {
        const precios = data.map((item: any) => item.precio_actual);
        const totalStock = data.reduce((sum: number, item: any) => sum + (item.stock_disponible || 0), 0);

        return {
            precio_promedio: precios.length > 0 ? precios.reduce((a: number, b: number) => a + b, 0) / precios.length : 0,
            precio_minimo: precios.length > 0 ? Math.min(...precios) : 0,
            precio_maximo: precios.length > 0 ? Math.max(...precios) : 0,
            total_stock_disponible: totalStock,
            productos_con_stock: data.filter((item: any) => item.stock_disponible > 0).length
        };
    });
}
