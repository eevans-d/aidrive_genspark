import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { ok, fail } from '../_shared/response.ts';
import { requireServiceRoleAuth } from '../_shared/internal-auth.ts';

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders();
    const preflight = handleCors(req, corsHeaders);
    if (preflight) {
        return preflight;
    }

    const logger = createLogger('reportes-automaticos');
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

        // Generar reporte diario
        const reportData: any = {
            fecha_reporte: new Date().toISOString(),
            tipo: 'diario',
        };

        // 1. Resumen de stock
        const stockResponse = await fetch(
            `${supabaseUrl}/rest/v1/stock_deposito?select=*`,
            {
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                }
            }
        );

        if (stockResponse.ok) {
            const stock = await stockResponse.json();
            const stockBajo = stock.filter((s: any) => s.cantidad_actual <= s.stock_minimo);
            const stockCritico = stock.filter((s: any) => s.cantidad_actual === 0);

            reportData.stock = {
                total_productos: stock.length,
                productos_stock_bajo: stockBajo.length,
                productos_criticos: stockCritico.length,
                valor_total_inventario: stock.reduce((sum: number, s: any) => sum + (s.cantidad_actual || 0), 0)
            };
        }

        // 2. Movimientos del día
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const movimientosResponse = await fetch(
            `${supabaseUrl}/rest/v1/movimientos_deposito?fecha=gte.${hoy.toISOString()}&select=*`,
            {
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                }
            }
        );

        if (movimientosResponse.ok) {
            const movimientos = await movimientosResponse.json();
            const entradas = movimientos.filter((m: any) => m.tipo === 'entrada');
            const salidas = movimientos.filter((m: any) => m.tipo === 'salida');

            reportData.movimientos = {
                total: movimientos.length,
                entradas: entradas.length,
                salidas: salidas.length,
                cantidad_total_entrada: entradas.reduce((sum: number, e: any) => sum + (e.cantidad || 0), 0),
                cantidad_total_salida: salidas.reduce((sum: number, s: any) => sum + (s.cantidad || 0), 0)
            };
        }

        // 3. Tareas pendientes
        const tareasResponse = await fetch(
            `${supabaseUrl}/rest/v1/tareas_pendientes?select=*`,
            {
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                }
            }
        );

        if (tareasResponse.ok) {
            const tareas = await tareasResponse.json();
            const pendientes = tareas.filter((t: any) => t.estado === 'pendiente');
            const urgentes = pendientes.filter((t: any) => t.prioridad === 'urgente');
            const vencidas = pendientes.filter((t: any) => {
                if (!t.fecha_vencimiento) return false;
                return new Date(t.fecha_vencimiento) < new Date();
            });

            reportData.tareas = {
                total: tareas.length,
                pendientes: pendientes.length,
                urgentes: urgentes.length,
                vencidas: vencidas.length,
                completadas_hoy: tareas.filter((t: any) => {
                    if (!t.fecha_completada) return false;
                    const fc = new Date(t.fecha_completada);
                    return fc >= hoy;
                }).length
            };
        }

        // 4. Cambios de precios recientes
        const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const preciosResponse = await fetch(
            `${supabaseUrl}/rest/v1/precios_historicos?fecha=gte.${ayer.toISOString()}&select=*`,
            {
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                }
            }
        );

        if (preciosResponse.ok) {
            const precios = await preciosResponse.json();
            const aumentos = precios.filter((p: any) => (p.cambio_porcentaje || 0) > 0);
            const disminuciones = precios.filter((p: any) => (p.cambio_porcentaje || 0) < 0);

            reportData.precios = {
                total_cambios: precios.length,
                aumentos: aumentos.length,
                disminuciones: disminuciones.length,
                cambio_promedio: precios.length > 0 
                    ? (precios.reduce((sum: number, p: any) => sum + (p.cambio_porcentaje || 0), 0) / precios.length).toFixed(2)
                    : 0
            };
        }

        // 5. Productos faltantes
        const faltantesResponse = await fetch(
            `${supabaseUrl}/rest/v1/productos_faltantes?resuelto=eq.false&select=*`,
            {
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                }
            }
        );

        if (faltantesResponse.ok) {
            const faltantes = await faltantesResponse.json();
            reportData.productos_faltantes = {
                total: faltantes.length,
                sin_asignar_proveedor: faltantes.filter((f: any) => !f.proveedor_asignado_id).length
            };
        }

        return ok(reportData, 200, corsHeaders);

    } catch (error) {
        logger.error('Error en reportes', {
            error: error instanceof Error ? error.message : String(error),
        });

        return fail(
            'REPORT_ERROR',
            error instanceof Error ? error.message : 'Error inesperado',
            500,
            undefined,
            corsHeaders,
        );
    }
});
