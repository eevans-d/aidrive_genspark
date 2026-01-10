// ============================================================================
// MINI MARKET API GATEWAY - Sistema Completo RESTful
// ============================================================================
// 19 Endpoints con autenticación JWT y control de roles
// Integración completa con funciones PL/pgSQL del Sprint 3-4
// ============================================================================

import { createLogger } from '../_shared/logger.ts';
import {
  parseAllowedOrigins,
  validateOrigin,
  handleCors,
} from '../_shared/cors.ts';
import { ok, fail } from '../_shared/response.ts';
import {
  toAppError,
  fromFetchResponse,
  getErrorStatus,
  isAppError,
} from '../_shared/errors.ts';

const logger = createLogger('api-minimarket');

const FUNCTION_BASE_PATH = '/api-minimarket';

function normalizePathname(pathname: string): string {
  if (pathname === FUNCTION_BASE_PATH) return '/';
  if (pathname.startsWith(`${FUNCTION_BASE_PATH}/`)) {
    const stripped = pathname.slice(FUNCTION_BASE_PATH.length);
    return stripped === '' ? '/' : stripped;
  }
  return pathname;
}

function generateRequestId(req: Request): string {
  return (
    req.headers.get('x-request-id') ||
    crypto.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

Deno.serve(async (req) => {
  const requestId = generateRequestId(req);
  const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  const corsResult = validateOrigin(req, allowedOrigins);
  const corsHeaders = corsResult.headers;
  const responseHeaders = { ...corsHeaders, 'x-request-id': requestId };

  // CORS: Block disallowed origins with standard error response
  if (!corsResult.allowed) {
    logger.warn('CORS_BLOCKED', { requestId, origin: corsResult.origin });
    return fail(
      'CORS_ORIGIN_NOT_ALLOWED',
      'Origin not allowed by CORS policy',
      403,
      responseHeaders,
      { requestId },
    );
  }

  // Handle OPTIONS preflight
  const preflightResponse = handleCors(req, responseHeaders);
  if (preflightResponse) {
    return preflightResponse;
  }

  const url = new URL(req.url);
  const path = normalizePathname(url.pathname);
  const method = req.method;
  const requestLog = {
    requestId,
    method,
    path,
    timestamp: new Date().toISOString(),
  };

  try {
    // Configuración Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw toAppError(
        new Error('Configuración de Supabase faltante'),
        'CONFIG_ERROR',
        500,
      );
    }

    // Autenticación
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    let user = null;
    let userRole: string | null = null;

    if (token) {
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      });

      if (userResponse.ok) {
        user = await userResponse.json();
        const rawRole = user.app_metadata?.role ?? user.user_metadata?.role ?? null;
        userRole = typeof rawRole === 'string' ? rawRole.toLowerCase() : null;
      }
    }

    // Helper: Verificar permisos por rol
    const BASE_ROLES = ['admin', 'deposito', 'ventas'];
    const checkRole = (allowedRoles: string[]) => {
      if (!user) {
        throw toAppError(
          new Error('No autorizado - requiere autenticación'),
          'UNAUTHORIZED',
          401,
        );
      }
      const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());
      if (!userRole || !normalizedRoles.includes(userRole)) {
        throw toAppError(
          new Error(`Acceso denegado - requiere rol: ${allowedRoles.join(' o ')}`),
          'FORBIDDEN',
          403,
        );
      }
    };

    const requestHeaders = (extraHeaders: Record<string, string> = {}) => ({
      Authorization: `Bearer ${token || supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      ...extraHeaders,
    });

    const buildQueryUrl = (
      table: string,
      filters: Record<string, unknown> = {},
      select = '*',
      options: { order?: string; limit?: number; offset?: number } = {},
    ) => {
      const params = new URLSearchParams();
      params.set('select', select);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, `eq.${String(value)}`);
        }
      });

      if (options.order) params.set('order', options.order);
      if (options.limit !== undefined) params.set('limit', String(options.limit));
      if (options.offset !== undefined) params.set('offset', String(options.offset));

      return `${supabaseUrl}/rest/v1/${table}?${params.toString()}`;
    };

    const parseContentRange = (value: string | null): number | null => {
      if (!value) return null;
      const parts = value.split('/');
      if (parts.length < 2) return null;
      const total = parts[1];
      if (total === '*') return null;
      const count = Number(total);
      return Number.isFinite(count) ? count : null;
    };

    // Helper: Query directo a PostgREST
    const queryTable = async (
      table: string,
      filters: Record<string, unknown> = {},
      select = '*',
      options: { order?: string; limit?: number; offset?: number } = {},
    ) => {
      const queryUrl = buildQueryUrl(table, filters, select, options);

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: requestHeaders(),
      });

      if (!response.ok) {
        throw await fromFetchResponse(response, `Error query ${table}`);
      }

      return await response.json();
    };

    const queryTableWithCount = async (
      table: string,
      filters: Record<string, unknown> = {},
      select = '*',
      options: { order?: string; limit?: number; offset?: number } = {},
    ) => {
      const queryUrl = buildQueryUrl(table, filters, select, options);

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: requestHeaders({ Prefer: 'count=exact' }),
      });

      if (!response.ok) {
        throw await fromFetchResponse(response, `Error query ${table}`);
      }

      const data = await response.json();
      const count = parseContentRange(response.headers.get('content-range'));
      return { data, count: count ?? data.length };
    };

    // Helper: INSERT a tabla
    const insertTable = async (table: string, data: unknown) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: requestHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await fromFetchResponse(response, `Error insertando en ${table}`);
      }

      return await response.json();
    };

    // Helper: UPDATE tabla
    const updateTable = async (table: string, id: string, data: unknown) => {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: requestHeaders({ Prefer: 'return=representation' }),
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await fromFetchResponse(response, `Error actualizando ${table}`);
      }

      return await response.json();
    };

    // Helper: Ejecutar función PL/pgSQL
    const callFunction = async (
      functionName: string,
      params: Record<string, unknown> = {},
    ) => {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/${functionName}`,
        {
          method: 'POST',
          headers: requestHeaders(),
          body: JSON.stringify(params),
        },
      );

      if (!response.ok) {
        throw await fromFetchResponse(response, `Error llamando ${functionName}`);
      }

      return await response.json();
    };

    const respondOk = <T>(
      data: T,
      status = 200,
      options: { message?: string; extra?: Record<string, unknown> } = {},
    ) => ok(data, status, responseHeaders, { requestId, ...options });

    const respondFail = (
      code: string,
      message: string,
      status = 400,
      options: { details?: unknown; message?: string; extra?: Record<string, unknown> } = {},
    ) => fail(code, message, status, responseHeaders, { requestId, ...options });

    const parseJsonBody = async <T = Record<string, unknown>>(): Promise<T | Response> => {
      try {
        return (await req.json()) as T;
      } catch {
        return respondFail('INVALID_JSON', 'Cuerpo JSON invalido', 400);
      }
    };

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const isUuid = (value: string | null): value is string =>
      typeof value === 'string' && UUID_REGEX.test(value);

    const parsePositiveNumber = (value: unknown): number | null => {
      if (typeof value !== 'string' && typeof value !== 'number') return null;
      const num = Number(value);
      return Number.isFinite(num) && num > 0 ? num : null;
    };

    const parseNonNegativeNumber = (value: unknown): number | null => {
      if (typeof value !== 'string' && typeof value !== 'number') return null;
      const num = Number(value);
      return Number.isFinite(num) && num >= 0 ? num : null;
    };

    const parsePositiveInt = (value: unknown): number | null => {
      if (typeof value !== 'string' && typeof value !== 'number') return null;
      const num = Number(value);
      return Number.isInteger(num) && num > 0 ? num : null;
    };

    const parseNonNegativeInt = (value: unknown): number | null => {
      if (typeof value !== 'string' && typeof value !== 'number') return null;
      const num = Number(value);
      return Number.isInteger(num) && num >= 0 ? num : null;
    };

    const getPagination = (
      limitParam: string | null,
      offsetParam: string | null,
      defaultLimit: number,
      maxLimit: number,
    ): { limit: number; offset: number } | Response => {
      const limitValue = limitParam === null ? defaultLimit : parsePositiveInt(limitParam);
      if (limitValue === null) {
        return respondFail('VALIDATION_ERROR', 'limit debe ser un entero > 0', 400);
      }
      const offsetValue = offsetParam === null ? 0 : parseNonNegativeInt(offsetParam);
      if (offsetValue === null) {
        return respondFail('VALIDATION_ERROR', 'offset debe ser un entero >= 0', 400);
      }
      return {
        limit: Math.min(limitValue, maxLimit),
        offset: offsetValue,
      };
    };

    const sanitizeTextParam = (value: string): string =>
      value.trim().replace(/[^a-zA-Z0-9 _.-]/g, '');

    const VALID_MOVIMIENTO_TIPOS = new Set(['entrada', 'salida', 'ajuste', 'transferencia']);

    // ====================================================================
    // ENDPOINTS: CATEGORÍAS (2 endpoints)
    // ====================================================================

    // 1. GET /categorias - Listar todas las categorías
    if (path === '/categorias' && method === 'GET') {
      checkRole(BASE_ROLES);

      const categorias = await queryTable(
        'categorias',
        { activo: true },
        'id,codigo,nombre,descripcion,margen_minimo,margen_maximo',
        { order: 'nombre' },
      );

      return respondOk(categorias, 200, {
        message: 'Categorias obtenidas exitosamente',
      });
    }

    // 2. GET /categorias/:id - Detalle de categoría específica
    if (path.match(/^\/categorias\/[a-f0-9-]+$/) && method === 'GET') {
      const id = path.split('/')[2];
      if (!isUuid(id)) {
        return respondFail('VALIDATION_ERROR', 'id de categoria invalido', 400);
      }

      checkRole(BASE_ROLES);
      const categorias = await queryTable('categorias', { id });

      if (categorias.length === 0) {
        return respondFail('NOT_FOUND', 'Categoria no encontrada', 404);
      }

      return respondOk(categorias[0]);
    }

        // ====================================================================
        // ENDPOINTS: PRODUCTOS (5 endpoints)
        // ====================================================================

        // 3. GET /productos - Listar productos con filtros
        if (path === '/productos' && method === 'GET') {
            const categoria = url.searchParams.get('categoria');
            const marca = url.searchParams.get('marca');
            const activo = url.searchParams.get('activo');
            const search = url.searchParams.get('search');

            let filters = {};
            if (activo !== null) filters.activo = activo === 'true';

            const productos = await queryTable('productos', filters,
                'id,sku,nombre,marca,contenido_neto,activo,precio_actual,precio_costo,margen_ganancia,categoria_id',
                { order: 'nombre', limit: 100 }
            );

            // Filtros adicionales en memoria (PostgREST tiene limitaciones)
            let filteredProductos = productos;
            
            if (categoria || marca || search) {
                const categorias = await queryTable('categorias');
                const categoriasMap = Object.fromEntries(categorias.map(c => [c.id, c]));

                filteredProductos = productos.filter(p => {
                    const cat = categoriasMap[p.categoria_id];
                    if (categoria && cat?.codigo !== categoria) return false;
                    if (marca && !p.marca?.toLowerCase().includes(marca.toLowerCase())) return false;
                    if (search && !(p.nombre?.toLowerCase().includes(search.toLowerCase()) || 
                                    p.sku?.toLowerCase().includes(search.toLowerCase()))) return false;
                    return true;
                });
            }

            return respondOk(filteredProductos, 200, {
              extra: { count: filteredProductos.length },
            });
        }

        // 4. GET /productos/:id - Detalle de producto específico
        if (path.match(/^\/productos\/[a-f0-9-]+$/) && method === 'GET') {
            const id = path.split('/')[2];
            const productos = await queryTable('productos', { id });

            if (productos.length === 0) {
              return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
            }

            return respondOk(productos[0]);
        }

        // 5. POST /productos - Crear nuevo producto (admin/deposito)
        if (path === '/productos' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { sku, nombre, categoria_id, marca, contenido_neto } = body;

            if (!nombre) {
              return respondFail('VALIDATION_ERROR', 'El nombre es requerido', 400);
            }

            const producto = await insertTable('productos', {
                sku,
                nombre,
                categoria_id,
                marca,
                contenido_neto,
                activo: true,
                created_by: user.id
            });

            return respondOk(producto[0], 201, { message: 'Producto creado exitosamente' });
        }

        // 6. PUT /productos/:id - Actualizar producto (admin/deposito)
        if (path.match(/^\/productos\/[a-f0-9-]+$/) && method === 'PUT') {
            checkRole(['admin', 'deposito']);

            const id = path.split('/')[2];
            const body = await req.json();

            const producto = await updateTable('productos', id, {
                ...body,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            });

            if (producto.length === 0) {
              return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
            }

            return respondOk(producto[0], 200, { message: 'Producto actualizado exitosamente' });
        }

        // 7. DELETE /productos/:id - Eliminar producto (soft delete - admin)
        if (path.match(/^\/productos\/[a-f0-9-]+$/) && method === 'DELETE') {
            checkRole(['admin']);

            const id = path.split('/')[2];
            const producto = await updateTable('productos', id, {
                activo: false,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            });

            if (producto.length === 0) {
              return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
            }

            return respondOk(null, 200, { message: 'Producto desactivado exitosamente' });
        }

        // ====================================================================
        // ENDPOINTS: PROVEEDORES (2 endpoints)
        // ====================================================================

        // 8. GET /proveedores - Listar proveedores
        if (path === '/proveedores' && method === 'GET') {
            const proveedores = await queryTable('proveedores', 
                { activo: true }, 
                'id,nombre,contacto,email,telefono,productos_ofrecidos',
                { order: 'nombre' }
            );

            return respondOk(proveedores, 200, { extra: { count: proveedores.length } });
        }

        // 9. GET /proveedores/:id - Detalle de proveedor
        if (path.match(/^\/proveedores\/[a-f0-9-]+$/) && method === 'GET') {
            const id = path.split('/')[2];
            const proveedores = await queryTable('proveedores', { id });

            if (proveedores.length === 0) {
              return respondFail('NOT_FOUND', 'Proveedor no encontrado', 404);
            }

            return respondOk(proveedores[0]);
        }

        // ====================================================================
        // ENDPOINTS: PRECIOS (4 endpoints)
        // ====================================================================

        // 10. POST /precios/aplicar - Aplicar precio a producto con redondeo automático (admin)
        if (path === '/precios/aplicar' && method === 'POST') {
            checkRole(['admin']);

            const body = await req.json();
            const { producto_id, precio_compra, margen_ganancia } = body;

            if (!producto_id || precio_compra === undefined || precio_compra === null) {
              return respondFail('VALIDATION_ERROR', 'producto_id y precio_compra son requeridos', 400);
            }

            const precioCompraNumero = Number(precio_compra);

            if (!Number.isFinite(precioCompraNumero) || precioCompraNumero <= 0) {
              return respondFail('VALIDATION_ERROR', 'precio_compra debe ser mayor que 0', 400);
            }

            const productos = await queryTable('productos', { id: producto_id }, 'id,categoria_id,precio_actual,margen_ganancia');

            if (productos.length === 0) {
              return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
            }

            const producto = productos[0];
            const categorias = producto.categoria_id
                ? await queryTable('categorias', { id: producto.categoria_id }, 'id,margen_minimo')
                : [];
            const categoria = categorias[0];
            const margenMinimo = categoria?.margen_minimo;

            const margenGananciaNumero = margen_ganancia !== undefined && margen_ganancia !== null
                ? Number(margen_ganancia)
                : null;
            const margenProductoNumero = producto.margen_ganancia !== undefined && producto.margen_ganancia !== null
                ? Number(producto.margen_ganancia)
                : null;

            let margenProyectado = null;
            if (Number.isFinite(margenGananciaNumero)) {
                margenProyectado = margenGananciaNumero;
            } else if (Number.isFinite(margenProductoNumero)) {
                margenProyectado = margenProductoNumero;
            } else if (producto.precio_actual !== undefined && producto.precio_actual !== null) {
                const precioActualNumero = Number(producto.precio_actual);
                if (Number.isFinite(precioActualNumero) && precioActualNumero > 0) {
                    margenProyectado = ((precioActualNumero - precioCompraNumero) / precioActualNumero) * 100;
                }
            }

            if (margenMinimo !== undefined && margenMinimo !== null && Number.isFinite(Number(margenMinimo))) {
                if (margenProyectado !== null && margenProyectado < Number(margenMinimo)) {
                                        return respondFail(
                                            'MARGIN_BELOW_MINIMUM',
                                            'Margen proyectado por debajo del mínimo de categoría. Requiere aprobación.',
                                            409,
                                            {
                                                details: {
                                                    margen_minimo: Number(margenMinimo),
                                                    margen_proyectado: margenProyectado,
                                                    requiere_aprobacion: true,
                                                },
                                            },
                                        );
                }
            }

            // Llamar a sp_aplicar_precio (incluye redondeo automático)
            const result = await callFunction('sp_aplicar_precio', {
                p_producto_id: producto_id,
                p_precio_compra: precioCompraNumero,
                p_margen_ganancia: margen_ganancia !== undefined && margen_ganancia !== null
                    ? margen_ganancia
                    : null
            });

            return respondOk(result, 200, { message: 'Precio aplicado y redondeado exitosamente' });
        }

        // 11. GET /precios/producto/:id - Historial de precios de un producto
        if (path.match(/^\/precios\/producto\/[a-f0-9-]+$/) && method === 'GET') {
            const productoId = path.split('/')[3];
            
            const historial = await queryTable('precios_historicos',
                { producto_id: productoId },
                'id,producto_id,precio_anterior,precio_nuevo,fecha_cambio,motivo_cambio',
                { order: 'fecha_cambio.desc', limit: 50 }
            );

            return respondOk(historial, 200, { extra: { count: historial.length } });
        }

        // 12. POST /precios/redondear - Redondear un precio (función de utilidad)
        if (path === '/precios/redondear' && method === 'POST') {
            const body = await req.json();
            const { precio } = body;

            if (!precio) {
              return respondFail('VALIDATION_ERROR', 'El precio es requerido', 400);
            }

            const result = await callFunction('fnc_redondear_precio', {
                precio: parseFloat(precio)
            });

                        return respondOk(
                            {
                                precio_original: parseFloat(precio),
                                precio_redondeado: result,
                            },
                            200,
                            { message: 'Precio redondeado exitosamente' },
                        );
        }

        // 13. GET /precios/margen-sugerido/:id - Calcular margen sugerido para producto
        if (path.match(/^\/precios\/margen-sugerido\/[a-f0-9-]+$/) && method === 'GET') {
            const productoId = path.split('/')[3];

            const result = await callFunction('fnc_margen_sugerido', {
                p_producto_id: productoId
            });

            return respondOk({
              producto_id: productoId,
              margen_sugerido: result,
            });
        }

        // ====================================================================
        // ENDPOINTS: STOCK E INVENTARIO (6 endpoints)
        // ====================================================================

        // 14. GET /stock - Consultar stock general de todos los productos
        if (path === '/stock' && method === 'GET') {
            const stock = await queryTable('stock_deposito',
                {},
                'id,producto_id,cantidad_actual,stock_minimo,stock_maximo,ubicacion,lote,fecha_vencimiento',
                { order: 'producto_id' }
            );

            // Obtener nombres de productos
            const productoIds = [...new Set(stock.map(s => s.producto_id))];
            const productos = await queryTable('productos', {}, 
                'id,sku,nombre,marca');
            const productosMap = Object.fromEntries(productos.map(p => [p.id, p]));

            const stockConNombres = stock.map(s => ({
                ...s,
                producto: productosMap[s.producto_id]
            }));

            return respondOk(stockConNombres, 200, { extra: { count: stockConNombres.length } });
        }

        // 15. GET /stock/minimo - Productos con stock bajo mínimo
        if (path === '/stock/minimo' && method === 'GET') {
            const result = await callFunction('fnc_productos_bajo_minimo');

            return respondOk(result, 200, {
              message: 'Productos bajo stock mínimo consultados',
              extra: { count: (result as unknown[] | null)?.length || 0 },
            });
        }

        // 16. GET /stock/producto/:id - Stock específico de un producto
        if (path.match(/^\/stock\/producto\/[a-f0-9-]+$/) && method === 'GET') {
            const productoId = path.split('/')[3];
            const deposito = url.searchParams.get('deposito') || 'Principal';

            const stockDisponible = await callFunction('fnc_stock_disponible', {
                p_producto_id: productoId,
                p_deposito: deposito
            });

            const stockDetalle = await queryTable('stock_deposito',
                { producto_id: productoId });

            return respondOk({
              producto_id: productoId,
              deposito,
              stock_disponible: stockDisponible,
              detalle: stockDetalle[0] || null,
            });
        }

        // 17. GET /reportes/efectividad-tareas - Métricas de efectividad por usuario
        if (path === '/reportes/efectividad-tareas' && method === 'GET') {
            checkRole(['admin', 'deposito', 'ventas']);

            const usuarioId = url.searchParams.get('usuario_id');
            const fechaDesde = url.searchParams.get('fecha_desde');
            const fechaHasta = url.searchParams.get('fecha_hasta');

            const queryParams = new URLSearchParams();
            queryParams.set('select', 'asignado_a_id,estado,tiempo_resolucion,cumplimiento_sla,dias_atraso,fecha_completado');

            if (usuarioId) {
                queryParams.append('asignado_a_id', `eq.${usuarioId}`);
            }
            if (fechaDesde) {
                queryParams.append('fecha_completado', `gte.${fechaDesde}`);
            }
            if (fechaHasta) {
                queryParams.append('fecha_completado', `lte.${fechaHasta}`);
            }

            const reportResponse = await fetch(
                `${supabaseUrl}/rest/v1/tareas_metricas?${queryParams.toString()}`,
                {
                    headers: requestHeaders()
                }
            );

            if (!reportResponse.ok) {
              throw await fromFetchResponse(reportResponse, 'Error consultando tareas_metricas');
            }

            const rows = await reportResponse.json();
            const agregados = {};

            for (const row of rows) {
                const usuarioKey = row.asignado_a_id || 'sin_asignar';
                if (!agregados[usuarioKey]) {
                    agregados[usuarioKey] = {
                        usuario_id: row.asignado_a_id,
                        tareas_total: 0,
                        tareas_completadas: 0,
                        tiempo_resolucion_promedio_horas: 0,
                        dias_atraso_promedio: 0,
                        cumplimiento_sla_pct: null,
                        sla_cumplidas: 0,
                        sla_incumplidas: 0,
                        _acumulado_resolucion: 0,
                        _acumulado_atraso: 0,
                        _count_resolucion: 0,
                        _count_atraso: 0
                    };
                }

                const entry = agregados[usuarioKey];
                entry.tareas_total += 1;

                if (row.estado && row.estado.toLowerCase() === 'completada') {
                    entry.tareas_completadas += 1;
                }

                if (row.tiempo_resolucion !== null && row.tiempo_resolucion !== undefined) {
                    entry._acumulado_resolucion += Number(row.tiempo_resolucion);
                    entry._count_resolucion += 1;
                }

                if (row.dias_atraso !== null && row.dias_atraso !== undefined) {
                    entry._acumulado_atraso += Number(row.dias_atraso);
                    entry._count_atraso += 1;
                }

                if (row.cumplimiento_sla === true) {
                    entry.sla_cumplidas += 1;
                } else if (row.cumplimiento_sla === false) {
                    entry.sla_incumplidas += 1;
                }
            }

            const data = Object.values(agregados).map((entry) => {
                const cumplimientoTotal = entry.sla_cumplidas + entry.sla_incumplidas;
                return {
                    usuario_id: entry.usuario_id,
                    tareas_total: entry.tareas_total,
                    tareas_completadas: entry.tareas_completadas,
                    tiempo_resolucion_promedio_horas: entry._count_resolucion
                        ? Number((entry._acumulado_resolucion / entry._count_resolucion).toFixed(2))
                        : null,
                    dias_atraso_promedio: entry._count_atraso
                        ? Number((entry._acumulado_atraso / entry._count_atraso).toFixed(2))
                        : null,
                    cumplimiento_sla_pct: cumplimientoTotal
                        ? Number(((entry.sla_cumplidas / cumplimientoTotal) * 100).toFixed(2))
                        : null,
                    sla_cumplidas: entry.sla_cumplidas,
                    sla_incumplidas: entry.sla_incumplidas
                };
            });

            data.sort((a, b) => b.tareas_total - a.tareas_total);

            return respondOk(data, 200, {
              extra: {
                count: data.length,
                filtros: {
                  usuario_id: usuarioId,
                  fecha_desde: fechaDesde,
                  fecha_hasta: fechaHasta,
                },
              },
            });
        }

        // 18. POST /deposito/movimiento - Registrar movimiento de inventario (admin/deposito)
        if (path === '/deposito/movimiento' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { producto_id, tipo_movimiento, cantidad, origen, destino, motivo } = body;

            if (!producto_id || !tipo_movimiento || !cantidad) {
              return respondFail(
                'VALIDATION_ERROR',
                'producto_id, tipo_movimiento y cantidad son requeridos',
                400,
              );
            }

            // Llamar a sp_movimiento_inventario
            const result = await callFunction('sp_movimiento_inventario', {
                p_producto_id: producto_id,
                p_tipo: tipo_movimiento,
                p_cantidad: parseInt(cantidad),
                p_origen: origen || motivo || null,
                p_destino: destino || null,
                p_usuario: user.id
            });

            return respondOk(result, 201, { message: 'Movimiento registrado exitosamente' });
        }

        // 19. GET /deposito/movimientos - Historial de movimientos
        if (path === '/deposito/movimientos' && method === 'GET') {
            const productoId = url.searchParams.get('producto_id');
            const tipoMovimiento = url.searchParams.get('tipo_movimiento');
            const limit = url.searchParams.get('limit') || '50';

            let filters = {};
            if (productoId) filters.producto_id = productoId;
            if (tipoMovimiento) filters.tipo_movimiento = tipoMovimiento;

            const movimientos = await queryTable('movimientos_deposito',
                filters,
                'id,producto_id,tipo_movimiento,cantidad,motivo,fecha_movimiento,usuario_id',
                { order: 'fecha_movimiento.desc', limit: parseInt(limit) }
            );

            return respondOk(movimientos, 200, { extra: { count: movimientos.length } });
        }

        // 20. POST /deposito/ingreso - Ingreso de mercadería (admin/deposito)
        if (path === '/deposito/ingreso' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { producto_id, cantidad, proveedor_id, precio_compra, deposito } = body;

            if (!producto_id || !cantidad) {
              return respondFail('VALIDATION_ERROR', 'producto_id y cantidad son requeridos', 400);
            }

            // Registrar movimiento de ingreso
            const movimiento = await callFunction('sp_movimiento_inventario', {
                p_producto_id: producto_id,
                p_tipo: 'entrada',
                p_cantidad: parseInt(cantidad),
                p_origen: `Proveedor:${proveedor_id || 'N/A'}`,
                p_destino: deposito || 'Principal',
                p_usuario: user.id
            });

            // Si hay precio de compra, registrar en precios_proveedor
            if (precio_compra && proveedor_id) {
                await insertTable('precios_proveedor', {
                    proveedor_id,
                    producto_id,
                    precio: parseFloat(precio_compra),
                    fecha_actualizacion: new Date().toISOString()
                });
            }

            return respondOk(movimiento, 201, { message: 'Ingreso de mercadería registrado exitosamente' });
        }

        // 20. POST /reservas - Crear reserva de stock
        if (path === '/reservas' && method === 'POST') {
            checkRole(['admin', 'ventas', 'deposito']);

            const body = await req.json();
            const { producto_id, cantidad, referencia, deposito } = body;

            if (!producto_id || !cantidad) {
              return respondFail('VALIDATION_ERROR', 'producto_id y cantidad son requeridos', 400);
            }

            const stockInfo = await callFunction('fnc_stock_disponible', {
                p_producto_id: producto_id,
                p_deposito: deposito || 'Principal'
            });
            const stockRow = Array.isArray(stockInfo) ? stockInfo[0] : stockInfo;
            const disponible = stockRow?.stock_disponible ?? 0;

            if (disponible < parseInt(cantidad)) {
              return respondFail(
                'INSUFFICIENT_STOCK',
                'Stock disponible insuficiente para la reserva',
                409,
                { details: { disponible } },
              );
            }

            const reserva = await insertTable('stock_reservado', {
                producto_id,
                cantidad: parseInt(cantidad),
                estado: 'activa',
                referencia: referencia || null,
                usuario: user.id,
                fecha_reserva: new Date().toISOString()
            });

            return respondOk(reserva[0] || reserva, 201, { message: 'Reserva creada exitosamente' });
        }

        // 21. POST /reservas/:id/cancelar - Cancelar reserva
        if (path.match(/^\/reservas\/[a-f0-9-]+\/cancelar$/) && method === 'POST') {
            checkRole(['admin', 'ventas', 'deposito']);

            const reservaId = path.split('/')[2];
            const reserva = await updateTable('stock_reservado', reservaId, {
                estado: 'cancelada',
                fecha_cancelacion: new Date().toISOString()
            });

            return respondOk(reserva[0] || reserva, 200, { message: 'Reserva cancelada exitosamente' });
        }

        // 22. POST /compras/recepcion - Registrar recepción de compra
        if (path === '/compras/recepcion' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { orden_compra_id, cantidad, deposito } = body;

            if (!orden_compra_id || !cantidad) {
              return respondFail('VALIDATION_ERROR', 'orden_compra_id y cantidad son requeridos', 400);
            }

            const ordenes = await queryTable('ordenes_compra', { id: orden_compra_id });
            const orden = ordenes[0];

            if (!orden) {
              return respondFail('NOT_FOUND', 'Orden de compra no encontrada', 404);
            }

            const pendiente = Math.max((orden.cantidad || 0) - (orden.cantidad_recibida || 0), 0);
            if (parseInt(cantidad) > pendiente) {
              return respondFail(
                'CONFLICT',
                'Cantidad supera lo pendiente de recepción',
                409,
                { details: { pendiente } },
              );
            }

            const movimiento = await callFunction('sp_movimiento_inventario', {
                p_producto_id: orden.producto_id,
                p_tipo: 'entrada',
                p_cantidad: parseInt(cantidad),
                p_origen: `OC:${orden_compra_id}`,
                p_destino: deposito || 'Principal',
                p_usuario: user.id,
                p_orden_compra_id: orden_compra_id
            });

            return respondOk(movimiento, 201, { message: 'Recepción registrada exitosamente' });
        }

        // ====================================================================
        // RUTA NO ENCONTRADA
        // ====================================================================

        return fail(
          'NOT_FOUND',
          `Ruta no encontrada: ${method} ${path}`,
          404,
          responseHeaders,
          { requestId },
        );
  } catch (error) {
    const appError = isAppError(error)
      ? error
      : toAppError(error, 'API_ERROR', getErrorStatus(error));

    logger.error('API_MINIMARKET_ERROR', {
      ...requestLog,
      code: appError.code,
      message: appError.message,
      status: appError.status,
    });

    return fail(
      appError.code,
      appError.message,
      appError.status,
      responseHeaders,
      {
        requestId,
        details: appError.details,
      },
    );
  }
});
