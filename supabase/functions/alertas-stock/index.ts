import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { ok, fail } from '../_shared/response.ts';
import { requireServiceRoleAuth } from '../_shared/internal-auth.ts';

/** Timeout for individual PostgREST fetches */
const FETCH_TIMEOUT_MS = 8000;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders();
    const preflight = handleCors(req, corsHeaders);
    if (preflight) {
        return preflight;
    }

    const logger = createLogger('alertas-stock');
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuración de Supabase faltante');
        }

        const authCheck = requireServiceRoleAuth(req, serviceRoleKey, corsHeaders, requestId);
        if (!authCheck.authorized) {
            logger.warn('UNAUTHORIZED_REQUEST', {
                requestId,
                hasAuthorization: Boolean(req.headers.get('authorization')),
                hasApiKey: Boolean(req.headers.get('apikey')),
            });
            return authCheck.errorResponse as Response;
        }

        const headers = {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
        };

        // FIX: Batch fetch stock + productos + proveedores in 3 queries instead of N+1
        // Join stock with producto info in a single query
        const [stockResponse, proveedoresResponse] = await Promise.all([
            fetch(
                `${supabaseUrl}/rest/v1/stock_deposito?select=*,productos(id,nombre,sku,proveedor_principal_id,activo)`,
                { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
            ),
            fetch(
                `${supabaseUrl}/rest/v1/proveedores?select=id,nombre`,
                { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
            ),
        ]);

        if (!stockResponse.ok) {
            throw new Error(`Error al obtener stock: ${stockResponse.status}`);
        }

        const stockItems = await stockResponse.json();

        // Build proveedor lookup map
        const proveedorMap = new Map<string, string>();
        if (proveedoresResponse.ok) {
            const proveedores = await proveedoresResponse.json();
            for (const p of proveedores) {
                proveedorMap.set(p.id, p.nombre);
            }
        }

        const alertas = [];
        const productosConAlerta = [];
        const tareasToCreate: Record<string, unknown>[] = [];

        for (const item of stockItems) {
            if (item.cantidad_actual <= item.stock_minimo) {
                const producto = item.productos;
                if (!producto || !producto.activo) continue;

                const proveedorNombre = producto.proveedor_principal_id
                    ? (proveedorMap.get(producto.proveedor_principal_id) ?? 'Sin asignar')
                    : 'Sin asignar';

                const nivel = item.cantidad_actual === 0 ? 'crítico' :
                    item.cantidad_actual < item.stock_minimo / 2 ? 'urgente' : 'bajo';

                alertas.push({
                    producto: producto.nombre,
                    cantidad_actual: item.cantidad_actual,
                    stock_minimo: item.stock_minimo,
                    ubicacion: item.ubicacion,
                    proveedor: proveedorNombre,
                    nivel: nivel
                });

                productosConAlerta.push(producto.nombre);

                if (nivel === 'crítico') {
                    tareasToCreate.push({
                        titulo: `URGENTE: Stock agotado - ${producto.nombre}`,
                        descripcion: `El producto ${producto.nombre} está agotado en depósito. Ubicación: ${item.ubicacion}. Proveedor: ${proveedorNombre}`,
                        prioridad: 'urgente',
                        estado: 'pendiente',
                        asignada_a_nombre: 'Encargado Compras',
                        creada_por_nombre: 'Sistema Automatizado',
                        fecha_vencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    });
                }
            }
        }

        // FIX: Batch insert all critical tasks in one request instead of N individual POSTs
        if (tareasToCreate.length > 0) {
            try {
                const tareaResponse = await fetch(
                    `${supabaseUrl}/rest/v1/tareas_pendientes`,
                    {
                        method: 'POST',
                        headers,
                        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
                        body: JSON.stringify(tareasToCreate),
                    }
                );

                if (!tareaResponse.ok) {
                    logger.warn('Error creando tareas automaticas (batch)', {
                        status: tareaResponse.status,
                        count: tareasToCreate.length,
                    });
                }
            } catch (error) {
                logger.error('Error batch-creating tareas', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return ok({
            total_items_revisados: stockItems.length,
            alertas_generadas: alertas.length,
            alertas: alertas,
            productos_con_alerta: productosConAlerta,
            timestamp: new Date().toISOString()
        }, 200, corsHeaders);

    } catch (error) {
        logger.error('Error en alertas de stock', {
            error: error instanceof Error ? error.message : String(error),
        });

        return fail(
            'STOCK_ALERT_ERROR',
            error instanceof Error ? error.message : 'Error inesperado',
            500,
            undefined,
            corsHeaders,
        );
    }
});
