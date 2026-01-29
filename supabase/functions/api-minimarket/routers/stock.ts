/**
 * Router de Stock - api-minimarket
 * Handlers para gestión de stock
 * @module api-minimarket/routers/stock
 */

import { queryTable, fetchWithParams } from '../helpers/supabase.ts';
import { isUuid } from '../helpers/validation.ts';
import { parsePagination } from '../helpers/pagination.ts';
import { BASE_ROLES } from '../helpers/auth.ts';
import type { RouteHandler } from './types.ts';

// GET /stock
export const getStockHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, url } = ctx;
        checkRole(BASE_ROLES);

        const paginationResult = parsePagination(
                url.searchParams.get('limit'),
                url.searchParams.get('offset'),
                50,
                200
        );

        if (!paginationResult.ok) {
                return respondFail('VALIDATION_ERROR', paginationResult.error.message, 400);
        }
        const { limit, offset } = paginationResult.params;

        const params = new URLSearchParams();
        params.set('select', 'id,producto_id,cantidad,stock_minimo,productos(id,nombre,sku)');
        params.set('order', 'cantidad.asc');
        params.set('limit', String(limit));
        params.set('offset', String(offset));

        const { data, count } = await fetchWithParams(
                supabaseUrl,
                'stock',
                params,
                requestHeaders()
        );

        return respondOk(data, 200, { extra: { count: count ?? data.length } });
};

// GET /stock/minimo (bajo stock)
export const getStockMinimoHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, url } = ctx;
        checkRole(BASE_ROLES);

        const paginationResult = parsePagination(
                url.searchParams.get('limit'),
                url.searchParams.get('offset'),
                50,
                200
        );

        if (!paginationResult.ok) {
                return respondFail('VALIDATION_ERROR', paginationResult.error.message, 400);
        }
        const { limit, offset } = paginationResult.params;

        // Query que filtra donde cantidad <= stock_minimo
        const params = new URLSearchParams();
        params.set('select', 'id,producto_id,cantidad,stock_minimo,productos(id,nombre,sku)');
        params.set('order', 'cantidad.asc');
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        // Supabase permite filtros custom vía RLS o stored procedures
        // Para este caso simplemente traemos todos y filtramos

        const { data } = await fetchWithParams(
                supabaseUrl,
                'stock',
                params,
                requestHeaders()
        );

        // Filtrar productos con stock bajo
        interface StockItem {
                id: string;
                producto_id: string;
                cantidad: number;
                stock_minimo: number;
                productos?: { id: string; nombre: string; sku: string };
        }

        const stockBajo = (data as StockItem[]).filter(
                item => item.cantidad <= item.stock_minimo
        );

        return respondOk(stockBajo, 200, {
                extra: {
                        count: stockBajo.length,
                        message: `${stockBajo.length} productos con stock bajo el mínimo`
                }
        });
};

// GET /stock/producto/:id
export const getStockProductoHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, pathParams } = ctx;
        const productoId = pathParams?.id;

        checkRole(BASE_ROLES);

        if (!productoId || !isUuid(productoId)) {
                return respondFail('VALIDATION_ERROR', 'producto_id invalido', 400);
        }

        const stock = await queryTable(
                supabaseUrl,
                'stock',
                requestHeaders(),
                { producto_id: productoId },
                'id,producto_id,cantidad,stock_minimo,ubicacion',
                { limit: 1 }
        );

        if (stock.length === 0) {
                return respondFail('NOT_FOUND', 'Stock no encontrado para este producto', 404);
        }

        return respondOk(stock[0]);
};
