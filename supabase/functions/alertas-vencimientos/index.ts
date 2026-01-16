import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { ok, fail } from '../_shared/response.ts';

interface StockItem {
  producto_id: string;
  cantidad_actual: number;
  stock_minimo: number;
  ubicacion: string | null;
  lote: string | null;
  fecha_vencimiento: string | null;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  const preflight = handleCors(req, corsHeaders);
  if (preflight) {
    return preflight;
  }

  const logger = createLogger('alertas-vencimientos');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuración de Supabase faltante');
    }

    const url = new URL(req.url);
    const warningDays = Math.max(1, Number(url.searchParams.get('warning_days') ?? 30));
    const urgentDays = Math.max(1, Number(url.searchParams.get('urgent_days') ?? 7));

    const now = new Date();
    const warningLimit = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);

    const warningDate = warningLimit.toISOString().split('T')[0];

    const stockResponse = await fetch(
      `${supabaseUrl}/rest/v1/stock_deposito?select=producto_id,cantidad_actual,stock_minimo,ubicacion,lote,fecha_vencimiento&fecha_vencimiento=not.is.null&fecha_vencimiento=lte.${warningDate}`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        }
      }
    );

    if (!stockResponse.ok) {
      throw new Error('Error al obtener stock con vencimientos');
    }

    const stockItems = (await stockResponse.json()) as StockItem[];
    const alertas: Record<string, unknown>[] = [];
    const productosConAlerta: string[] = [];

    const productoIds = Array.from(new Set(stockItems.map((item) => item.producto_id).filter(Boolean)));
    const productosMap: Record<string, { nombre: string; proveedor_principal_id?: string | null }> = {};
    const proveedoresMap: Record<string, string> = {};

    if (productoIds.length > 0) {
      const productosResponse = await fetch(
        `${supabaseUrl}/rest/v1/productos?id=in.(${productoIds.join(',')})&select=id,nombre,proveedor_principal_id`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          }
        }
      );

      if (productosResponse.ok) {
        const productos = await productosResponse.json();
        for (const producto of productos) {
          productosMap[producto.id] = producto;
        }
      }

      const proveedorIds = Array.from(
        new Set(
          Object.values(productosMap)
            .map((prod) => prod.proveedor_principal_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (proveedorIds.length > 0) {
        const proveedoresResponse = await fetch(
          `${supabaseUrl}/rest/v1/proveedores?id=in.(${proveedorIds.join(',')})&select=id,nombre`,
          {
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            }
          }
        );

        if (proveedoresResponse.ok) {
          const proveedores = await proveedoresResponse.json();
          for (const proveedor of proveedores) {
            proveedoresMap[proveedor.id] = proveedor.nombre;
          }
        }
      }
    }

    for (const item of stockItems) {
      if (!item.fecha_vencimiento) continue;

      const fechaVencimiento = new Date(item.fecha_vencimiento);
      if (Number.isNaN(fechaVencimiento.getTime())) continue;

      const diffMs = fechaVencimiento.getTime() - now.getTime();
      const diasRestantes = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      let nivel = 'proximo';
      if (diasRestantes < 0) {
        nivel = 'vencido';
      } else if (diasRestantes <= urgentDays) {
        nivel = 'urgente';
      }

      const producto = productosMap[item.producto_id];
      const productoNombre = producto?.nombre ?? 'Producto sin nombre';
      const proveedorNombre = producto?.proveedor_principal_id
        ? proveedoresMap[producto.proveedor_principal_id] ?? 'Sin asignar'
        : 'Sin asignar';

      alertas.push({
        producto: productoNombre,
        producto_id: item.producto_id,
        cantidad_actual: item.cantidad_actual,
        lote: item.lote,
        ubicacion: item.ubicacion,
        fecha_vencimiento: item.fecha_vencimiento,
        dias_restantes: diasRestantes,
        nivel,
        proveedor: proveedorNombre,
      });

      productosConAlerta.push(productoNombre);

      if (nivel === 'vencido' || nivel === 'urgente') {
        const titulo = nivel === 'vencido'
          ? `URGENTE: Producto vencido - ${productoNombre}`
          : `Alerta: Producto próximo a vencer - ${productoNombre}`;

        const descripcion = `Producto ${productoNombre} (${item.lote || 'sin lote'}) vence el ${fechaVencimiento.toLocaleDateString('es-AR')} en ubicación ${item.ubicacion || 'N/A'}. Proveedor: ${proveedorNombre}.`;

        const tareaResponse = await fetch(
          `${supabaseUrl}/rest/v1/tareas_pendientes`,
          {
            method: 'POST',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              titulo,
              descripcion,
              prioridad: nivel === 'vencido' ? 'urgente' : 'alta',
              estado: 'pendiente',
              asignada_a_nombre: 'Encargado Compras',
              creada_por_nombre: 'Sistema Automatizado',
              fecha_vencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
          }
        );

        if (!tareaResponse.ok) {
          logger.warn('Error creando tarea automatica', {
            producto: productoNombre,
            status: tareaResponse.status,
          });
        }
      }
    }

    return ok({
      total_items_revisados: stockItems.length,
      alertas_generadas: alertas.length,
      alertas,
      productos_con_alerta: productosConAlerta,
      parametros: {
        warning_days: warningDays,
        urgent_days: urgentDays,
      },
      timestamp: new Date().toISOString(),
    }, 200, corsHeaders);

  } catch (error) {
    logger.error('Error en alertas de vencimientos', {
      error: error instanceof Error ? error.message : String(error),
    });

    return fail(
      'EXPIRY_ALERT_ERROR',
      error instanceof Error ? error.message : 'Error inesperado',
      500,
      undefined,
      corsHeaders,
    );
  }
});
