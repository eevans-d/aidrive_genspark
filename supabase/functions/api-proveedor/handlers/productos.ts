import { validateProductosParams } from '../validators.ts';
import { calculateCompetitivenessScore, calculateRelevanceScore, formatPrecio, generateSearchTags, generateSlug } from '../utils/format.ts';
import { fetchWithTimeout } from '../utils/http.ts';
import { createLogger } from '../../_shared/logger.ts';
import { ok } from '../../_shared/response.ts';
import { fromFetchError, fromFetchResponse, toAppError } from '../../_shared/errors.ts';

const logger = createLogger('api-proveedor:productos');

export async function getProductosDisponiblesOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: Record<string, unknown>
): Promise<Response> {
    const { busqueda, categoria, marca, limite, soloConStock, ordenarPor } = validateProductosParams(url);

    logger.info('PRODUCTOS_REQUEST', {
        ...requestLog,
        busqueda, categoria, marca, limite
    });

    try {
        const filtros = buildProductoFiltros(busqueda, categoria, marca, soloConStock);
        const orden = buildProductoOrder(ordenarPor);

        const query = `${supabaseUrl}/rest/v1/precios_proveedor?select=*&fuente=eq.Maxiconsumo Necochea&activo=eq.true${filtros}${orden}&limit=${limite}`;

        const [productosResponse, statsResponse, facetasResponse] = await Promise.allSettled([
            fetchWithTimeout(query, {
                headers: supabaseReadHeaders
            }, 5000),
            obtenerEstadisticasCategoriasOptimizado(supabaseUrl, supabaseReadHeaders),
            obtenerFacetasProductos(supabaseUrl, supabaseReadHeaders)
        ]);

        if (productosResponse.status === 'rejected') {
            throw fromFetchError(productosResponse.reason);
        }

        if (!productosResponse.value.ok) {
            throw await fromFetchResponse(productosResponse.value, 'Error en consulta de productos');
        }

        const productos = await productosResponse.value.json();

        const productosEnriquecidos = await Promise.allSettled(
            productos.map(async (producto: Record<string, unknown>) => {
                return {
                    ...producto,
                    precio_formateado: formatPrecio(producto.precio_actual as number),
                    stock_status: (producto.stock_disponible as number) > 0 ? 'disponible' : 'agotado',
                    categoria_slug: generateSlug((producto.categoria as string) || ''),
                    etiquetas_busqueda: generateSearchTags(producto.nombre as string, producto.marca as string),
                    competitiveness_score: calculateCompetitivenessScore(producto)
                };
            })
        );

        const productosFinales = productosEnriquecidos
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<unknown>).value);

        const preciosValores = productosFinales.map((p: Record<string, unknown>) => p.precio_actual).filter((v: unknown) => typeof v === 'number');
        const rangoPrecios = preciosValores.length > 0
            ? {
                min: Math.min(...preciosValores),
                max: Math.max(...preciosValores),
                promedio: preciosValores.reduce((sum: number, precio: number) => sum + precio, 0) / preciosValores.length
            }
            : { min: 0, max: 0, promedio: 0 };

        const estadisticas = {
            total_productos: productosFinales.length,
            productos_con_stock: productosFinales.filter((p: Record<string, unknown>) => (p.stock_disponible as number) > 0).length,
            marcas_unicas: [...new Set(productosFinales.map((p: Record<string, unknown>) => p.marca).filter(Boolean))].length,
            categorias_disponibles: statsResponse.status === 'fulfilled' ? statsResponse.value : [],
            facetas_busqueda: facetasResponse.status === 'fulfilled' ? facetasResponse.value : {},
            rango_precios: rangoPrecios
        };

        const data = {
            productos: productosFinales,
            estadisticas: estadisticas,
            filtros_aplicados: {
                busqueda: busqueda,
                categoria: categoria,
                marca: marca,
                solo_con_stock: soloConStock,
                ordenar_por: ordenarPor
            },
            metadatos_busqueda: {
                relevancia_score: calculateRelevanceScore(productosFinales, busqueda),
                tiempo_respuesta: Date.now() - new Date(requestLog.timestamp).getTime(),
                cache_score: 'high'
            },
            timestamp: new Date().toISOString()
        };

        logger.info('PRODUCTOS_SUCCESS', {
            ...requestLog,
            productos: productosFinales.length,
            cache_score: 'high'
        });

        return ok(data, 200, corsHeaders, { requestId: requestLog.requestId });

    } catch (error) {
        logger.error('PRODUCTOS_ERROR', {
            ...requestLog,
            error: (error as Error).message
        });

        throw toAppError(error, 'PRODUCTOS_ERROR', 500);
    }
}

