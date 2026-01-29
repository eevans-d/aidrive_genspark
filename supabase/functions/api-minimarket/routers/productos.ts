/**
 * Router de Productos - api-minimarket
 * Handlers para CRUD de productos
 * @module api-minimarket/routers/productos
 */

import { queryTable, queryTableWithCount, insertTable, updateTable, fetchWithParams } from '../helpers/supabase.ts';
import { isUuid, sanitizeTextParam, parseNonNegativeNumber, isValidCodigo } from '../helpers/validation.ts';
import { parsePagination } from '../helpers/pagination.ts';
import { BASE_ROLES } from '../helpers/auth.ts';
import type { RouterContext, RouteHandler } from './types.ts';

// GET /productos/dropdown
export const getProductosDropdownHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, checkRole } = ctx;
        checkRole(BASE_ROLES);

        const productos = await queryTable(
                supabaseUrl,
                'productos',
                requestHeaders(),
                { activo: true },
                'id,sku,nombre',
                { order: 'nombre', limit: 500 }
        );

        return respondOk(productos, 200, { message: 'Productos dropdown obtenidos' });
};

// GET /categorias
export const getCategoriasHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, checkRole } = ctx;
        checkRole(BASE_ROLES);

        const categorias = await queryTable(
                supabaseUrl,
                'categorias',
                requestHeaders(),
                { activo: true },
                'id,codigo,nombre,descripcion,margen_minimo,margen_maximo',
                { order: 'nombre' }
        );

        return respondOk(categorias, 200, { message: 'Categorias obtenidas exitosamente' });
};

// GET /categorias/:id
export const getCategoriaByIdHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, pathParams } = ctx;
        const id = pathParams?.id;

        if (!id || !isUuid(id)) {
                return respondFail('VALIDATION_ERROR', 'id de categoria invalido', 400);
        }

        checkRole(BASE_ROLES);
        const categorias = await queryTable(supabaseUrl, 'categorias', requestHeaders(), { id });

        if (categorias.length === 0) {
                return respondFail('NOT_FOUND', 'Categoria no encontrada', 404);
        }

        return respondOk(categorias[0]);
};

// GET /productos
export const getProductosHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, url } = ctx;
        checkRole(BASE_ROLES);

        const categoria = url.searchParams.get('categoria');
        const marca = url.searchParams.get('marca');
        const activo = url.searchParams.get('activo');
        const search = url.searchParams.get('search');

        const paginationResult = parsePagination(
                url.searchParams.get('limit'),
                url.searchParams.get('offset'),
                100,
                200
        );

        if (!paginationResult.ok) {
                return respondFail('VALIDATION_ERROR', paginationResult.error.message, 400);
        }
        const { limit, offset } = paginationResult.params;

        if (activo !== null && activo !== 'true' && activo !== 'false') {
                return respondFail('VALIDATION_ERROR', 'activo debe ser true o false', 400);
        }

        let categoriaId: string | null = null;
        if (categoria) {
                const categoriaCodigo = categoria.trim();
                if (!isValidCodigo(categoriaCodigo)) {
                        return respondFail('VALIDATION_ERROR', 'categoria invalida', 400);
                }
                const categorias = await queryTable(
                        supabaseUrl,
                        'categorias',
                        requestHeaders(),
                        { codigo: categoriaCodigo },
                        'id',
                        { limit: 1 }
                );
                if (categorias.length === 0) {
                        return respondOk([], 200, { extra: { count: 0 } });
                }
                categoriaId = (categorias[0] as { id: string }).id;
        }

        const params = new URLSearchParams();
        params.set(
                'select',
                'id,sku,nombre,marca,contenido_neto,activo,precio_actual,precio_costo,margen_ganancia,categoria_id'
        );

        if (activo !== null) params.append('activo', `eq.${activo === 'true'}`);
        if (categoriaId) params.append('categoria_id', `eq.${categoriaId}`);

        if (marca) {
                const sanitized = sanitizeTextParam(marca);
                if (!sanitized) {
                        return respondFail('VALIDATION_ERROR', 'marca invalida', 400);
                }
                params.append('marca', `ilike.*${sanitized}*`);
        }

        if (search) {
                const sanitized = sanitizeTextParam(search);
                if (!sanitized) {
                        return respondFail('VALIDATION_ERROR', 'search invalido', 400);
                }
                params.append('or', `(nombre.ilike.*${sanitized}*,sku.ilike.*${sanitized}*)`);
        }

        params.set('order', 'nombre');
        params.set('limit', String(limit));
        params.set('offset', String(offset));

        const { data: productos, count } = await fetchWithParams(
                supabaseUrl,
                'productos',
                params,
                requestHeaders()
        );

        return respondOk(productos, 200, {
                extra: { count: count ?? productos.length }
        });
};

// GET /productos/:id
export const getProductoByIdHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, pathParams } = ctx;
        const id = pathParams?.id;

        checkRole(BASE_ROLES);

        if (!id || !isUuid(id)) {
                return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
        }

        const productos = await queryTable(supabaseUrl, 'productos', requestHeaders(), { id });

        if (productos.length === 0) {
                return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
        }

        return respondOk(productos[0]);
};

