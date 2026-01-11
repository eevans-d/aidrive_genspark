import { validateProductosParams } from '../validators.ts';
import { calculateCompetitivenessScore, calculateRelevanceScore, formatPrecio, generateSearchTags, generateSlug } from '../utils/format.ts';
import { createLogger } from '../../_shared/logger.ts';
import { ok } from '../../_shared/response.ts';

const logger = createLogger('api-proveedor:productos');

export async function getProductosDisponiblesOptimizado(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: URL,
    corsHeaders: Record<string, string>,
    isAuthenticated: boolean,
    requestLog: any
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
            fetch(query, {
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                }
            }),
            obtenerEstadisticasCategoriasOptimizado(supabaseUrl, serviceRoleKey),
            obtenerFacetasProductos(supabaseUrl, serviceRoleKey)
        ]);

        if (productosResponse.status === 'rejected') {
            throw new Error(`Error en consulta de productos: ${productosResponse.reason}`);
        }

        const productos = await productosResponse.value.json();

        const productosEnriquecidos = await Promise.allSettled(
            productos.map(async (producto: any) => {
                return {
                    ...producto,
                    precio_formateado: formatPrecio(producto.precio_actual),
                    stock_status: producto.stock_disponible > 0 ? 'disponible' : 'agotado',
                    categoria_slug: generateSlug(producto.categoria || ''),
                    etiquetas_busqueda: generateSearchTags(producto.nombre, producto.marca),
                    competitiveness_score: calculateCompetitivenessScore(producto)
                };
            })
        );

        const productosFinales = productosEnriquecidos
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value);

        const preciosValores = productosFinales.map((p: any) => p.precio_actual).filter((v: any) => typeof v === 'number');
        const rangoPrecios = preciosValores.length > 0
            ? {
                min: Math.min(...preciosValores),
                max: Math.max(...preciosValores),
                promedio: preciosValores.reduce((sum: number, precio: number) => sum + precio, 0) / preciosValores.length
            }
            : { min: 0, max: 0, promedio: 0 };

        const estadisticas = {
            total_productos: productosFinales.length,
            productos_con_stock: productosFinales.filter((p: any) => p.stock_disponible > 0).length,
            marcas_unicas: [...new Set(productosFinales.map((p: any) => p.marca).filter(Boolean))].length,
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

        throw new Error(`Error obteniendo productos optimizado: ${(error as Error).message}`);
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

async function obtenerEstadisticasCategoriasOptimizado(supabaseUrl: string, serviceRoleKey: string) {
    const query = `${supabaseUrl}/rest/v1/precios_proveedor?select=categoria,precio_actual,stock_disponible&fuente=eq.Maxiconsumo Necochea&activo=eq.true`;
    const response = await fetch(query, {
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
        }
    });

    if (!response.ok) {
        throw new Error('Error obteniendo estadísticas de categorías');
    }

    const data = await response.json();
    const stats = data.reduce((acc: any, item: any) => {
        acc[item.categoria] = acc[item.categoria] || { total: 0, stock: 0, precio_promedio: 0 };
        acc[item.categoria].total++;
        acc[item.categoria].stock += item.stock_disponible || 0;
        acc[item.categoria].precio_promedio += item.precio_actual;
        return acc;
    }, {} as Record<string, any>);

    Object.keys(stats).forEach(key => {
        stats[key].precio_promedio = stats[key].precio_promedio / stats[key].total;
    });

    return stats;
}

async function obtenerFacetasProductos(supabaseUrl: string, serviceRoleKey: string) {
    const query = `${supabaseUrl}/rest/v1/precios_proveedor?select=marca,categoria&fuente=eq.Maxiconsumo Necochea&activo=eq.true`;
    const response = await fetch(query, {
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
        }
    });

    if (!response.ok) {
        throw new Error('Error obteniendo facetas de productos');
    }

    const data = await response.json();
    const marcas = [...new Set(data.map((item: any) => item.marca).filter(Boolean))];
    const categorias = [...new Set(data.map((item: any) => item.categoria).filter(Boolean))];

    return {
        marcas,
        categorias
    };
}
