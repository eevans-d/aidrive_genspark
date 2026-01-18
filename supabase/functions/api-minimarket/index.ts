// ============================================================================
// MINI MARKET API GATEWAY - Sistema Completo RESTful
// ============================================================================
// Endpoints con autenticación JWT y control de roles server-side.
// CORS restrictivo con ALLOWED_ORIGINS.
// Rate limiting y circuit breaker integrados.
// Auditoría de acciones sensibles.
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
import { FixedWindowRateLimiter, withRateLimitHeaders } from '../_shared/rate-limit.ts';
import { getCircuitBreaker } from '../_shared/circuit-breaker.ts';
import { auditLog, extractAuditContext } from '../_shared/audit.ts';

// Import modular helpers
import {
  extractBearerToken,
  fetchUserInfo,
  requireRole,
  createRequestHeaders,
  BASE_ROLES,
  type UserInfo,
} from './helpers/auth.ts';
import {
  isUuid,
  parsePositiveNumber,
  parseNonNegativeNumber,
  parsePositiveInt,
  parseNonNegativeInt,
  sanitizeTextParam,
  isValidMovimientoTipo,
  VALID_MOVIMIENTO_TIPOS,
  isValidCodigo,
} from './helpers/validation.ts';
import { parsePagination } from './helpers/pagination.ts';
import {
  queryTable,
  queryTableWithCount,
  insertTable,
  updateTable,
  callFunction,
  fetchWithParams,
} from './helpers/supabase.ts';

const logger = createLogger('api-minimarket');

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const FUNCTION_BASE_PATH = '/api-minimarket';

// Rate limiter: 60 requests per minute per IP
const rateLimiter = new FixedWindowRateLimiter(60, 60_000);

