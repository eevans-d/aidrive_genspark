// ============================================================================
// MINI MARKET API GATEWAY - Sistema Completo RESTful
// ============================================================================
// 19 Endpoints con autenticación JWT y control de roles
// Integración completa con funciones PL/pgSQL del Sprint 3-4
// ============================================================================

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        // Configuración Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuración de Supabase faltante');
        }

        // Autenticación
        const authHeader = req.headers.get('authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;
        let user = null;
        let userRole = null;

        if (token) {
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });

            if (userResponse.ok) {
                user = await userResponse.json();
                userRole = user.user_metadata?.role || 'ventas'; // Default role
            }
        }

        // Helper: Verificar permisos por rol
        const checkRole = (allowedRoles) => {
            if (!user) {
                throw new Error('No autorizado - requiere autenticación');
            }
            if (!allowedRoles.includes(userRole)) {
                throw new Error(`Acceso denegado - requiere rol: ${allowedRoles.join(' o ')}`);
            }
        };

        // Helper: Query directo a PostgREST
        const queryTable = async (table, filters = {}, select = '*', options = {}) => {
            let queryUrl = `${supabaseUrl}/rest/v1/${table}?select=${select}`;
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryUrl += `&${key}=eq.${value}`;
                }
            });

            if (options.order) queryUrl += `&order=${options.order}`;
            if (options.limit) queryUrl += `&limit=${options.limit}`;

            const response = await fetch(queryUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Error query ${table}: ${error}`);
            }

            return await response.json();
        };

        // Helper: INSERT a tabla
        const insertTable = async (table, data) => {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Error insertando en ${table}: ${error}`);
            }

            return await response.json();
        };

        // Helper: UPDATE tabla
        const updateTable = async (table, id, data) => {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Error actualizando ${table}: ${error}`);
            }

            return await response.json();
        };

        // Helper: Ejecutar función PL/pgSQL
        const callFunction = async (functionName, params = {}) => {
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Error llamando ${functionName}: ${error}`);
            }

            return await response.json();
        };

        // ====================================================================
        // ENDPOINTS: CATEGORÍAS (2 endpoints)
        // ====================================================================

        // 1. GET /categorias - Listar todas las categorías
        if (path === '/categorias' && method === 'GET') {
            const categorias = await queryTable('categorias', 
                { activo: true }, 
                'id,codigo,nombre,descripcion,margen_minimo,margen_maximo',
                { order: 'nombre' }
            );
            
            return new Response(JSON.stringify({
                success: true,
                data: categorias,
                count: categorias.length,
                message: 'Categorías obtenidas exitosamente'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2. GET /categorias/:id - Detalle de categoría específica
        if (path.match(/^\/categorias\/[a-f0-9-]+$/) && method === 'GET') {
            const id = path.split('/')[2];
            const categorias = await queryTable('categorias', { id });

            if (categorias.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Categoría no encontrada'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                data: categorias[0]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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

            return new Response(JSON.stringify({
                success: true,
                data: filteredProductos,
                count: filteredProductos.length
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. GET /productos/:id - Detalle de producto específico
        if (path.match(/^\/productos\/[a-f0-9-]+$/) && method === 'GET') {
            const id = path.split('/')[2];
            const productos = await queryTable('productos', { id });

            if (productos.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Producto no encontrado'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                data: productos[0]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. POST /productos - Crear nuevo producto (admin/deposito)
        if (path === '/productos' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { sku, nombre, categoria_id, marca, contenido_neto } = body;

            if (!nombre) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'El nombre es requerido'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
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

            return new Response(JSON.stringify({
                success: true,
                data: producto[0],
                message: 'Producto creado exitosamente'
            }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Producto no encontrado'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                data: producto[0],
                message: 'Producto actualizado exitosamente'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Producto no encontrado'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Producto desactivado exitosamente'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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

            return new Response(JSON.stringify({
                success: true,
                data: proveedores,
                count: proveedores.length
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 9. GET /proveedores/:id - Detalle de proveedor
        if (path.match(/^\/proveedores\/[a-f0-9-]+$/) && method === 'GET') {
            const id = path.split('/')[2];
            const proveedores = await queryTable('proveedores', { id });

            if (proveedores.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Proveedor no encontrado'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                data: proveedores[0]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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
                return new Response(JSON.stringify({
                    success: false,
                    message: 'producto_id y precio_compra son requeridos'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const precioCompraNumero = Number(precio_compra);

            if (!Number.isFinite(precioCompraNumero) || precioCompraNumero <= 0) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'precio_compra debe ser mayor que 0'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const productos = await queryTable('productos', { id: producto_id }, 'id,categoria_id,precio_actual,margen_ganancia');

            if (productos.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Producto no encontrado'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
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
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Margen proyectado por debajo del mínimo de categoría. Requiere aprobación.',
                        data: {
                            margen_minimo: Number(margenMinimo),
                            margen_proyectado: margenProyectado,
                            requiere_aprobacion: true
                        }
                    }), {
                        status: 409,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
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

            return new Response(JSON.stringify({
                success: true,
                data: result,
                message: 'Precio aplicado y redondeado exitosamente'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 11. GET /precios/producto/:id - Historial de precios de un producto
        if (path.match(/^\/precios\/producto\/[a-f0-9-]+$/) && method === 'GET') {
            const productoId = path.split('/')[3];
            
            const historial = await queryTable('precios_historicos',
                { producto_id: productoId },
                'id,producto_id,precio_anterior,precio_nuevo,fecha_cambio,motivo_cambio',
                { order: 'fecha_cambio.desc', limit: 50 }
            );

            return new Response(JSON.stringify({
                success: true,
                data: historial,
                count: historial.length
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 12. POST /precios/redondear - Redondear un precio (función de utilidad)
        if (path === '/precios/redondear' && method === 'POST') {
            const body = await req.json();
            const { precio } = body;

            if (!precio) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'El precio es requerido'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const result = await callFunction('fnc_redondear_precio', {
                precio: parseFloat(precio)
            });

            return new Response(JSON.stringify({
                success: true,
                data: {
                    precio_original: parseFloat(precio),
                    precio_redondeado: result
                },
                message: 'Precio redondeado exitosamente'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 13. GET /precios/margen-sugerido/:id - Calcular margen sugerido para producto
        if (path.match(/^\/precios\/margen-sugerido\/[a-f0-9-]+$/) && method === 'GET') {
            const productoId = path.split('/')[3];

            const result = await callFunction('fnc_margen_sugerido', {
                p_producto_id: productoId
            });

            return new Response(JSON.stringify({
                success: true,
                data: {
                    producto_id: productoId,
                    margen_sugerido: result
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

            return new Response(JSON.stringify({
                success: true,
                data: stockConNombres,
                count: stockConNombres.length
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 15. GET /stock/minimo - Productos con stock bajo mínimo
        if (path === '/stock/minimo' && method === 'GET') {
            const result = await callFunction('fnc_productos_bajo_minimo');

            return new Response(JSON.stringify({
                success: true,
                data: result,
                count: result?.length || 0,
                message: 'Productos bajo stock mínimo consultados'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

            return new Response(JSON.stringify({
                success: true,
                data: {
                    producto_id: productoId,
                    deposito,
                    stock_disponible: stockDisponible,
                    detalle: stockDetalle[0] || null
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!reportResponse.ok) {
                const error = await reportResponse.text();
                throw new Error(`Error consultando tareas_metricas: ${error}`);
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

            return new Response(JSON.stringify({
                success: true,
                data,
                count: data.length,
                filtros: {
                    usuario_id: usuarioId,
                    fecha_desde: fechaDesde,
                    fecha_hasta: fechaHasta
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 18. POST /deposito/movimiento - Registrar movimiento de inventario (admin/deposito)
        if (path === '/deposito/movimiento' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { producto_id, tipo_movimiento, cantidad, origen, destino, motivo } = body;

            if (!producto_id || !tipo_movimiento || !cantidad) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'producto_id, tipo_movimiento y cantidad son requeridos'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
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

            return new Response(JSON.stringify({
                success: true,
                data: result,
                message: 'Movimiento registrado exitosamente'
            }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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

            return new Response(JSON.stringify({
                success: true,
                data: movimientos,
                count: movimientos.length
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 20. POST /deposito/ingreso - Ingreso de mercadería (admin/deposito)
        if (path === '/deposito/ingreso' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { producto_id, cantidad, proveedor_id, precio_compra, deposito } = body;

            if (!producto_id || !cantidad) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'producto_id y cantidad son requeridos'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
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

            return new Response(JSON.stringify({
                success: true,
                data: movimiento,
                message: 'Ingreso de mercadería registrado exitosamente'
            }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 20. POST /reservas - Crear reserva de stock
        if (path === '/reservas' && method === 'POST') {
            checkRole(['admin', 'ventas', 'deposito']);

            const body = await req.json();
            const { producto_id, cantidad, referencia, deposito } = body;

            if (!producto_id || !cantidad) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'producto_id y cantidad son requeridos'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const stockInfo = await callFunction('fnc_stock_disponible', {
                p_producto_id: producto_id,
                p_deposito: deposito || 'Principal'
            });
            const stockRow = Array.isArray(stockInfo) ? stockInfo[0] : stockInfo;
            const disponible = stockRow?.stock_disponible ?? 0;

            if (disponible < parseInt(cantidad)) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Stock disponible insuficiente para la reserva',
                    data: { disponible }
                }), {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const reserva = await insertTable('stock_reservado', {
                producto_id,
                cantidad: parseInt(cantidad),
                estado: 'activa',
                referencia: referencia || null,
                usuario: user.id,
                fecha_reserva: new Date().toISOString()
            });

            return new Response(JSON.stringify({
                success: true,
                data: reserva[0] || reserva,
                message: 'Reserva creada exitosamente'
            }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 21. POST /reservas/:id/cancelar - Cancelar reserva
        if (path.match(/^\/reservas\/[a-f0-9-]+\/cancelar$/) && method === 'POST') {
            checkRole(['admin', 'ventas', 'deposito']);

            const reservaId = path.split('/')[2];
            const reserva = await updateTable('stock_reservado', reservaId, {
                estado: 'cancelada',
                fecha_cancelacion: new Date().toISOString()
            });

            return new Response(JSON.stringify({
                success: true,
                data: reserva[0] || reserva,
                message: 'Reserva cancelada exitosamente'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 22. POST /compras/recepcion - Registrar recepción de compra
        if (path === '/compras/recepcion' && method === 'POST') {
            checkRole(['admin', 'deposito']);

            const body = await req.json();
            const { orden_compra_id, cantidad, deposito } = body;

            if (!orden_compra_id || !cantidad) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'orden_compra_id y cantidad son requeridos'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const ordenes = await queryTable('ordenes_compra', { id: orden_compra_id });
            const orden = ordenes[0];

            if (!orden) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Orden de compra no encontrada'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const pendiente = Math.max((orden.cantidad || 0) - (orden.cantidad_recibida || 0), 0);
            if (parseInt(cantidad) > pendiente) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Cantidad supera lo pendiente de recepción',
                    data: { pendiente }
                }), {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
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

            return new Response(JSON.stringify({
                success: true,
                data: movimiento,
                message: 'Recepción registrada exitosamente'
            }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ====================================================================
        // RUTA NO ENCONTRADA
        // ====================================================================

        return new Response(JSON.stringify({
            success: false,
            message: `Ruta no encontrada: ${method} ${path}`,
            timestamp: new Date().toISOString()
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en API:', error);

        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'API_ERROR',
                message: error.message
            },
            timestamp: new Date().toISOString()
        }), {
            status: error.message.includes('No autorizado') ? 401 : 
                   error.message.includes('Acceso denegado') ? 403 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
