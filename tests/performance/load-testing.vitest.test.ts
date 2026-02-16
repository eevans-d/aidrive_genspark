/**
 * PERFORMANCE TESTS - Real Project Code Under Load
 *
 * Benchmarks real functions from scraper, validators, shared modules under
 * high-volume conditions simulating 40k+ product catalogs.
 *
 * Every test imports and executes REAL project code — no mock-only benchmarks.
 *
 * @module tests/performance
 * @requires Vitest
 *
 * Execution:
 *   npx vitest run --config vitest.auxiliary.config.ts tests/performance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Benchmark Helpers
// ============================================================================

const PERF = {
  PRODUCT_COUNT: 40000,
  MAX_PARSE_40K_MS: 5000,
  MAX_VALIDATE_40K_MS: 3000,
  MAX_CONFIDENCE_40K_MS: 4000,
  MAX_ALERTAS_10K_MS: 3000,
  MAX_PAGINATION_MS: 100,
  MAX_SANITIZE_10K_MS: 500,
  MAX_ERROR_WRAP_10K_MS: 500,
  MEMORY_LIMIT_MB: 512,
};

function timed<T>(fn: () => T): { result: T; ms: number } {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
}

function memMB(): number {
  return process.memoryUsage().heapUsed / (1024 * 1024);
}

// ============================================================================
// 1. Scraper Parsing Functions at Scale
// ============================================================================

describe('PERF: scraper parsing at 40k scale', () => {
  let sanitizeProductName: any;
  let extraerMarcaDelNombre: any;
  let generarSKU: any;
  let calculateConfidenceScore: any;

  const CATEGORIAS = ['Bebidas', 'Almacen', 'Limpieza', 'Frescos', 'Congelados'];

  const RAW_NAMES = [
    '  🔥 Coca Cola Zero 500ml Lata  ',
    'PEPSI LIGHT 2.25L PET',
    'Arcor - Bon o Bon 270g',
    'Jabón Skip 3L Concentrado',
    'Queso Cremoso La Serenísima 1kg',
    'Pan Lactal Bimbo 350g',
    'Fideos Matarazzo Spaghetti 500g',
    'Detergente Magistral Ultra 750ml',
    'Leche La Serenísima 1L Entera',
    'Galletitas Oreo 117g',
  ];

  beforeEach(async () => {
    ({ sanitizeProductName, extraerMarcaDelNombre, generarSKU, calculateConfidenceScore } =
      await import('../../supabase/functions/scraper-maxiconsumo/parsing'));
  });

  it('sanitizeProductName × 40k within budget', () => {
    const { result, ms } = timed(() => {
      const out: string[] = [];
      for (let i = 0; i < PERF.PRODUCT_COUNT; i++) {
        out.push(sanitizeProductName(RAW_NAMES[i % RAW_NAMES.length]));
      }
      return out;
    });

    expect(result).toHaveLength(PERF.PRODUCT_COUNT);
    expect(result[0].length).toBeGreaterThan(0);
    expect(ms).toBeLessThan(PERF.MAX_PARSE_40K_MS);
  });

  it('extraerMarcaDelNombre × 40k within budget', () => {
    const names = RAW_NAMES.map(n => sanitizeProductName(n));
    const { result, ms } = timed(() => {
      const out: string[] = [];
      for (let i = 0; i < PERF.PRODUCT_COUNT; i++) {
        out.push(extraerMarcaDelNombre(names[i % names.length]));
      }
      return out;
    });

    expect(result).toHaveLength(PERF.PRODUCT_COUNT);
    expect(ms).toBeLessThan(PERF.MAX_PARSE_40K_MS);
  });

  it('generarSKU × 40k within budget', () => {
    const names = RAW_NAMES.map(n => sanitizeProductName(n));
    const { result, ms } = timed(() => {
      const out: string[] = [];
      for (let i = 0; i < PERF.PRODUCT_COUNT; i++) {
        out.push(generarSKU(names[i % names.length], CATEGORIAS[i % CATEGORIAS.length]));
      }
      return out;
    });

    expect(result).toHaveLength(PERF.PRODUCT_COUNT);
    expect(result.every((s: string) => s.length > 0)).toBe(true);
    expect(ms).toBeLessThan(PERF.MAX_PARSE_40K_MS);
  });

  it('calculateConfidenceScore × 40k within budget', () => {
    const names = RAW_NAMES.map(n => sanitizeProductName(n));
    const productos = Array.from({ length: PERF.PRODUCT_COUNT }, (_, i) => ({
      nombre: names[i % names.length],
      sku: `SKU-${i}`,
      precio_unitario: Math.random() * 1000 + 10,
      codigo_barras: `779${String(i).padStart(10, '0')}`,
      stock_disponible: Math.floor(Math.random() * 500),
    }));

    const { result, ms } = timed(() => {
      return productos.map(p => calculateConfidenceScore(p));
    });

    expect(result).toHaveLength(PERF.PRODUCT_COUNT);
    expect(result.every((s: number) => s >= 0 && s <= 100)).toBe(true);
    expect(ms).toBeLessThan(PERF.MAX_CONFIDENCE_40K_MS);
  });

  it('full pipeline (sanitize → brand → sku → score) × 10k', () => {
    const count = 10000;
    const { result, ms } = timed(() => {
      const out: Array<{ nombre: string; marca: string; sku: string; score: number }> = [];
      for (let i = 0; i < count; i++) {
        const raw = RAW_NAMES[i % RAW_NAMES.length];
        const nombre = sanitizeProductName(raw);
        const marca = extraerMarcaDelNombre(nombre);
        const sku = generarSKU(nombre, CATEGORIAS[i % CATEGORIAS.length]);
        const score = calculateConfidenceScore({
          nombre, sku,
          precio_unitario: 100 + i,
          codigo_barras: `779${i}`,
          stock_disponible: 50,
        });
        out.push({ nombre, marca, sku, score });
      }
      return out;
    });

    expect(result).toHaveLength(count);
    expect(result[0].score).toBeGreaterThan(0);
    expect(ms).toBeLessThan(PERF.MAX_PARSE_40K_MS);
  });
});

// ============================================================================
// 2. API Validator Functions at Scale
// ============================================================================

describe('PERF: api-proveedor validators at scale', () => {
  let validatePreciosParams: any;
  let validateProductosParams: any;
  let validateComparacionParams: any;
  let validateAlertasParams: any;
  let validateEstadisticasParams: any;

  beforeEach(async () => {
    ({
      validatePreciosParams,
      validateProductosParams,
      validateComparacionParams,
      validateAlertasParams,
      validateEstadisticasParams,
    } = await import('../../supabase/functions/api-proveedor/validators'));
  });

  const mkUrl = (path: string, params: Record<string, string> = {}) => {
    const u = new URL(`http://localhost/${path}`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return u;
  };

  it('validatePreciosParams × 10k within budget', () => {
    const urls = Array.from({ length: 10000 }, (_, i) =>
      mkUrl('precios', { limit: String(i % 500), offset: String(i), categoria: 'bebidas' })
    );

    const { result, ms } = timed(() => urls.map(u => validatePreciosParams(u)));

    expect(result).toHaveLength(10000);
    expect(result[0].categoria).toBe('bebidas');
    expect(ms).toBeLessThan(PERF.MAX_VALIDATE_40K_MS);
  });

  it('validateProductosParams × 10k within budget', () => {
    const urls = Array.from({ length: 10000 }, (_, i) =>
      mkUrl('productos', { busqueda: `test${i}`, limit: String(i % 1000), ordenar_por: 'precio_desc' })
    );

    const { result, ms } = timed(() => urls.map(u => validateProductosParams(u)));

    expect(result).toHaveLength(10000);
    expect(result.every((p: any) => p.ordenarPor === 'precio_desc')).toBe(true);
    expect(ms).toBeLessThan(PERF.MAX_VALIDATE_40K_MS);
  });

  it('mixed validators × 40k within budget', () => {
    const validators = [
      () => validatePreciosParams(mkUrl('precios', { limit: '25' })),
      () => validateProductosParams(mkUrl('productos', { busqueda: 'coca' })),
      () => validateComparacionParams(mkUrl('comparacion', { solo_oportunidades: 'true' })),
      () => validateAlertasParams(mkUrl('alertas', { severidad: 'critica' })),
      () => validateEstadisticasParams(mkUrl('estadisticas', { dias: '30' })),
    ];

    const { ms } = timed(() => {
      for (let i = 0; i < PERF.PRODUCT_COUNT; i++) {
        validators[i % validators.length]();
      }
    });

    expect(ms).toBeLessThan(PERF.MAX_VALIDATE_40K_MS);
  });
});

// ============================================================================
// 3. Alertas Pipeline at Scale
// ============================================================================

describe('PERF: buildAlertasDesdeComparaciones at scale', () => {
  let buildAlertasDesdeComparaciones: any;

  beforeEach(async () => {
    ({ buildAlertasDesdeComparaciones } = await import(
      '../../supabase/functions/scraper-maxiconsumo/alertas'
    ));
  });

  it('processes 10k comparisons within budget', () => {
    const comparaciones = Array.from({ length: 10000 }, (_, i) => ({
      producto_id: `p${i}`,
      nombre_producto: `Producto ${i}`,
      precio_actual: 200 + Math.random() * 300,
      precio_proveedor: 150 + Math.random() * 300,
      diferencia_porcentual: Math.random() * 40,
    }));

    const { result, ms } = timed(() =>
      buildAlertasDesdeComparaciones(comparaciones, new Set())
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10000);
    expect(ms).toBeLessThan(PERF.MAX_ALERTAS_10K_MS);
  });

  it('handles large existingIds set efficiently', () => {
    const existingIds = new Set(
      Array.from({ length: 5000 }, (_, i) => `p${i}`)
    );
    const comparaciones = Array.from({ length: 10000 }, (_, i) => ({
      producto_id: `p${i}`,
      nombre_producto: `Producto ${i}`,
      precio_actual: 300,
      precio_proveedor: 200,
      diferencia_porcentual: 33,
    }));

    const { result, ms } = timed(() =>
      buildAlertasDesdeComparaciones(comparaciones, existingIds)
    );

    // First 5000 should be skipped
    expect(result.length).toBe(5000);
    expect(ms).toBeLessThan(PERF.MAX_ALERTAS_10K_MS);
  });
});

// ============================================================================
// 4. Pagination Helpers at Scale
// ============================================================================

describe('PERF: pagination helpers under load', () => {
  let parsePagination: any;
  let buildPaginationMeta: any;

  beforeEach(async () => {
    ({ parsePagination, buildPaginationMeta } = await import(
      '../../supabase/functions/api-minimarket/helpers/pagination'
    ));
  });

  it('parsePagination × 10k within budget', () => {
    const { ms } = timed(() => {
      for (let i = 0; i < 10000; i++) {
        parsePagination(String(50), String(i * 50), 50, 100);
      }
    });
    expect(ms).toBeLessThan(PERF.MAX_PAGINATION_MS * 10);
  });

  it('buildPaginationMeta × 10k within budget', () => {
    const results: any[] = [];
    const { ms } = timed(() => {
      for (let i = 0; i < 10000; i++) {
        results.push(buildPaginationMeta(PERF.PRODUCT_COUNT, 50, i * 50));
      }
    });

    expect(results[0].total).toBe(PERF.PRODUCT_COUNT);
    expect(ms).toBeLessThan(PERF.MAX_PAGINATION_MS * 10);
  });
});

// ============================================================================
// 5. Shared Module Functions at Scale
// ============================================================================

describe('PERF: shared modules under load', () => {
  let toAppError: any;
  let isAppError: any;
  let getErrorStatus: any;
  let ok: any;
  let fail: any;

  beforeEach(async () => {
    ({ toAppError, isAppError, getErrorStatus } = await import(
      '../../supabase/functions/_shared/errors'
    ));
    ({ ok, fail } = await import('../../supabase/functions/_shared/response'));
  });

  it('toAppError + isAppError × 10k within budget', () => {
    const statuses = [400, 401, 403, 404, 422, 429, 500, 502, 503];
    const { ms } = timed(() => {
      for (let i = 0; i < 10000; i++) {
        const err = toAppError(new Error(`err-${i}`), 'CODE', statuses[i % statuses.length]);
        isAppError(err);
        getErrorStatus(err);
      }
    });
    expect(ms).toBeLessThan(PERF.MAX_ERROR_WRAP_10K_MS);
  });

  it('ok() response creation × 10k within budget', () => {
    const { result, ms } = timed(() => {
      const responses: Response[] = [];
      for (let i = 0; i < 10000; i++) {
        responses.push(ok({ id: i, name: `product-${i}` }));
      }
      return responses;
    });

    expect(result).toHaveLength(10000);
    expect(result[0].status).toBe(200);
    expect(ms).toBeLessThan(PERF.MAX_ERROR_WRAP_10K_MS * 2);
  });

  it('fail() response creation × 10k within budget', () => {
    const codes = ['NOT_FOUND', 'UNAUTHORIZED', 'VALIDATION_ERROR', 'SERVER_ERROR'];
    const statuses = [404, 401, 400, 500];
    const { result, ms } = timed(() => {
      const responses: Response[] = [];
      for (let i = 0; i < 10000; i++) {
        responses.push(fail(codes[i % codes.length], `msg-${i}`, statuses[i % statuses.length]));
      }
      return responses;
    });

    expect(result).toHaveLength(10000);
    expect(ms).toBeLessThan(PERF.MAX_ERROR_WRAP_10K_MS * 2);
  });
});

// ============================================================================
// 6. sanitizeSearchInput at Scale
// ============================================================================

describe('PERF: sanitizeSearchInput at scale', () => {
  let sanitizeSearchInput: any;

  beforeEach(async () => {
    ({ sanitizeSearchInput } = await import(
      '../../supabase/functions/api-proveedor/utils/params'
    ));
  });

  it('sanitizeSearchInput × 10k mixed inputs within budget', () => {
    const inputs = [
      'Coca Cola 500ml',
      '<script>alert(1)</script>',
      "O'Brien & Co.",
      'a'.repeat(200),
      '',
      '   hello world   ',
      'Détergent 1.5L "Ultra"',
      'normal query',
    ];

    const { result, ms } = timed(() => {
      const out: string[] = [];
      for (let i = 0; i < 10000; i++) {
        out.push(sanitizeSearchInput(inputs[i % inputs.length]));
      }
      return out;
    });

    expect(result).toHaveLength(10000);
    // XSS should be stripped
    expect(result[1]).not.toContain('<script>');
    // Long inputs truncated
    expect(result[3].length).toBe(100);
    expect(ms).toBeLessThan(PERF.MAX_SANITIZE_10K_MS);
  });
});

// ============================================================================
// 7. Memory Pressure: Full Pipeline
// ============================================================================

describe('PERF: memory pressure full pipeline', () => {
  it('full scraper pipeline with 40k products stays under memory limit', async () => {
    const { sanitizeProductName, extraerMarcaDelNombre, generarSKU, calculateConfidenceScore } =
      await import('../../supabase/functions/scraper-maxiconsumo/parsing');

    if (typeof globalThis.gc === 'function') globalThis.gc();

    const memBefore = memMB();
    const CATEGORIAS = ['Bebidas', 'Almacen', 'Limpieza', 'Frescos', 'Congelados'];
    const RAW_NAMES = [
      'Coca Cola Zero 500ml', 'Pepsi 2L', 'Arcor Bon o Bon', 'Skip 3L',
      'Queso Cremoso 1kg', 'Pan Bimbo 350g', 'Fideos 500g', 'Magistral 750ml',
    ];

    const products = Array.from({ length: PERF.PRODUCT_COUNT }, (_, i) => {
      const nombre = sanitizeProductName(RAW_NAMES[i % RAW_NAMES.length]);
      const marca = extraerMarcaDelNombre(nombre);
      const sku = generarSKU(nombre, CATEGORIAS[i % CATEGORIAS.length]);
      const score = calculateConfidenceScore({
        nombre, sku,
        precio_unitario: 100 + (i % 900),
        codigo_barras: `779${String(i).padStart(10, '0')}`,
        stock_disponible: i % 500,
      });
      return { nombre, marca, sku, score, precio: 100 + (i % 900) };
    });

    const memAfter = memMB();
    const deltaMB = memAfter - memBefore;

    expect(products).toHaveLength(PERF.PRODUCT_COUNT);
    expect(deltaMB).toBeLessThan(PERF.MEMORY_LIMIT_MB);
  });
});