// Circuit breaker for external service calls
const circuitBreaker = getCircuitBreaker('api-minimarket-db', {
  failureThreshold: 5,
  successThreshold: 2,
  openTimeoutMs: 30_000,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  const requestId = generateRequestId(req);
  const clientIp = getClientIp(req);
  const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  const corsResult = validateOrigin(req, allowedOrigins);
  const corsHeaders = corsResult.headers;
  let responseHeaders: Record<string, string> = { ...corsHeaders, 'x-request-id': requestId };

  // ========================================================================
  // CORS: Block requests without Origin header (except same-origin/non-browser)
  // ========================================================================
  const origin = req.headers.get('origin');
  const requireOrigin = Deno.env.get('REQUIRE_ORIGIN') !== 'false';

  // For browser requests, Origin header is required
  // Allow requests without Origin for server-to-server calls
  if (requireOrigin && origin === null) {
    // Check if it looks like a browser request (has typical browser headers)
    const userAgent = req.headers.get('user-agent') || '';
    const isBrowserLike = /mozilla|chrome|safari|firefox|edge|opera/i.test(userAgent);

    if (isBrowserLike) {
      logger.warn('CORS_NO_ORIGIN', { requestId, userAgent, clientIp });
      return fail(
        'CORS_ORIGIN_REQUIRED',
        'Origin header is required for browser requests',
        403,
        responseHeaders,
        { requestId },
      );
    }
  }

  // CORS: Block disallowed origins
  if (!corsResult.allowed) {
    logger.warn('CORS_BLOCKED', { requestId, origin: corsResult.origin, clientIp });
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

  // ========================================================================
  // RATE LIMITING
  // ========================================================================
  const rateLimitKey = clientIp;
  const { result: rateLimitResult, headers: rateLimitHeaders } = rateLimiter.checkWithHeaders(rateLimitKey);
  responseHeaders = withRateLimitHeaders(responseHeaders, rateLimitResult, rateLimiter.getLimit());

  if (!rateLimitResult.allowed) {
    logger.warn('RATE_LIMIT_EXCEEDED', { requestId, clientIp });
    return fail(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please try again later.',
      429,
      responseHeaders,
      { requestId },
    );
  }

  // ========================================================================
  // CIRCUIT BREAKER CHECK
  // ========================================================================
  if (!circuitBreaker.allowRequest()) {
    logger.warn('CIRCUIT_BREAKER_OPEN', { requestId, state: circuitBreaker.getState() });
    return fail(
      'SERVICE_UNAVAILABLE',
      'Service temporarily unavailable. Please try again later.',
      503,
      responseHeaders,
      { requestId },
    );
  }

  const url = new URL(req.url);
  const path = normalizePathname(url.pathname);
  const method = req.method;
  const requestLog = {
    requestId,
    method,
    path,
    clientIp,
    timestamp: new Date().toISOString(),
  };

  try {
    // ======================================================================
    // CONFIGURATION CHECK
    // ======================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw toAppError(
        new Error('Configuración de Supabase faltante'),
        'CONFIG_ERROR',
        500,
      );
    }

    // ======================================================================
    // AUTHENTICATION - Using user JWT, NOT service role
    // ======================================================================
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    let user: UserInfo | null = null;

    if (token) {
      const authResult = await fetchUserInfo(supabaseUrl, supabaseAnonKey, token);
      if (authResult.error) {
        logger.warn('AUTH_FAILED', { requestId, code: authResult.error.code });
        // Don't throw - some endpoints might be public
      } else {
        user = authResult.user;
      }
    }

    // Helper: Check role (throws if unauthorized)
    const checkRole = (allowedRoles: readonly string[]) => {
      requireRole(user, allowedRoles);
    };

    // ======================================================================
    // REQUEST HELPERS
    // ======================================================================

    // Create headers for PostgREST calls - uses user's JWT for RLS
    const requestHeaders = (extraHeaders: Record<string, string> = {}) =>
      createRequestHeaders(token, supabaseAnonKey, requestId, extraHeaders);

    const respondOk = <T>(
      data: T,
      status = 200,
      options: { message?: string; extra?: Record<string, unknown> } = {},
    ) => {
      circuitBreaker.recordSuccess();
      return ok(data, status, responseHeaders, { requestId, ...options });
    };

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

    const getPaginationOrFail = (
      defaultLimit: number,
      maxLimit: number,
    ): { limit: number; offset: number } | Response => {
      const result = parsePagination(
        url.searchParams.get('limit'),
        url.searchParams.get('offset'),
        defaultLimit,
        maxLimit,
      );
      if (!result.ok) {
        return respondFail('VALIDATION_ERROR', result.error.message, 400);
      }
      return result.params;
    };

    // Helper: Create Supabase client for audit logging (uses service role)
    const createAuditClient = async () => {
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceRoleKey) {
        logger.warn('AUDIT: No service role key available for audit logging');
        return null;
      }
      // Import dynamically to avoid circular dependencies
      const { createClient } = await import('jsr:@supabase/supabase-js@2');
      return createClient(supabaseUrl, serviceRoleKey);
    };

    // Helper: Log audit event for sensitive operations
    const logAudit = async (
      action: string,
      entidad_tipo: string,
      entidad_id: string,
      detalles?: Record<string, unknown>,
      nivel: 'info' | 'warning' | 'critical' = 'info'
    ) => {
      const auditContext = extractAuditContext(req);
      const supabaseClient = await createAuditClient();

      await auditLog(supabaseClient, {
        action,
        usuario_id: user?.id,
        entidad_tipo,
        entidad_id,
        detalles,
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
        nivel
      });
    };

    // ====================================================================
    // ENDPOINTS: CATEGORÍAS (2 endpoints)
    // ====================================================================

    // 1. GET /categorias - Listar todas las categorías
    if (path === '/categorias' && method === 'GET') {
      checkRole(BASE_ROLES);

      const categorias = await queryTable(
        supabaseUrl,
        'categorias',
        requestHeaders(),
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
      const categorias = await queryTable(supabaseUrl, 'categorias', requestHeaders(), { id });

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
      checkRole(BASE_ROLES);

      const categoria = url.searchParams.get('categoria');
      const marca = url.searchParams.get('marca');
      const activo = url.searchParams.get('activo');
      const search = url.searchParams.get('search');

      const pagination = getPaginationOrFail(100, 200);
      if (pagination instanceof Response) return pagination;
      const { limit, offset } = pagination;

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
          { limit: 1 },
        );
        if (categorias.length === 0) {
          return respondOk([], 200, { extra: { count: 0 } });
        }
        categoriaId = (categorias[0] as { id: string }).id;
      }

      const params = new URLSearchParams();
      params.set(
        'select',
        'id,sku,nombre,marca,contenido_neto,activo,precio_actual,precio_costo,margen_ganancia,categoria_id',
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
        requestHeaders(),
      );

      return respondOk(productos, 200, {
        extra: { count: count ?? productos.length },
      });
    }

    // 4. GET /productos/:id - Detalle de producto específico
    if (path.match(/^\/productos\/[a-f0-9-]+$/) && method === 'GET') {
      checkRole(BASE_ROLES);

      const id = path.split('/')[2];
      if (!isUuid(id)) {
        return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
      }

      const productos = await queryTable(supabaseUrl, 'productos', requestHeaders(), { id });

      if (productos.length === 0) {
        return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
      }

      return respondOk(productos[0]);
    }

    // 5. POST /productos - Crear nuevo producto (admin/deposito)
    if (path === '/productos' && method === 'POST') {
      checkRole(['admin', 'deposito']);

      const bodyResult = await parseJsonBody();
      if (bodyResult instanceof Response) return bodyResult;

      const { sku, nombre, categoria_id, marca, contenido_neto } = bodyResult as Record<
        string,
        unknown
      >;

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

      // Audit log
      await logAudit(
        'producto_creado',
        'productos',
        String(productoCreado.id),
        { nombre: payload.nombre, sku: payload.sku },
        'info'
      );

      return respondOk(productoCreado, 201, { message: 'Producto creado exitosamente' });
    }

    // 6. PUT /productos/:id - Actualizar producto (admin/deposito)
    if (path.match(/^\/productos\/[a-f0-9-]+$/) && method === 'PUT') {
      checkRole(['admin', 'deposito']);

      const id = path.split('/')[2];
      if (!isUuid(id)) {
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

      if (body.marca !== undefined) {
        if (body.marca === null) {
          updates.marca = null;
        } else if (typeof body.marca !== 'string' || !body.marca.trim()) {
          return respondFail('VALIDATION_ERROR', 'marca invalida', 400);
        } else {
          updates.marca = body.marca.trim();
        }
      }

      if (body.contenido_neto !== undefined) {
        if (body.contenido_neto === null) {
          updates.contenido_neto = null;
        } else if (typeof body.contenido_neto === 'string' && body.contenido_neto.trim()) {
          updates.contenido_neto = body.contenido_neto.trim();
        } else if (typeof body.contenido_neto === 'number') {
          updates.contenido_neto = String(body.contenido_neto);
        } else {
          return respondFail('VALIDATION_ERROR', 'contenido_neto invalido', 400);
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

      if (body.margen_ganancia !== undefined) {
        const valor = parseNonNegativeNumber(body.margen_ganancia);
        if (valor === null) {
          return respondFail('VALIDATION_ERROR', 'margen_ganancia invalido', 400);
        }
        updates.margen_ganancia = valor;
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
    }

    // 7. DELETE /productos/:id - Eliminar producto (soft delete - admin)
    if (path.match(/^\/productos\/[a-f0-9-]+$/) && method === 'DELETE') {
      checkRole(['admin']);

      const id = path.split('/')[2];
      if (!isUuid(id)) {
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

      // Audit log
      await logAudit(
        'producto_eliminado',
        'productos',
        id,
        { nombre: productoEliminado.nombre },
        'warning'
      );

      return respondOk(productoEliminado, 200, { message: 'Producto desactivado exitosamente' });
    }

    // ====================================================================
    // ENDPOINTS: PROVEEDORES (2 endpoints)
    // ====================================================================

    // 8. GET /proveedores - Listar proveedores
    if (path === '/proveedores' && method === 'GET') {
      checkRole(['admin', 'deposito']);

      const proveedores = await queryTable(
        supabaseUrl,
        'proveedores',
        requestHeaders(),
        { activo: true },
        'id,nombre,contacto,email,telefono,productos_ofrecidos',
        { order: 'nombre' },
      );

      return respondOk(proveedores, 200, { extra: { count: proveedores.length } });
    }

    // 9. GET /proveedores/:id - Detalle de proveedor
    if (path.match(/^\/proveedores\/[a-f0-9-]+$/) && method === 'GET') {
      checkRole(['admin', 'deposito']);

      const id = path.split('/')[2];
      if (!isUuid(id)) {
        return respondFail('VALIDATION_ERROR', 'id de proveedor invalido', 400);
      }

      const proveedores = await queryTable(supabaseUrl, 'proveedores', requestHeaders(), { id });

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

      const bodyResult = await parseJsonBody();
      if (bodyResult instanceof Response) return bodyResult;

      const { producto_id, precio_compra, margen_ganancia } = bodyResult as Record<
        string,
        unknown
      >;

      if (typeof producto_id !== 'string' || !isUuid(producto_id)) {
        return respondFail('VALIDATION_ERROR', 'producto_id invalido', 400);
      }

      const precioCompraNumero = parsePositiveNumber(precio_compra);
      if (precioCompraNumero === null) {
        return respondFail('VALIDATION_ERROR', 'precio_compra debe ser mayor que 0', 400);
      }

      let margenGananciaNumero: number | null = null;
      if (margen_ganancia !== undefined && margen_ganancia !== null) {
        const parsed = parseNonNegativeNumber(margen_ganancia);
        if (parsed === null) {
          return respondFail('VALIDATION_ERROR', 'margen_ganancia invalido', 400);
        }
        margenGananciaNumero = parsed;
      }

      const productos = await queryTable(
        supabaseUrl,
        'productos',
        requestHeaders(),
        { id: producto_id },
        'id,categoria_id,precio_actual,margen_ganancia',
      );

      if (productos.length === 0) {
        return respondFail('NOT_FOUND', 'Producto no encontrado', 404);
      }

      const producto = productos[0] as Record<string, unknown>;
      const categorias = producto.categoria_id
        ? await queryTable(
          supabaseUrl,
          'categorias',
          requestHeaders(),
          { id: producto.categoria_id },
          'id,margen_minimo',
        )
        : [];
      const categoria = categorias[0] as Record<string, unknown> | undefined;
      const margenMinimo = categoria?.margen_minimo;

      const margenProductoNumero = parseNonNegativeNumber(producto.margen_ganancia);

      let margenProyectado: number | null = null;
      if (margenGananciaNumero !== null) {
        margenProyectado = margenGananciaNumero;
      } else if (margenProductoNumero !== null) {
        margenProyectado = margenProductoNumero;
      } else if (producto.precio_actual !== undefined && producto.precio_actual !== null) {
        const precioActualNumero = parsePositiveNumber(producto.precio_actual);
        if (precioActualNumero !== null) {
          margenProyectado = ((precioActualNumero - precioCompraNumero) / precioActualNumero) * 100;
        }
      }

      if (margenMinimo !== undefined && margenMinimo !== null) {
        const margenMinimoNumero = parseNonNegativeNumber(margenMinimo);
        if (margenMinimoNumero !== null && margenProyectado !== null) {
          if (margenProyectado < margenMinimoNumero) {
            return respondFail(
              'MARGIN_BELOW_MINIMUM',
              'Margen proyectado por debajo del minimo de categoria. Requiere aprobacion.',
              409,
              {
                details: {
                  margen_minimo: margenMinimoNumero,
                  margen_proyectado: margenProyectado,
                  requiere_aprobacion: true,
                },
              },
            );
          }
        }
      }

      // Llamar a sp_aplicar_precio (incluye redondeo automático)
      const result = await callFunction(supabaseUrl, 'sp_aplicar_precio', requestHeaders(), {
        p_producto_id: producto_id,
        p_precio_compra: precioCompraNumero,
        p_margen_ganancia: margenGananciaNumero,
      });

      // Audit log
      const precioAnterior = parsePositiveNumber(producto.precio_actual);
      const resultData = result as Record<string, unknown>;
      await logAudit(
        'precio_actualizado',
        'productos',
        producto_id,
        {
          precio_anterior: precioAnterior,
          precio_compra: precioCompraNumero,
          margen_ganancia: margenGananciaNumero,
          precio_nuevo: resultData.precio_venta
        },
        'info'
      );

      return respondOk(result, 200, { message: 'Precio aplicado y redondeado exitosamente' });
    }

    // 11. GET /precios/producto/:id - Historial de precios de un producto
    if (path.match(/^\/precios\/producto\/[a-f0-9-]+$/) && method === 'GET') {
      checkRole(BASE_ROLES);

      const productoId = path.split('/')[3];
      if (!isUuid(productoId)) {
        return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
      }

      const pagination = getPaginationOrFail(50, 200);
      if (pagination instanceof Response) return pagination;
      const { limit, offset } = pagination;

      const { data: historial, count } = await queryTableWithCount(
        supabaseUrl,
        'precios_historicos',
        requestHeaders(),
        { producto_id: productoId },
        'id,producto_id,precio_anterior,precio_nuevo,fecha_cambio,motivo_cambio',
        { order: 'fecha_cambio.desc', limit, offset },
      );

      return respondOk(historial, 200, { extra: { count } });
    }

    // 12. POST /precios/redondear - Redondear un precio (función de utilidad)
    if (path === '/precios/redondear' && method === 'POST') {
      checkRole(BASE_ROLES);

      const bodyResult = await parseJsonBody();
      if (bodyResult instanceof Response) return bodyResult;

      const { precio } = bodyResult as Record<string, unknown>;
      const precioNumero = parsePositiveNumber(precio);

      if (precioNumero === null) {
        return respondFail('VALIDATION_ERROR', 'precio debe ser mayor que 0', 400);
      }

      const result = await callFunction(supabaseUrl, 'fnc_redondear_precio', requestHeaders(), {
        precio: precioNumero,
      });

      return respondOk(
        {
          precio_original: precioNumero,
          precio_redondeado: result,
        },
        200,
        { message: 'Precio redondeado exitosamente' },
      );
    }

    // 13. GET /precios/margen-sugerido/:id - Calcular margen sugerido para producto
    if (path.match(/^\/precios\/margen-sugerido\/[a-f0-9-]+$/) && method === 'GET') {
      checkRole(BASE_ROLES);

      const productoId = path.split('/')[3];
      if (!isUuid(productoId)) {
        return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
      }

      const result = await callFunction(supabaseUrl, 'fnc_margen_sugerido', requestHeaders(), {
        p_producto_id: productoId,
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
      checkRole(BASE_ROLES);

      const stock = await queryTable(
        supabaseUrl,
        'stock_deposito',
        requestHeaders(),
        {},
        'id,producto_id,cantidad_actual,stock_minimo,stock_maximo,ubicacion,lote,fecha_vencimiento',
        { order: 'producto_id' },
      );

      // Obtener nombres de productos
      const productos = await queryTable(supabaseUrl, 'productos', requestHeaders(), {}, 'id,sku,nombre,marca');
      const productosMap = Object.fromEntries(
        (productos as Array<{ id: string }>).map((p) => [p.id, p]),
      );

      const stockConNombres = (stock as Array<{ producto_id: string }>).map((s) => ({
        ...s,
        producto: productosMap[s.producto_id],
      }));

      return respondOk(stockConNombres, 200, { extra: { count: stockConNombres.length } });
    }

    // 15. GET /stock/minimo - Productos con stock bajo mínimo
    if (path === '/stock/minimo' && method === 'GET') {
      checkRole(['admin', 'deposito']);

      const result = await callFunction(supabaseUrl, 'fnc_productos_bajo_minimo', requestHeaders());

      return respondOk(result, 200, {
        message: 'Productos bajo stock minimo consultados',
        extra: { count: (result as unknown[] | null)?.length || 0 },
      });
    }

    // 16. GET /stock/producto/:id - Stock específico de un producto
    if (path.match(/^\/stock\/producto\/[a-f0-9-]+$/) && method === 'GET') {
      checkRole(BASE_ROLES);

      const productoId = path.split('/')[3];
      if (!isUuid(productoId)) {
        return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
      }

      const depositoParam = url.searchParams.get('deposito');
      const deposito = depositoParam && depositoParam.trim() ? depositoParam.trim() : 'Principal';

      const stockDisponible = await callFunction(supabaseUrl, 'fnc_stock_disponible', requestHeaders(), {
        p_producto_id: productoId,
        p_deposito: deposito,
      });

      const stockDetalle = await queryTable(
        supabaseUrl,
        'stock_deposito',
        requestHeaders(),
        { producto_id: productoId },
      );

      return respondOk({
        producto_id: productoId,
        deposito,
        stock_disponible: stockDisponible,
        detalle: stockDetalle[0] || null,
      });
    }

    // 17. GET /reportes/efectividad-tareas - Métricas de efectividad por usuario
    if (path === '/reportes/efectividad-tareas' && method === 'GET') {
      checkRole(BASE_ROLES);

      const usuarioId = url.searchParams.get('usuario_id');
      const fechaDesde = url.searchParams.get('fecha_desde');
      const fechaHasta = url.searchParams.get('fecha_hasta');

      if (usuarioId && !isUuid(usuarioId)) {
        return respondFail('VALIDATION_ERROR', 'usuario_id invalido', 400);
      }

      const fechaDesdeMs = fechaDesde ? Date.parse(fechaDesde) : null;
      if (fechaDesde && Number.isNaN(fechaDesdeMs)) {
        return respondFail('VALIDATION_ERROR', 'fecha_desde invalida', 400);
      }

      const fechaHastaMs = fechaHasta ? Date.parse(fechaHasta) : null;
      if (fechaHasta && Number.isNaN(fechaHastaMs)) {
        return respondFail('VALIDATION_ERROR', 'fecha_hasta invalida', 400);
      }

      if (fechaDesdeMs !== null && fechaHastaMs !== null && fechaDesdeMs > fechaHastaMs) {
        return respondFail('VALIDATION_ERROR', 'fecha_desde debe ser <= fecha_hasta', 400);
      }

      const queryParams = new URLSearchParams();
      queryParams.set(
        'select',
        'asignado_a_id,estado,tiempo_resolucion,cumplimiento_sla,dias_atraso,fecha_completado',
      );

      if (usuarioId) {
        queryParams.append('asignado_a_id', `eq.${usuarioId}`);
      }
      if (fechaDesde) {
        queryParams.append('fecha_completado', `gte.${fechaDesde}`);
      }
      if (fechaHasta) {
        queryParams.append('fecha_completado', `lte.${fechaHasta}`);
      }

      const { data: rows } = await fetchWithParams(
        supabaseUrl,
        'tareas_metricas',
        queryParams,
        requestHeaders(),
      );

      const agregados: Record<string, Record<string, unknown>> = {};

      for (const row of rows as Array<Record<string, unknown>>) {
        const usuarioKey = (row.asignado_a_id as string) || 'sin_asignar';
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
            _count_atraso: 0,
          };
        }

        const entry = agregados[usuarioKey];
        entry.tareas_total = Number(entry.tareas_total) + 1;

        if (row.estado && (row.estado as string).toLowerCase() === 'completada') {
          entry.tareas_completadas = Number(entry.tareas_completadas) + 1;
        }

        if (row.tiempo_resolucion !== null && row.tiempo_resolucion !== undefined) {
          entry._acumulado_resolucion = Number(entry._acumulado_resolucion) + Number(
            row.tiempo_resolucion,
          );
          entry._count_resolucion = Number(entry._count_resolucion) + 1;
        }

        if (row.dias_atraso !== null && row.dias_atraso !== undefined) {
          entry._acumulado_atraso = Number(entry._acumulado_atraso) + Number(row.dias_atraso);
          entry._count_atraso = Number(entry._count_atraso) + 1;
        }

        if (row.cumplimiento_sla === true) {
          entry.sla_cumplidas = Number(entry.sla_cumplidas) + 1;
        } else if (row.cumplimiento_sla === false) {
          entry.sla_incumplidas = Number(entry.sla_incumplidas) + 1;
        }
      }

      const data = Object.values(agregados).map((entry) => {
        const cumplimientoTotal = Number(entry.sla_cumplidas) + Number(entry.sla_incumplidas);
        return {
          usuario_id: entry.usuario_id,
          tareas_total: entry.tareas_total,
          tareas_completadas: entry.tareas_completadas,
          tiempo_resolucion_promedio_horas: Number(entry._count_resolucion)
            ? Number(
              (Number(entry._acumulado_resolucion) / Number(entry._count_resolucion)).toFixed(2),
            )
            : null,
          dias_atraso_promedio: Number(entry._count_atraso)
            ? Number((Number(entry._acumulado_atraso) / Number(entry._count_atraso)).toFixed(2))
            : null,
          cumplimiento_sla_pct: cumplimientoTotal
            ? Number(((Number(entry.sla_cumplidas) / cumplimientoTotal) * 100).toFixed(2))
            : null,
          sla_cumplidas: entry.sla_cumplidas,
          sla_incumplidas: entry.sla_incumplidas,
        };
      });

      data.sort((a, b) => Number(b.tareas_total) - Number(a.tareas_total));

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

    // ====================================================================
    // ENDPOINTS: TAREAS CRUD (3 endpoints)
    // ====================================================================

    // POST /tareas - Crear nueva tarea
    if (path === '/tareas' && method === 'POST') {
      checkRole(['admin', 'supervisor', 'empleado']);

      const bodyResult = await parseJsonBody<{
        titulo: string;
        descripcion?: string;
        asignada_a_nombre?: string;
        prioridad?: 'baja' | 'normal' | 'urgente';
        fecha_vencimiento?: string | null;
      }>();

      if (bodyResult instanceof Response) return bodyResult;
      const body = bodyResult;

      if (!body.titulo || typeof body.titulo !== 'string' || body.titulo.trim().length === 0) {
        return respondFail('VALIDATION_ERROR', 'El título es requerido', 400);
      }

      const prioridad = body.prioridad || 'normal';
      if (!['baja', 'normal', 'urgente'].includes(prioridad)) {
        return respondFail('VALIDATION_ERROR', 'Prioridad inválida', 400);
      }

      const tareaData = {
        titulo: body.titulo.trim(),
        descripcion: body.descripcion?.trim() || null,
        asignada_a_nombre: body.asignada_a_nombre?.trim() || null,
        prioridad,
        fecha_vencimiento: body.fecha_vencimiento || null,
        estado: 'pendiente',
        creada_por_nombre: user?.email || 'Sistema',
      };

      const insertResult = await insertTable(
        supabaseUrl!,
        'tareas_pendientes',
        tareaData,
        requestHeaders(),
      );

      if (!insertResult.success) {
        return respondFail('INSERT_ERROR', insertResult.error || 'Error al crear tarea', 500);
      }

      await logAudit('TAREA_CREADA', 'tarea', insertResult.data?.id || 'unknown', {
        titulo: tareaData.titulo,
        prioridad: tareaData.prioridad,
      });

      logger.info('TAREA_CREATED', { requestId, titulo: tareaData.titulo });
      return respondOk(insertResult.data, 201, { message: 'Tarea creada exitosamente' });
    }

    // PUT /tareas/:id/completar - Marcar tarea como completada
    if (path.match(/^\/tareas\/[a-f0-9-]+\/completar$/) && method === 'PUT') {
      checkRole(['admin', 'supervisor', 'empleado']);

      const tareaId = path.split('/')[2];
      if (!isUuid(tareaId)) {
        return respondFail('VALIDATION_ERROR', 'ID de tarea inválido', 400);
      }

      const updateData = {
        estado: 'completada',
        fecha_completada: new Date().toISOString(),
        completada_por_nombre: user?.email || 'Sistema',
      };

      const updateResult = await updateTable(
        supabaseUrl!,
        'tareas_pendientes',
        tareaId,
        updateData,
        requestHeaders(),
      );

      if (!updateResult.success) {
        return respondFail('UPDATE_ERROR', updateResult.error || 'Error al completar tarea', 500);
      }

      await logAudit('TAREA_COMPLETADA', 'tarea', tareaId, {
        completada_por: user?.email,
      });

      logger.info('TAREA_COMPLETED', { requestId, tareaId });
      return respondOk(updateResult.data, 200, { message: 'Tarea completada exitosamente' });
    }

    // PUT /tareas/:id/cancelar - Cancelar tarea
    if (path.match(/^\/tareas\/[a-f0-9-]+\/cancelar$/) && method === 'PUT') {
      checkRole(['admin', 'supervisor']);

      const tareaId = path.split('/')[2];
      if (!isUuid(tareaId)) {
        return respondFail('VALIDATION_ERROR', 'ID de tarea inválido', 400);
      }

      const bodyResult = await parseJsonBody<{ razon?: string }>();
      if (bodyResult instanceof Response) return bodyResult;
      const body = bodyResult;

      const updateData = {
        estado: 'cancelada',
        fecha_cancelada: new Date().toISOString(),
        cancelada_por_nombre: user?.email || 'Sistema',
        razon_cancelacion: body.razon?.trim() || 'Sin especificar',
      };

      const updateResult = await updateTable(
        supabaseUrl!,
        'tareas_pendientes',
        tareaId,
        updateData,
        requestHeaders(),
      );

      if (!updateResult.success) {
        return respondFail('UPDATE_ERROR', updateResult.error || 'Error al cancelar tarea', 500);
      }

      await logAudit('TAREA_CANCELADA', 'tarea', tareaId, {
        cancelada_por: user?.email,
        razon: updateData.razon_cancelacion,
      }, 'warning');

      logger.info('TAREA_CANCELLED', { requestId, tareaId, razon: updateData.razon_cancelacion });
      return respondOk(updateResult.data, 200, { message: 'Tarea cancelada exitosamente' });
    }

    // 18. POST /deposito/movimiento - Registrar movimiento de inventario (admin/deposito)
    if (path === '/deposito/movimiento' && method === 'POST') {
      checkRole(['admin', 'deposito']);

      const bodyResult = await parseJsonBody();
      if (bodyResult instanceof Response) return bodyResult;

      const { producto_id, tipo_movimiento, cantidad, origen, destino, motivo } = bodyResult as Record<
        string,
        unknown
      >;

      if (typeof producto_id !== 'string' || !isUuid(producto_id)) {
        return respondFail('VALIDATION_ERROR', 'producto_id invalido', 400);
      }
      if (typeof tipo_movimiento !== 'string' || !tipo_movimiento.trim()) {
        return respondFail('VALIDATION_ERROR', 'tipo_movimiento es requerido', 400);
      }

      const tipoMovimiento = tipo_movimiento.trim().toLowerCase();
      if (!isValidMovimientoTipo(tipoMovimiento)) {
        return respondFail(
          'VALIDATION_ERROR',
          'tipo_movimiento invalido. Valores permitidos: entrada, salida, ajuste, transferencia',
          400,
        );
      }

      const cantidadNumero = parsePositiveInt(cantidad);
      if (cantidadNumero === null) {
        return respondFail('VALIDATION_ERROR', 'cantidad debe ser un entero > 0', 400);
      }

      const origenValue =
        typeof origen === 'string' && origen.trim()
          ? origen.trim()
          : typeof motivo === 'string' && motivo.trim()
            ? motivo.trim()
            : null;
      const destinoValue = typeof destino === 'string' && destino.trim() ? destino.trim() : null;

      // Llamar a sp_movimiento_inventario
      const result = await callFunction(supabaseUrl, 'sp_movimiento_inventario', requestHeaders(), {
        p_producto_id: producto_id,
        p_tipo: tipoMovimiento,
        p_cantidad: cantidadNumero,
        p_origen: origenValue,
        p_destino: destinoValue,
        p_usuario: user!.id,
      });

      // Audit log for stock adjustments (ajuste) and large movements
      if (tipoMovimiento === 'ajuste' || cantidadNumero >= 100) {
        await logAudit(
          'stock_ajustado',
          'stock_deposito',
          producto_id,
          {
            tipo_movimiento: tipoMovimiento,
            cantidad: cantidadNumero,
            motivo: origenValue
          },
          tipoMovimiento === 'ajuste' ? 'warning' : 'info'
        );
      }

      return respondOk(result, 201, { message: 'Movimiento registrado exitosamente' });
    }

    // 19. GET /deposito/movimientos - Historial de movimientos
    if (path === '/deposito/movimientos' && method === 'GET') {
      checkRole(['admin', 'deposito']);

      const productoId = url.searchParams.get('producto_id');
      if (productoId && !isUuid(productoId)) {
        return respondFail('VALIDATION_ERROR', 'producto_id invalido', 400);
      }

      const tipoMovimiento = url.searchParams.get('tipo_movimiento');
      let tipoMovimientoFiltro: string | null = null;
      if (tipoMovimiento) {
        const normalized = tipoMovimiento.trim().toLowerCase();
        if (!isValidMovimientoTipo(normalized)) {
          return respondFail(
            'VALIDATION_ERROR',
            'tipo_movimiento invalido. Valores permitidos: entrada, salida, ajuste, transferencia',
            400,
          );
        }
        tipoMovimientoFiltro = normalized;
      }

      const pagination = getPaginationOrFail(50, 200);
      if (pagination instanceof Response) return pagination;
      const { limit, offset } = pagination;

      const filters: Record<string, unknown> = {};
      if (productoId) filters.producto_id = productoId;
      if (tipoMovimientoFiltro) filters.tipo_movimiento = tipoMovimientoFiltro;

      const { data: movimientos, count } = await queryTableWithCount(
        supabaseUrl,
        'movimientos_deposito',
        requestHeaders(),
        filters,
        'id,producto_id,tipo_movimiento,cantidad,motivo,fecha_movimiento,usuario_id',
        { order: 'fecha_movimiento.desc', limit, offset },
      );

      return respondOk(movimientos, 200, { extra: { count } });
    }

    // 20. POST /deposito/ingreso - Ingreso de mercadería (admin/deposito)
    if (path === '/deposito/ingreso' && method === 'POST') {
      checkRole(['admin', 'deposito']);

      const bodyResult = await parseJsonBody();
      if (bodyResult instanceof Response) return bodyResult;

      const { producto_id, cantidad, proveedor_id, precio_compra, deposito } = bodyResult as Record<
        string,
        unknown
      >;

      if (typeof producto_id !== 'string' || !isUuid(producto_id)) {
        return respondFail('VALIDATION_ERROR', 'producto_id invalido', 400);
      }

      const cantidadNumero = parsePositiveInt(cantidad);
      if (cantidadNumero === null) {
        return respondFail('VALIDATION_ERROR', 'cantidad debe ser un entero > 0', 400);
      }

      let proveedorId: string | null = null;
      if (proveedor_id !== undefined && proveedor_id !== null) {
        if (typeof proveedor_id !== 'string' || !isUuid(proveedor_id)) {
          return respondFail('VALIDATION_ERROR', 'proveedor_id invalido', 400);
        }
        proveedorId = proveedor_id;
      }

      let precioCompraNumero: number | null = null;
      if (precio_compra !== undefined && precio_compra !== null && precio_compra !== '') {
        const parsed = parsePositiveNumber(precio_compra);
        if (parsed === null) {
          return respondFail('VALIDATION_ERROR', 'precio_compra invalido', 400);
        }
        precioCompraNumero = parsed;
      }

      const depositoValue = typeof deposito === 'string' && deposito.trim() ? deposito.trim() : 'Principal';

      // Registrar movimiento de ingreso
      const movimiento = await callFunction(supabaseUrl, 'sp_movimiento_inventario', requestHeaders(), {
        p_producto_id: producto_id,
        p_tipo: 'entrada',
        p_cantidad: cantidadNumero,
        p_origen: `Proveedor:${proveedorId || 'N/A'}`,
        p_destino: depositoValue,
        p_usuario: user!.id,
        p_proveedor_id: proveedorId,
      });

      // Si hay precio de compra, registrar en precios_proveedor
      if (precioCompraNumero !== null && proveedorId) {
        await insertTable(supabaseUrl, 'precios_proveedor', requestHeaders(), {
          proveedor_id: proveedorId,
          producto_id,
          precio: precioCompraNumero,
          fecha_actualizacion: new Date().toISOString(),
        });
      }

      return respondOk(movimiento, 201, { message: 'Ingreso de mercaderia registrado exitosamente' });
    }

    // 21. POST /reservas - Crear reserva de stock
    if (path === '/reservas' && method === 'POST') {
      checkRole(['admin', 'ventas', 'deposito']);

      const bodyResult = await parseJsonBody();
      if (bodyResult instanceof Response) return bodyResult;

      const { producto_id, cantidad, referencia, deposito } = bodyResult as Record<string, unknown>;

      if (typeof producto_id !== 'string' || !isUuid(producto_id)) {
        return respondFail('VALIDATION_ERROR', 'producto_id invalido', 400);
      }

      const cantidadNumero = parsePositiveInt(cantidad);
      if (cantidadNumero === null) {
        return respondFail('VALIDATION_ERROR', 'cantidad debe ser un entero > 0', 400);
      }

      const depositoValue = typeof deposito === 'string' && deposito.trim() ? deposito.trim() : 'Principal';
      const referenciaValue =
        typeof referencia === 'string' && referencia.trim() ? referencia.trim() : null;

      const stockInfo = await callFunction(supabaseUrl, 'fnc_stock_disponible', requestHeaders(), {
        p_producto_id: producto_id,
        p_deposito: depositoValue,
      });
      const stockRow = Array.isArray(stockInfo) ? stockInfo[0] : stockInfo;
      const disponible = Number((stockRow as Record<string, unknown>)?.stock_disponible ?? 0);
      const disponibleNumero = Number.isFinite(disponible) ? disponible : 0;

      if (disponibleNumero < cantidadNumero) {
        return respondFail(
          'INSUFFICIENT_STOCK',
          'Stock disponible insuficiente para la reserva',
          409,
          { details: { disponible: disponibleNumero } },
        );
      }

      const reserva = await insertTable(supabaseUrl, 'stock_reservado', requestHeaders(), {
        producto_id,
        cantidad: cantidadNumero,
        estado: 'activa',
        referencia: referenciaValue,
        usuario: user!.id,
        fecha_reserva: new Date().toISOString(),
      });

      return respondOk((reserva as unknown[])[0] || reserva, 201, { message: 'Reserva creada exitosamente' });
    }

    // 22. POST /reservas/:id/cancelar - Cancelar reserva
    if (path.match(/^\/reservas\/[a-f0-9-]+\/cancelar$/) && method === 'POST') {
      checkRole(['admin', 'ventas', 'deposito']);

      const reservaId = path.split('/')[2];
      if (!isUuid(reservaId)) {
        return respondFail('VALIDATION_ERROR', 'id de reserva invalido', 400);
      }

      const reserva = await updateTable(supabaseUrl, 'stock_reservado', reservaId, requestHeaders(), {
        estado: 'cancelada',
        fecha_cancelacion: new Date().toISOString(),
      });

      if ((reserva as unknown[]).length === 0) {
        return respondFail('NOT_FOUND', 'Reserva no encontrada', 404);
      }

      return respondOk((reserva as unknown[])[0] || reserva, 200, { message: 'Reserva cancelada exitosamente' });
    }

    // 23. POST /compras/recepcion - Registrar recepción de compra
    if (path === '/compras/recepcion' && method === 'POST') {
      checkRole(['admin', 'deposito']);

      const bodyResult = await parseJsonBody();
      if (bodyResult instanceof Response) return bodyResult;

      const { orden_compra_id, cantidad, deposito } = bodyResult as Record<string, unknown>;

      if (typeof orden_compra_id !== 'string' || !isUuid(orden_compra_id)) {
        return respondFail('VALIDATION_ERROR', 'orden_compra_id invalido', 400);
      }

      const cantidadNumero = parsePositiveInt(cantidad);
      if (cantidadNumero === null) {
        return respondFail('VALIDATION_ERROR', 'cantidad debe ser un entero > 0', 400);
      }

      const depositoValue = typeof deposito === 'string' && deposito.trim() ? deposito.trim() : 'Principal';

      const ordenes = await queryTable(supabaseUrl, 'ordenes_compra', requestHeaders(), { id: orden_compra_id });
      const orden = ordenes[0] as Record<string, unknown> | undefined;

      if (!orden) {
        return respondFail('NOT_FOUND', 'Orden de compra no encontrada', 404);
      }

      if (typeof orden.producto_id !== 'string' || !isUuid(orden.producto_id)) {
        return respondFail('VALIDATION_ERROR', 'producto_id en orden invalido', 400);
      }

      const total = Number(orden.cantidad ?? 0);
      const recibida = Number(orden.cantidad_recibida ?? 0);
      const pendiente = Math.max(
        (Number.isFinite(total) ? total : 0) - (Number.isFinite(recibida) ? recibida : 0),
        0,
      );

      if (cantidadNumero > pendiente) {
        return respondFail(
          'CONFLICT',
          'Cantidad supera lo pendiente de recepcion',
          409,
          { details: { pendiente } },
        );
      }

      const movimiento = await callFunction(supabaseUrl, 'sp_movimiento_inventario', requestHeaders(), {
        p_producto_id: orden.producto_id,
        p_tipo: 'entrada',
        p_cantidad: cantidadNumero,
        p_origen: `OC:${orden_compra_id}`,
        p_destino: depositoValue,
        p_usuario: user!.id,
        p_orden_compra_id: orden_compra_id,
      });

      return respondOk(movimiento, 201, { message: 'Recepcion registrada exitosamente' });
    }

    // ====================================================================
    // HEALTH CHECK - Public endpoint
    // ====================================================================
    if (path === '/health' && method === 'GET') {
      return respondOk({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        circuitBreaker: circuitBreaker.getState(),
      });
    }

    // ====================================================================
    // RUTA NO ENCONTRADA
    // ====================================================================

    return respondFail('NOT_FOUND', `Ruta no encontrada: ${method} ${path}`, 404);
  } catch (error) {
    // Record failure for circuit breaker
    circuitBreaker.recordFailure();

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
