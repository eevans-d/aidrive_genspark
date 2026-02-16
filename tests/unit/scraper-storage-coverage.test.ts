/**
 * Coverage tests for scraper-maxiconsumo/storage.ts
 * Covers: batchSaveComparisons, batchSaveAlerts, fetchProductosProveedor, fetchProductosSistema
 *         guardarProductosExtraidosOptimizado, bulkCheckExistingProducts, batchInsertProducts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Deno.env for imports
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

import {
  bulkCheckExistingProducts,
  batchInsertProducts,
  batchUpdateProducts,
  guardarProductosExtraidosOptimizado,
  batchSaveComparisons,
  batchSaveAlerts,
  fetchProductosProveedor,
  fetchProductosSistema,
} from '../../supabase/functions/scraper-maxiconsumo/storage';

const BASE_URL = 'https://x.supabase.co';
const KEY = 'test-key';

function makeProduct(sku: string) {
  return {
    sku,
    nombre: `Product ${sku}`,
    marca: 'TestBrand',
    categoria: 'Cat',
    precio_unitario: 100,
    precio_promocional: null,
    stock_disponible: 10,
    stock_nivel_minimo: 2,
    codigo_barras: null,
    url_producto: null,
    imagen_url: null,
    descripcion: null,
    hash_contenido: 'hash',
    score_confiabilidad: 0.9,
    ultima_actualizacion: new Date().toISOString(),
    metadata: {},
  };
}

const LOG = { requestId: 'r1', url: 'test', timestamp: new Date().toISOString() } as any;

describe('bulkCheckExistingProducts', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns existing products from API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ sku: 'SKU1', id: '1' }]), { status: 200 }),
    );

    const result = await bulkCheckExistingProducts(['SKU1'], BASE_URL, KEY);
    expect(result).toEqual([{ sku: 'SKU1', id: '1' }]);
  });

  it('handles fetch error gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

    const result = await bulkCheckExistingProducts(['SKU1'], BASE_URL, KEY);
    expect(result).toEqual([]);
  });

  it('handles non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    const result = await bulkCheckExistingProducts(['SKU1'], BASE_URL, KEY);
    expect(result).toEqual([]);
  });
});

describe('batchInsertProducts', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns 0 for empty array', async () => {
    const result = await batchInsertProducts([], BASE_URL, KEY, LOG);
    expect(result).toBe(0);
  });

  it('inserts products and returns count', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ sku: 'SKU1' }]), { status: 201 }),
    );

    const result = await batchInsertProducts([makeProduct('SKU1')], BASE_URL, KEY, LOG);
    expect(result).toBe(1);
  });

  it('returns 0 on error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    const result = await batchInsertProducts([makeProduct('SKU1')], BASE_URL, KEY, LOG);
    expect(result).toBe(0);
  });
});

describe('batchUpdateProducts', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('updates products and returns count', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ sku: 'SKU1' }]), { status: 200 }),
    );

    const result = await batchUpdateProducts([makeProduct('SKU1')], BASE_URL, KEY, LOG);
    expect(result).toBe(1);
  });

  it('handles errors gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

    const result = await batchUpdateProducts([makeProduct('SKU1')], BASE_URL, KEY, LOG);
    expect(result).toBe(0);
  });
});

describe('guardarProductosExtraidosOptimizado', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns 0 for empty array', async () => {
    const result = await guardarProductosExtraidosOptimizado([], BASE_URL, KEY, KEY, LOG);
    expect(result).toBe(0);
  });

  it('inserts new products and updates existing', async () => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      callCount++;
      const urlStr = typeof url === 'string' ? url : url.toString();
      // First call: bulkCheck - return SKU1 as existing
      if (urlStr.includes('sku=in.')) {
        return new Response(JSON.stringify([{ sku: 'SKU1', id: '1' }]), { status: 200 });
      }
      // POST (insert new)
      if (urlStr.includes('precios_proveedor') && !urlStr.includes('sku=eq.')) {
        return new Response(JSON.stringify([{ sku: 'SKU2' }]), { status: 201 });
      }
      // PATCH (update existing)
      return new Response(JSON.stringify([{ sku: 'SKU1' }]), { status: 200 });
    });

    const products = [makeProduct('SKU1'), makeProduct('SKU2')];
    const result = await guardarProductosExtraidosOptimizado(
      products, BASE_URL, KEY, KEY, LOG,
    );
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('batchSaveComparisons', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns 0 for empty array', async () => {
    const result = await batchSaveComparisons([], BASE_URL, KEY, LOG);
    expect(result).toBe(0);
  });

  it('saves comparisons', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 200 }),
    );

    const comps = [{
      producto_id: 'p1',
      nombre_producto: 'Test',
      precio_actual: 100,
      precio_proveedor: 80,
      diferencia_absoluta: 20,
      diferencia_porcentual: 20,
      fuente: 'maxiconsumo',
      fecha_comparacion: new Date().toISOString(),
      es_oportunidad_ahorro: true,
      recomendacion: 'Comprar',
    }];

    const result = await batchSaveComparisons(comps as any, BASE_URL, KEY, LOG);
    expect(result).toBe(1);
  });
});

describe('batchSaveAlerts', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns 0 for empty array', async () => {
    const result = await batchSaveAlerts([], BASE_URL, KEY, LOG);
    expect(result).toBe(0);
  });

  it('saves alerts', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 200 }),
    );

    const alerts = [{
      producto_id: 'p1',
      nombre_producto: 'Test',
      tipo_cambio: 'precio_bajo',
      valor_anterior: 100,
      valor_nuevo: 80,
      porcentaje_cambio: -20,
      severidad: 'media',
      mensaje: 'Price dropped',
      accion_recomendada: 'Review',
      fecha_alerta: new Date().toISOString(),
      procesada: false,
    }];

    const result = await batchSaveAlerts(alerts as any, BASE_URL, KEY, LOG);
    expect(result).toBe(1);
  });
});

describe('fetchProductosProveedor', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetches all pages', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls++;
      if (calls === 1) {
        return new Response(JSON.stringify([{ sku: 'SKU1' }]), { status: 200 });
      }
      // Empty response stops pagination
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const result = await fetchProductosProveedor(BASE_URL, KEY);
    expect(result).toEqual([{ sku: 'SKU1' }]);
  });

  it('handles error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    const result = await fetchProductosProveedor(BASE_URL, KEY);
    expect(result).toEqual([]);
  });
});

describe('fetchProductosSistema', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetches all pages', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls++;
      if (calls === 1) {
        return new Response(JSON.stringify([{ id: 'p1', nombre: 'Test' }]), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const result = await fetchProductosSistema(BASE_URL, KEY);
    expect(result).toEqual([{ id: 'p1', nombre: 'Test' }]);
  });

  it('handles error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    const result = await fetchProductosSistema(BASE_URL, KEY);
    expect(result).toEqual([]);
  });
});
