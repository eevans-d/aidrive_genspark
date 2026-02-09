/**
 * Tests para generacion de alertas desde comparaciones
 */
import { describe, it, expect } from 'vitest';
import { buildAlertasDesdeComparaciones } from '../../supabase/functions/scraper-maxiconsumo/alertas.ts';

describe('scraper-maxiconsumo/alertas', () => {
  it('genera alerta con severidad critica', () => {
    const comparaciones = [
      {
        producto_id: '1',
        nombre_producto: 'Producto A',
        precio_actual: 100,
        precio_proveedor: 70,
        diferencia_absoluta: 30,
        diferencia_porcentual: 30
      }
    ];
    const alertas = buildAlertasDesdeComparaciones(comparaciones, new Set());
    expect(alertas.length).toBe(1);
    expect(alertas[0].severidad).toBe('critica');
    // FIX (2026-02-07): tipo_cambio se deriva del signo de (precio_actual - precio_proveedor).
    // Si el proveedor cobra menos (precio_proveedor < precio_actual), es "disminucion" (mejor precio).
    expect(alertas[0].tipo_cambio).toBe('disminucion');
  });

  it('omite comparaciones ya alertadas', () => {
    const comparaciones = [
      {
        producto_id: '1',
        nombre_producto: 'Producto A',
        precio_actual: 100,
        precio_proveedor: 90,
        diferencia_absoluta: 10,
        diferencia_porcentual: 10
      }
    ];
    const alertas = buildAlertasDesdeComparaciones(comparaciones, new Set(['1']));
    expect(alertas.length).toBe(0);
  });

  it('calcula severidad media en diferencias moderadas', () => {
    const comparaciones = [
      {
        producto_id: '2',
        nombre_producto: 'Producto B',
        precio_actual: 100,
        precio_proveedor: 90,
        diferencia_absoluta: 10,
        diferencia_porcentual: 10
      }
    ];
    const alertas = buildAlertasDesdeComparaciones(comparaciones, new Set());
    expect(alertas[0].severidad).toBe('media');
  });
});