function buildProductoFiltros(busqueda: string, categoria: string, marca: string, soloConStock: boolean): string {
    const filtros = [];

    if (busqueda) {
        filtros.push(`or=(nombre.ilike.*${encodeURIComponent(busqueda)}*,marca.ilike.*${encodeURIComponent(busqueda)}*)`);
    }

    if (categoria !== 'todos') {
        filtros.push(`categoria=eq.${encodeURIComponent(categoria)}`);
    }

    if (marca) {
        filtros.push(`marca=ilike.*${encodeURIComponent(marca)}*`);
    }

    if (soloConStock) {
        filtros.push(`stock_disponible=gt.0`);
    }

    return filtros.length > 0 ? '&' + filtros.join('&') : '';
}

function buildProductoOrder(ordenarPor: string): string {
    switch (ordenarPor) {
        case 'precio_asc': return '&order=precio_actual.asc';
        case 'precio_desc': return '&order=precio_actual.desc';
        case 'stock_desc': return '&order=stock_disponible.desc';
        case 'categoria_asc': return '&order=categoria.asc,nombre.asc';
        case 'nombre_asc':
        default: return '&order=nombre.asc';
    }
}

async function obtenerEstadisticasCategoriasOptimizado(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>
) {
    const query = `${supabaseUrl}/rest/v1/precios_proveedor?select=categoria,precio_actual,stock_disponible&fuente=eq.Maxiconsumo Necochea&activo=eq.true`;
    const response = await fetchWithTimeout(query, {
        headers: supabaseReadHeaders
    }, 3000);

    if (!response.ok) {
        throw await fromFetchResponse(response, 'Error obteniendo estadísticas de categorías');
    }

    const data = await response.json();
    const stats = data.reduce((acc: Record<string, { total: number; stock: number; precio_promedio: number }>, item: Record<string, unknown>) => {
        const cat = item.categoria as string;
        acc[cat] = acc[cat] || { total: 0, stock: 0, precio_promedio: 0 };
        acc[cat].total++;
        acc[cat].stock += (item.stock_disponible as number) || 0;
        acc[cat].precio_promedio += item.precio_actual as number;
        return acc;
    }, {} as Record<string, { total: number; stock: number; precio_promedio: number }>);

    Object.keys(stats).forEach(key => {
        stats[key].precio_promedio = stats[key].precio_promedio / stats[key].total;
    });

    return stats;
}

async function obtenerFacetasProductos(
    supabaseUrl: string,
    supabaseReadHeaders: Record<string, string>
) {
    const query = `${supabaseUrl}/rest/v1/precios_proveedor?select=marca,categoria&fuente=eq.Maxiconsumo Necochea&activo=eq.true`;
    const response = await fetchWithTimeout(query, {
        headers: supabaseReadHeaders
    }, 3000);

    if (!response.ok) {
        throw await fromFetchResponse(response, 'Error obteniendo facetas de productos');
    }

    const data = await response.json();
    const marcas = [...new Set(data.map((item: Record<string, unknown>) => item.marca).filter(Boolean))];
    const categorias = [...new Set(data.map((item: Record<string, unknown>) => item.categoria).filter(Boolean))];

    return {
        marcas,
        categorias
    };
}
