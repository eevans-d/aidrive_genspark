/**
 * PERFORMANCE TESTS - Real Measurements (No Mocks)
 *
 * Tests de rendimiento para el sistema con 40k+ productos.
 * Mide operaciones reales en proceso: generacion de datos, serializacion,
 * filtrado, ordenamiento, uso de memoria y throughput de batch processing.
 *
 * @module tests/performance
 * @requires Vitest
 *
 * Execution:
 *   npx vitest run --config vitest.auxiliary.config.ts tests/performance
 *
 * Environment:
 *   - RUN_REAL_TESTS=true: Enable tests with real network calls
 *   - By default, all tests measure in-process performance (no credentials needed)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Test Configuration
// ============================================================================
const PERFORMANCE_CONFIG = {
  TARGET_PRODUCTS: 40000,
  CONCURRENT_REQUESTS: 50,
  TEST_DURATION: 30000,
  MAX_RESPONSE_TIME: 2000,
  MIN_THROUGHPUT: 100,
  MEMORY_LIMIT_MB: 512,
  BATCH_SIZE: 1000,
  /** Max time allowed for generating 40k products (ms) */
  MAX_GENERATION_TIME_MS: 5000,
  /** Max time allowed for JSON round-trip of 40k products (ms) */
  MAX_JSON_ROUNDTRIP_MS: 4000,
  /** Max time allowed for filtering 40k products (ms) */
  MAX_FILTER_TIME_MS: 500,
  /** Max time allowed for sorting 40k products (ms) */
  MAX_SORT_TIME_MS: 2000,
  /** Max time allowed per batch operation (ms) */
  MAX_BATCH_TIME_MS: 200,
};

// Check if real tests should run
const RUN_REAL_TESTS = process.env.RUN_REAL_TESTS === 'true';
const SKIP_REAL = RUN_REAL_TESTS ? it : it.skip;

// ============================================================================
// Types
// ============================================================================
interface Product {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio_unitario: number;
  stock_disponible: number;
  fuente: string;
  activo: boolean;
  ultima_actualizacion: string;
}

interface PaginatedResponse {
  success: boolean;
  data: {
    productos: Product[];
    paginacion: {
      total: number;
      limite: number;
      offset: number;
      productos_mostrados: number;
      tiene_mas: boolean;
    };
  };
}

// ============================================================================
// Helpers
// ============================================================================

/** High-resolution timer wrapper */
function timedExecution<T>(fn: () => T): { result: T; elapsedMs: number } {
  const start = performance.now();
  const result = fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}

/** Async high-resolution timer wrapper */
async function timedExecutionAsync<T>(fn: () => Promise<T>): Promise<{ result: T; elapsedMs: number }> {
  const start = performance.now();
  const result = await fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}

/** Return memory usage snapshot in MB */
function memorySnapshotMB(): { heapUsed: number; heapTotal: number; rss: number; external: number } {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed / (1024 * 1024),
    heapTotal: mem.heapTotal / (1024 * 1024),
    rss: mem.rss / (1024 * 1024),
    external: mem.external / (1024 * 1024),
  };
}

const CATEGORIES = ['almacen', 'bebidas', 'limpieza', 'frescos', 'congelados'] as const;

// ============================================================================
// Fixtures
// ============================================================================
function generateProducts(count: number): Product[] {
  const now = new Date().toISOString();
  return Array.from({ length: count }, (_, i) => ({
    id: `perf-${i}`,
    sku: `SKU-${String(i).padStart(6, '0')}`,
    nombre: `Producto Performance Test ${i}`,
    marca: `Marca ${Math.floor(i / 1000) + 1}`,
    categoria: CATEGORIES[i % 5],
    precio_unitario: Math.random() * 1000 + 10,
    stock_disponible: Math.floor(Math.random() * 500),
    fuente: 'Maxiconsumo Necochea',
    activo: i % 20 !== 0, // 5% inactive
    ultima_actualizacion: now,
  }));
}

