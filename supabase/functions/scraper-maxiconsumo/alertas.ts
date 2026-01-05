/**
 * Construccion de alertas desde comparaciones
 * @module scraper-maxiconsumo/alertas
 */

import type { AlertaCambio } from './types.ts';

export type ComparacionRow = {
  producto_id?: string;
  nombre_producto?: string;
  precio_actual?: number;
  precio_proveedor?: number;
  diferencia_absoluta?: number;
  diferencia_porcentual?: number;
};

export function buildAlertasDesdeComparaciones(
  comparaciones: ComparacionRow[],
  existingIds: Set<string>
): AlertaCambio[] {
  const alertas: AlertaCambio[] = [];

  for (const c of comparaciones) {
    const productoId = c.producto_id ? String(c.producto_id) : '';
    if (!productoId || existingIds.has(productoId)) continue;

    const nombreProducto = c.nombre_producto ? String(c.nombre_producto) : '';
    const precioActual = Number(c.precio_actual ?? 0);
    const precioProveedor = Number(c.precio_proveedor ?? 0);
    if (!nombreProducto || !Number.isFinite(precioActual) || !Number.isFinite(precioProveedor)) continue;

    const diffAbs = Number(c.diferencia_absoluta ?? (precioActual - precioProveedor));
    const diffPct = Math.abs(Number(c.diferencia_porcentual ?? 0));
    if (!Number.isFinite(diffPct)) continue;

    let severidad: AlertaCambio['severidad'] = 'baja';
    if (diffPct >= 25) severidad = 'critica';
    else if (diffPct >= 15) severidad = 'alta';
    else if (diffPct >= 5) severidad = 'media';

    const tipoCambio: AlertaCambio['tipo_cambio'] = diffAbs >= 0 ? 'aumento' : 'disminucion';
    const mensaje = `${nombreProducto} - diferencia ${diffPct.toFixed(1)}%`;
    const accion = diffAbs > 0
      ? 'Revisar compras para aprovechar mejor precio de proveedor'
      : 'Revisar precios del proveedor y validar competitividad';

    alertas.push({
      producto_id: productoId,
      nombre_producto: nombreProducto,
      tipo_cambio: tipoCambio,
      valor_anterior: precioActual,
      valor_nuevo: precioProveedor,
      porcentaje_cambio: diffPct,
      severidad,
      mensaje,
      accion_recomendada: accion,
      fecha_alerta: new Date().toISOString()
    });
  }

  return alertas;
}