// POST /productos
export const createProductoHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, parseJsonBody, user, logAudit } = ctx;
        checkRole(['admin', 'deposito']);

        const bodyResult = await parseJsonBody();
        if (bodyResult instanceof Response) return bodyResult;

        const { sku, nombre, categoria_id, marca, contenido_neto } = bodyResult as Record<string, unknown>;

        if (typeof nombre !== 'string' || nombre.trim() === '') {
                return respondFail('VALIDATION_ERROR', 'nombre es requerido', 400);
        }

        if (categoria_id !== undefined && categoria_id !== null && !isUuid(String(categoria_id))) {
                return respondFail('VALIDATION_ERROR', 'categoria_id invalido', 400);
        }

        const payload: Record<string, unknown> = {
                nombre: nombre.trim(),
                activo: true,
                created_by: user!.id,
        };

        if (typeof sku === 'string' && sku.trim()) {
                payload.sku = sku.trim();
        }
        if (categoria_id !== undefined && categoria_id !== null) {
                payload.categoria_id = String(categoria_id);
        }
        if (typeof marca === 'string' && marca.trim()) {
                payload.marca = marca.trim();
        }
        if (typeof contenido_neto === 'string' && contenido_neto.trim()) {
                payload.contenido_neto = contenido_neto.trim();
        }
        if (typeof contenido_neto === 'number') {
                payload.contenido_neto = String(contenido_neto);
        }

        const producto = await insertTable(supabaseUrl, 'productos', requestHeaders(), payload);
        const productoCreado = (producto as unknown[])[0] as Record<string, unknown>;

        await logAudit(
                'producto_creado',
                'productos',
                String(productoCreado.id),
                { nombre: payload.nombre, sku: payload.sku },
                'info'
        );

        return respondOk(productoCreado, 201, { message: 'Producto creado exitosamente' });
};

// PUT /productos/:id
export const updateProductoHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, parseJsonBody, user, pathParams } = ctx;
        const id = pathParams?.id;

        checkRole(['admin', 'deposito']);

        if (!id || !isUuid(id)) {
                return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
        }

        const bodyResult = await parseJsonBody();
        if (bodyResult instanceof Response) return bodyResult;

        const body = bodyResult as Record<string, unknown>;
        const updates: Record<string, unknown> = {};

        if (body.sku !== undefined) {
                if (typeof body.sku !== 'string' || !body.sku.trim()) {
                        return respondFail('VALIDATION_ERROR', 'sku invalido', 400);
                }
                updates.sku = body.sku.trim();
        }

        if (body.nombre !== undefined) {
                if (typeof body.nombre !== 'string' || !body.nombre.trim()) {
                        return respondFail('VALIDATION_ERROR', 'nombre invalido', 400);
                }
                updates.nombre = body.nombre.trim();
        }

        if (body.categoria_id !== undefined) {
                if (body.categoria_id === null) {
                        updates.categoria_id = null;
                } else if (!isUuid(String(body.categoria_id))) {
                        return respondFail('VALIDATION_ERROR', 'categoria_id invalido', 400);
                } else {
                        updates.categoria_id = String(body.categoria_id);
                }
        }

        if (body.activo !== undefined) {
                if (typeof body.activo !== 'boolean') {
                        return respondFail('VALIDATION_ERROR', 'activo invalido', 400);
                }
                updates.activo = body.activo;
        }

        if (body.precio_actual !== undefined) {
                const valor = parseNonNegativeNumber(body.precio_actual);
                if (valor === null) {
                        return respondFail('VALIDATION_ERROR', 'precio_actual invalido', 400);
                }
                updates.precio_actual = valor;
        }

        if (body.precio_costo !== undefined) {
                const valor = parseNonNegativeNumber(body.precio_costo);
                if (valor === null) {
                        return respondFail('VALIDATION_ERROR', 'precio_costo invalido', 400);
                }
                updates.precio_costo = valor;
        }

        if (Object.keys(updates).length === 0) {
                return respondFail('VALIDATION_ERROR', 'Sin campos validos para actualizar', 400);
        }

        const producto = await updateTable(supabaseUrl, 'productos', id, requestHeaders(), {
                ...updates,
                updated_at: new Date().toISOString(),
                updated_by: user!.id,
        });

        if ((producto as unknown[]).length === 0) {
                return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
        }

        return respondOk((producto as unknown[])[0], 200, { message: 'Producto actualizado exitosamente' });
};

// DELETE /productos/:id (soft delete)
export const deleteProductoHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, user, logAudit, pathParams } = ctx;
        const id = pathParams?.id;

        checkRole(['admin']);

        if (!id || !isUuid(id)) {
                return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
        }

        const producto = await updateTable(supabaseUrl, 'productos', id, requestHeaders(), {
                activo: false,
                updated_at: new Date().toISOString(),
                updated_by: user!.id,
        });

        if ((producto as unknown[]).length === 0) {
                return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
        }

        const productoEliminado = (producto as unknown[])[0] as Record<string, unknown>;

        await logAudit(
                'producto_eliminado',
                'productos',
                id,
                { nombre: productoEliminado.nombre },
                'warning'
        );

        return respondOk(productoEliminado, 200, { message: 'Producto desactivado exitosamente' });
};
