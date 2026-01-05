import { validatePreciosParams } from '../validators.ts';
import { formatTiempoTranscurrido, getMemoryUsage } from '../utils/format.ts';

export async function getPreciosActualesOptimizado(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
): Promise<Response> {
    const { categoria, limite, offset, activo } = validatePreciosParams(url);

    console.log(JSON.stringify({ ...requestLog, event: 'PRECIOS_REQUEST', categoria, limite, offset }));

    try {
        const queries = await Promise.allSettled([
            buildPreciosQuery(supabaseUrl, categoria, activo, limite, offset),
            buildPreciosCountQuery(supabaseUrl, categoria, activo),
            buildPreciosStatsQuery(supabaseUrl, categoria, activo)
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

        const resultado = {
            success: true,
            data: {
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
            },
            metrics: {
                productos_procesados: productosFinales.length,
                tiempo_procesamiento: Date.now() - new Date(requestLog.timestamp).getTime(),
                memory_usage: getMemoryUsage()
            }
        };

        console.log(JSON.stringify({
            ...requestLog,
            event: 'PRECIOS_SUCCESS',
            productos: productosFinales.length,
            total: total
        }));

        return new Response(JSON.stringify(resultado), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error(JSON.stringify({
            ...requestLog,
            event: 'PRECIOS_ERROR',
            error: (error as Error).message
        }));

        throw new Error(`Error obteniendo precios optimizado: ${(error as Error).message}`);
    }
}

function buildPreciosQuery(supabaseUrl: string, categoria: string, activo: string, limite: number, offset: number): Promise<Response> {
    let query = `${supabaseUrl}/rest/v1/precios_proveedor?select=*&fuente=eq.Maxiconsumo Necochea&activo=eq.${activo}`;

    if (categoria !== 'todos') {
        query += `&categoria=eq.${encodeURIComponent(categoria)}`;
    }

    query += `&order=ultima_actualizacion.desc&limit=${limite}&offset=${offset}`;

    return fetch(query, {
        headers: {
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`,
        }
    });
}

function buildPreciosCountQuery(supabaseUrl: string, categoria: string, activo: string): Promise<number> {
    let query = `${supabaseUrl}/rest/v1/precios_proveedor?select=count&fuente=eq.Maxiconsumo Necochea&activo=eq.${activo}`;

    if (categoria !== 'todos') {
        query += `&categoria=eq.${encodeURIComponent(categoria)}`;
    }

    return fetch(query, {
        headers: {
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`,
        }
    }).then(res => res.json()).then(data => data[0]?.count || 0);
}

function buildPreciosStatsQuery(supabaseUrl: string, categoria: string, activo: string): Promise<any> {
    const query = `${supabaseUrl}/rest/v1/precios_proveedor?select=precio_actual,stock_disponible,categoria&fuente=eq.Maxiconsumo Necochea&activo=eq.true${categoria !== 'todos' ? `&categoria=eq.${encodeURIComponent(categoria)}` : ''}`;

    return fetch(query, {
        headers: {
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`,
        }
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