function generatePaginatedResponse(total: number, limit: number, offset: number): PaginatedResponse {
  const productos = generateProducts(Math.min(limit, total - offset));
  return {
    success: true,
    data: {
      productos,
      paginacion: {
        total,
        limite: limit,
        offset,
        productos_mostrados: productos.length,
        tiene_mas: offset + limit < total,
      },
    },
  };
}

// ============================================================================
// Performance Tests (In-process - No credentials needed)
// ============================================================================
describe('PERFORMANCE TESTS - Real Measurements', () => {

  // -------------------------------------------------------------------------
  // 1. Data Generation Performance
  // -------------------------------------------------------------------------
  describe('Data Generation Performance', () => {

    it('should generate 40k products within time budget', () => {
      const { result: products, elapsedMs } = timedExecution(() =>
        generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS)
      );

      expect(products).toHaveLength(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_GENERATION_TIME_MS);

      // Verify structural correctness of first and last items
      const first = products[0];
      expect(first).toHaveProperty('id', 'perf-0');
      expect(first).toHaveProperty('sku', 'SKU-000000');
      expect(first).toHaveProperty('nombre');
      expect(first).toHaveProperty('precio_unitario');
      expect(first.precio_unitario).toBeGreaterThan(0);

      const last = products[products.length - 1];
      expect(last.id).toBe(`perf-${PERFORMANCE_CONFIG.TARGET_PRODUCTS - 1}`);
    });

    it('should scale linearly: 10k vs 40k generation time ratio < 5x', () => {
      const { elapsedMs: time10k } = timedExecution(() => generateProducts(10000));
      const { elapsedMs: time40k } = timedExecution(() =>
        generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS)
      );

      // 40k is 4x the data, so time ratio should be roughly 4x.
      // We allow up to 5x to account for GC and overhead.
      const ratio = time40k / Math.max(time10k, 0.01);
      expect(ratio).toBeLessThan(5);
    });
  });

  // -------------------------------------------------------------------------
  // 2. JSON Serialization / Deserialization
  // -------------------------------------------------------------------------
  describe('JSON Serialization & Deserialization Performance', () => {
    let products: Product[];

    beforeEach(() => {
      products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
    });

    afterEach(() => {
      products = null as unknown as Product[];
    });

    it('should serialize 40k products to JSON within time budget', () => {
      const { result: json, elapsedMs } = timedExecution(() =>
        JSON.stringify(products)
      );

      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_JSON_ROUNDTRIP_MS);
    });

    it('should deserialize 40k products from JSON within time budget', () => {
      const json = JSON.stringify(products);

      const { result: parsed, elapsedMs } = timedExecution(() =>
        JSON.parse(json) as Product[]
      );

      expect(parsed).toHaveLength(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      expect(parsed[0].id).toBe('perf-0');
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_JSON_ROUNDTRIP_MS);
    });

    it('should complete full JSON round-trip (serialize + deserialize) within budget', () => {
      const { elapsedMs } = timedExecution(() => {
        const json = JSON.stringify(products);
        return JSON.parse(json) as Product[];
      });

      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_JSON_ROUNDTRIP_MS);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Filtering Performance
  // -------------------------------------------------------------------------
  describe('Filtering Performance on Large Arrays', () => {
    let products: Product[];

    beforeEach(() => {
      products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
    });

    afterEach(() => {
      products = null as unknown as Product[];
    });

    it('should filter by category within time budget', () => {
      const { result: filtered, elapsedMs } = timedExecution(() =>
        products.filter(p => p.categoria === 'bebidas')
      );

      // Category distribution is uniform across 5 categories
      const expectedCount = Math.floor(PERFORMANCE_CONFIG.TARGET_PRODUCTS / 5);
      expect(filtered.length).toBe(expectedCount);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS);
    });

    it('should filter by active status within time budget', () => {
      const { result: active, elapsedMs } = timedExecution(() =>
        products.filter(p => p.activo)
      );

      // 5% are inactive (every 20th item starting at i=0)
      const expectedInactive = Math.floor(PERFORMANCE_CONFIG.TARGET_PRODUCTS / 20);
      const expectedActive = PERFORMANCE_CONFIG.TARGET_PRODUCTS - expectedInactive;
      expect(active.length).toBe(expectedActive);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS);
    });

    it('should filter by price range within time budget', () => {
      const { result: filtered, elapsedMs } = timedExecution(() =>
        products.filter(p => p.precio_unitario >= 200 && p.precio_unitario <= 500)
      );

      // Price is random [10, 1010) so roughly 30% should be in [200, 500]
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThan(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS);
    });

    it('should chain multiple filters within time budget', () => {
      const { result: filtered, elapsedMs } = timedExecution(() =>
        products
          .filter(p => p.activo)
          .filter(p => p.categoria === 'almacen')
          .filter(p => p.stock_disponible > 100)
      );

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(p => p.activo && p.categoria === 'almacen' && p.stock_disponible > 100)).toBe(true);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS);
    });

    it('should perform text search (includes) within time budget', () => {
      const searchTerm = 'Test 1234';
      const { result: found, elapsedMs } = timedExecution(() =>
        products.filter(p => p.nombre.includes(searchTerm))
      );

      // "Producto Performance Test 12345", "...12340", etc. match
      expect(found.length).toBeGreaterThan(0);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Sorting Performance
  // -------------------------------------------------------------------------
  describe('Sorting Performance on Large Arrays', () => {
    let products: Product[];

    beforeEach(() => {
      products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
    });

    afterEach(() => {
      products = null as unknown as Product[];
    });

    it('should sort by price ascending within time budget', () => {
      const copy = [...products];
      const { elapsedMs } = timedExecution(() =>
        copy.sort((a, b) => a.precio_unitario - b.precio_unitario)
      );

      // Verify sorted order (spot check)
      expect(copy[0].precio_unitario).toBeLessThanOrEqual(copy[1].precio_unitario);
      expect(copy[copy.length - 2].precio_unitario).toBeLessThanOrEqual(copy[copy.length - 1].precio_unitario);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_SORT_TIME_MS);
    });

    it('should sort by name (string comparison) within time budget', () => {
      const copy = [...products];
      const { elapsedMs } = timedExecution(() =>
        copy.sort((a, b) => a.nombre.localeCompare(b.nombre))
      );

      expect(copy[0].nombre.localeCompare(copy[1].nombre)).toBeLessThanOrEqual(0);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_SORT_TIME_MS);
    });

    it('should sort by stock descending within time budget', () => {
      const copy = [...products];
      const { elapsedMs } = timedExecution(() =>
        copy.sort((a, b) => b.stock_disponible - a.stock_disponible)
      );

      expect(copy[0].stock_disponible).toBeGreaterThanOrEqual(copy[1].stock_disponible);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_SORT_TIME_MS);
    });

    it('should sort by composite key (category + price) within time budget', () => {
      const copy = [...products];
      const { elapsedMs } = timedExecution(() =>
        copy.sort((a, b) => {
          const catCmp = a.categoria.localeCompare(b.categoria);
          if (catCmp !== 0) return catCmp;
          return a.precio_unitario - b.precio_unitario;
        })
      );

      // Verify: items in the same category should be sorted by price
      const almacenItems = copy.filter(p => p.categoria === 'almacen');
      for (let i = 1; i < Math.min(almacenItems.length, 100); i++) {
        expect(almacenItems[i - 1].precio_unitario).toBeLessThanOrEqual(almacenItems[i].precio_unitario);
      }
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_SORT_TIME_MS);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Memory Usage Measurement
  // -------------------------------------------------------------------------
  describe('Memory Usage', () => {

    it('should stay within memory limit when holding 40k products', () => {
      // Force GC if available (node --expose-gc)
      if (typeof globalThis.gc === 'function') {
        globalThis.gc();
      }

      const memBefore = memorySnapshotMB();
      const products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      const memAfter = memorySnapshotMB();

      const heapDeltaMB = memAfter.heapUsed - memBefore.heapUsed;

      expect(heapDeltaMB).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_LIMIT_MB);
      // Ensure the products array is actually populated (prevent optimizer elimination)
      expect(products.length).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
    });

    it('should measure memory of JSON string representation', () => {
      const products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);

      const memBefore = memorySnapshotMB();
      const json = JSON.stringify(products);
      const memAfter = memorySnapshotMB();

      const jsonSizeMB = Buffer.byteLength(json, 'utf8') / (1024 * 1024);
      const heapDeltaMB = memAfter.heapUsed - memBefore.heapUsed;

      // JSON string size should be reasonable for 40k products
      expect(jsonSizeMB).toBeGreaterThan(0);
      expect(jsonSizeMB).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_LIMIT_MB);
      // Heap delta should not exceed memory limit
      expect(heapDeltaMB).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_LIMIT_MB);
    });

    it('should release memory after products go out of scope', () => {
      if (typeof globalThis.gc === 'function') {
        globalThis.gc();
      }

      const memBaseline = memorySnapshotMB();

      // Allocate in a block scope
      {
        const products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
        expect(products.length).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      }

      if (typeof globalThis.gc === 'function') {
        globalThis.gc();
      }

      const memAfterRelease = memorySnapshotMB();
      // After GC, heap used should not have grown by more than 50MB over baseline
      // (relaxed threshold since GC is non-deterministic without --expose-gc)
      const delta = memAfterRelease.heapUsed - memBaseline.heapUsed;
      // This test is informational; we do not fail if GC is unavailable,
      // but if GC ran, delta should be small.
      if (typeof globalThis.gc === 'function') {
        expect(delta).toBeLessThan(50);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 6. Batch Processing Throughput
  // -------------------------------------------------------------------------
  describe('Batch Processing Throughput', () => {
    let products: Product[];

    beforeEach(() => {
      products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
    });

    afterEach(() => {
      products = null as unknown as Product[];
    });

    it('should split 40k products into batches efficiently', () => {
      const batchSize = PERFORMANCE_CONFIG.BATCH_SIZE;
      const batches: Product[][] = [];

      const { elapsedMs } = timedExecution(() => {
        for (let i = 0; i < products.length; i += batchSize) {
          batches.push(products.slice(i, i + batchSize));
        }
      });

      const expectedBatches = Math.ceil(PERFORMANCE_CONFIG.TARGET_PRODUCTS / batchSize);
      expect(batches.length).toBe(expectedBatches);
      expect(batches[0].length).toBe(batchSize);
      // Last batch may be smaller
      expect(batches[batches.length - 1].length).toBeLessThanOrEqual(batchSize);

      // Total items across all batches should equal original
      const totalItems = batches.reduce((sum, batch) => sum + batch.length, 0);
      expect(totalItems).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS);

      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_BATCH_TIME_MS);
    });

    it('should serialize each batch independently within time budget', () => {
      const batchSize = PERFORMANCE_CONFIG.BATCH_SIZE;
      const batchTimings: number[] = [];

      const { elapsedMs: totalMs } = timedExecution(() => {
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);
          const batchStart = performance.now();
          JSON.stringify(batch);
          batchTimings.push(performance.now() - batchStart);
        }
      });

      const avgBatchMs = batchTimings.reduce((a, b) => a + b, 0) / batchTimings.length;
      const maxBatchMs = Math.max(...batchTimings);

      // Each batch serialization should be fast
      expect(avgBatchMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_BATCH_TIME_MS);
      expect(maxBatchMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_BATCH_TIME_MS * 2);

      // Total should be reasonable
      expect(totalMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_JSON_ROUNDTRIP_MS);
    });

    it('should process batches with transform operation (throughput test)', () => {
      const batchSize = PERFORMANCE_CONFIG.BATCH_SIZE;
      let processedCount = 0;

      const { elapsedMs } = timedExecution(() => {
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);

          // Simulate a real transform: apply markup pricing + categorize
          const transformed = batch.map(p => ({
            ...p,
            precio_venta: p.precio_unitario * 1.35,
            margen: 0.35,
            nivel_stock: p.stock_disponible > 200 ? 'alto' : p.stock_disponible > 50 ? 'medio' : 'bajo',
          }));

          processedCount += transformed.length;
        }
      });

      expect(processedCount).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS);

      const throughputPerSec = (processedCount / elapsedMs) * 1000;
      expect(throughputPerSec).toBeGreaterThan(PERFORMANCE_CONFIG.MIN_THROUGHPUT);
    });

    it('should aggregate data across batches (reduce operation)', () => {
      const batchSize = PERFORMANCE_CONFIG.BATCH_SIZE;

      const { result: aggregated, elapsedMs } = timedExecution(() => {
        const acc = {
          totalProducts: 0,
          totalStock: 0,
          totalValue: 0,
          byCategory: {} as Record<string, { count: number; totalValue: number }>,
          activeCount: 0,
          inactiveCount: 0,
        };

        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);
          for (const p of batch) {
            acc.totalProducts++;
            acc.totalStock += p.stock_disponible;
            acc.totalValue += p.precio_unitario * p.stock_disponible;
            if (p.activo) acc.activeCount++;
            else acc.inactiveCount++;

            if (!acc.byCategory[p.categoria]) {
              acc.byCategory[p.categoria] = { count: 0, totalValue: 0 };
            }
            acc.byCategory[p.categoria].count++;
            acc.byCategory[p.categoria].totalValue += p.precio_unitario;
          }
        }

        return acc;
      });

      expect(aggregated.totalProducts).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      expect(aggregated.activeCount + aggregated.inactiveCount).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      expect(Object.keys(aggregated.byCategory)).toHaveLength(CATEGORIES.length);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS * 2);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Pagination Simulation (In-process)
  // -------------------------------------------------------------------------
  describe('Pagination Simulation (In-process)', () => {

    it('should paginate through 40k products using slices', () => {
      const products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      const pageSize = 500;
      let totalFetched = 0;
      let pages = 0;

      const { elapsedMs } = timedExecution(() => {
        for (let offset = 0; offset < products.length; offset += pageSize) {
          const page = products.slice(offset, offset + pageSize);
          totalFetched += page.length;
          pages++;
        }
      });

      expect(totalFetched).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      expect(pages).toBe(Math.ceil(PERFORMANCE_CONFIG.TARGET_PRODUCTS / pageSize));
      // Paginating through 40k items should be fast
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS);
    });

    it('should build paginated response objects within time budget', () => {
      const totalProducts = PERFORMANCE_CONFIG.TARGET_PRODUCTS;
      const pageSize = 500;
      const pagesToBuild = 10;

      const { elapsedMs } = timedExecution(() => {
        for (let i = 0; i < pagesToBuild; i++) {
          const offset = i * pageSize;
          const response = generatePaginatedResponse(totalProducts, pageSize, offset);
          expect(response.success).toBe(true);
          expect(response.data.productos.length).toBe(pageSize);
          expect(response.data.paginacion.tiene_mas).toBe(true);
        }
      });

      // 10 pages x 500 products each = 5k products generated
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_GENERATION_TIME_MS);
    });
  });

  // -------------------------------------------------------------------------
  // 8. Map/Reduce Analytics Performance
  // -------------------------------------------------------------------------
  describe('Map/Reduce Analytics Performance', () => {
    let products: Product[];

    beforeEach(() => {
      products = generateProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
    });

    afterEach(() => {
      products = null as unknown as Product[];
    });

    it('should compute category-level statistics within time budget', () => {
      const { result: stats, elapsedMs } = timedExecution(() => {
        const categoryMap = new Map<string, { count: number; prices: number[]; stockSum: number }>();

        for (const p of products) {
          let entry = categoryMap.get(p.categoria);
          if (!entry) {
            entry = { count: 0, prices: [], stockSum: 0 };
            categoryMap.set(p.categoria, entry);
          }
          entry.count++;
          entry.prices.push(p.precio_unitario);
          entry.stockSum += p.stock_disponible;
        }

        // Compute averages
        const result: Record<string, { count: number; avgPrice: number; totalStock: number }> = {};
        for (const [cat, data] of categoryMap) {
          result[cat] = {
            count: data.count,
            avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
            totalStock: data.stockSum,
          };
        }

        return result;
      });

      expect(Object.keys(stats)).toHaveLength(CATEGORIES.length);
      for (const cat of CATEGORIES) {
        expect(stats[cat].count).toBe(PERFORMANCE_CONFIG.TARGET_PRODUCTS / CATEGORIES.length);
        expect(stats[cat].avgPrice).toBeGreaterThan(0);
      }
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS * 3);
    });

    it('should find top-N most expensive products within time budget', () => {
      const N = 100;

      const { result: topN, elapsedMs } = timedExecution(() => {
        // Use a partial sort approach: sort by price desc and take first N
        const sorted = [...products].sort((a, b) => b.precio_unitario - a.precio_unitario);
        return sorted.slice(0, N);
      });

      expect(topN).toHaveLength(N);
      // Verify sorted order
      for (let i = 1; i < topN.length; i++) {
        expect(topN[i - 1].precio_unitario).toBeGreaterThanOrEqual(topN[i].precio_unitario);
      }
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_SORT_TIME_MS);
    });

    it('should group products by marca within time budget', () => {
      const { result: groups, elapsedMs } = timedExecution(() => {
        const map = new Map<string, number>();
        for (const p of products) {
          map.set(p.marca, (map.get(p.marca) || 0) + 1);
        }
        return map;
      });

      // Marca is "Marca N" where N = floor(i/1000)+1, so 40 distinct marcas for 40k products
      const expectedMarcas = Math.ceil(PERFORMANCE_CONFIG.TARGET_PRODUCTS / 1000);
      expect(groups.size).toBe(expectedMarcas);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_FILTER_TIME_MS);
    });
  });

  // -------------------------------------------------------------------------
  // 9. Real Network Tests (requires credentials)
  // -------------------------------------------------------------------------
  describe('Real Network Tests (requires credentials)', () => {

    SKIP_REAL('should connect to Supabase and measure real response time', async () => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;

      expect(url).toBeDefined();
      expect(key).toBeDefined();

      const { result: response, elapsedMs } = await timedExecutionAsync(() =>
        fetch(`${url}/rest/v1/precios_proveedor?limit=1`, {
          headers: {
            'apikey': key!,
            'Authorization': `Bearer ${key}`,
          },
        })
      );

      expect(response.ok).toBe(true);
      expect(elapsedMs).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME);
    });

    SKIP_REAL('should measure paginated fetch latency from real API', async () => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;

      expect(url).toBeDefined();
      expect(key).toBeDefined();

      const pageTimes: number[] = [];
      const pageSize = 100;

      for (let offset = 0; offset < pageSize * 3; offset += pageSize) {
        const { elapsedMs } = await timedExecutionAsync(() =>
          fetch(
            `${url}/rest/v1/precios_proveedor?limit=${pageSize}&offset=${offset}`,
            {
              headers: {
                'apikey': key!,
                'Authorization': `Bearer ${key}`,
              },
            }
          )
        );
        pageTimes.push(elapsedMs);
      }

      const avgPageTime = pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length;
      expect(avgPageTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME);
    });
  });
});
