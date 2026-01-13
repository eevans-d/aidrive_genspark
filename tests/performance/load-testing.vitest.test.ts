/**
 * PERFORMANCE TESTS - Vitest Migration
 * 
 * Tests de rendimiento para el sistema con 40k+ productos.
 * Migrado de Jest a Vitest.
 * 
 * @module tests/performance
 * @requires Vitest
 * 
 * Execution:
 *   npx vitest run --config vitest.auxiliary.config.ts tests/performance
 * 
 * Environment:
 *   - RUN_REAL_TESTS=true: Enable tests with real network calls
 *   - By default, all tests use mocks (no credentials needed)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  BATCH_SIZE: 1000
};

// Check if real tests should run
const RUN_REAL_TESTS = process.env.RUN_REAL_TESTS === 'true';
const SKIP_REAL = RUN_REAL_TESTS ? it : it.skip;

// Mock fetch for all tests
const mockFetch = vi.fn();

// ============================================================================
// Fixtures
// ============================================================================
function generateMockProducts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `perf-${i}`,
    sku: `SKU-${String(i).padStart(6, '0')}`,
    nombre: `Producto Performance Test ${i}`,
    marca: `Marca ${Math.floor(i / 1000) + 1}`,
    categoria: ['almacen', 'bebidas', 'limpieza', 'frescos', 'congelados'][i % 5],
    precio_unitario: Math.random() * 1000 + 10,
    stock_disponible: Math.floor(Math.random() * 500),
    fuente: 'Maxiconsumo Necochea',
    activo: true,
    ultima_actualizacion: new Date().toISOString()
  }));
}

function generatePaginatedResponse(total: number, limit: number, offset: number) {
  const productos = generateMockProducts(Math.min(limit, total - offset));
  return {
    success: true,
    data: {
      productos,
      paginacion: {
        total,
        limite: limit,
        offset,
        productos_mostrados: productos.length,
        tiene_mas: offset + limit < total
      }
    }
  };
}

// ============================================================================
// Performance Tests (Mocked - No credentials needed)
// ============================================================================
describe('🚀 PERFORMANCE TESTS - Vitest', () => {
  
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });
  
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  
  describe('📊 Load Testing - Product Generation', () => {
    
    it('debe generar productos mock en tiempo aceptable', () => {
      const startTime = Date.now();
      
      const productos = generateMockProducts(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      
      const generationTime = Date.now() - startTime;
      
      expect(productos).toHaveLength(PERFORMANCE_CONFIG.TARGET_PRODUCTS);
      expect(generationTime).toBeLessThan(5000); // Max 5 segundos
      
      // Verify structure
      const sample = productos[0];
      expect(sample).toHaveProperty('id');
      expect(sample).toHaveProperty('sku');
      expect(sample).toHaveProperty('nombre');
      expect(sample).toHaveProperty('precio_unitario');
      
      console.log(`📊 Generation: ${productos.length} products in ${generationTime}ms`);
    });

    it('no debe llamar fetch al generar fixtures locales', () => {
      const productos = generateMockProducts(PERFORMANCE_CONFIG.BATCH_SIZE);
      expect(productos).toHaveLength(PERFORMANCE_CONFIG.BATCH_SIZE);
      expect(mockFetch).not.toHaveBeenCalled();
    });
    
    it('debe simular inserción batch con mock fetch', async () => {
      const productos = generateMockProducts(PERFORMANCE_CONFIG.BATCH_SIZE * 3);
      const startTime = Date.now();
      let insertados = 0;
      
      // Setup mock for batch inserts
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ inserted: PERFORMANCE_CONFIG.BATCH_SIZE })
      }));
      
      // Simulate batch inserts
      for (let i = 0; i < productos.length; i += PERFORMANCE_CONFIG.BATCH_SIZE) {
        const batch = productos.slice(i, i + PERFORMANCE_CONFIG.BATCH_SIZE);
        
        const response = await fetch('https://mock.supabase.co/rest/v1/precios_proveedor', {
          method: 'POST',
          body: JSON.stringify(batch)
        });
        
        expect(response.ok).toBe(true);
        insertados += batch.length;
      }
      
      const insertTime = Date.now() - startTime;
      const callCount = mockFetch.mock.calls.length;
      
      expect(insertados).toBe(productos.length);
      expect(callCount).toBe(Math.ceil(productos.length / PERFORMANCE_CONFIG.BATCH_SIZE));
      
      console.log(`📊 Batch Insert: ${insertados} products in ${callCount} batches (${insertTime}ms)`);
    });
    
    it('debe simular consultas paginadas', async () => {
      const totalProducts = 40000;
      const pageSize = 500;
      let totalFetched = 0;
      let pages = 0;
      
      mockFetch.mockImplementation((url: string) => {
        const urlObj = new URL(url);
        const offset = parseInt(urlObj.searchParams.get('offset') || '0');
        const limit = parseInt(urlObj.searchParams.get('limit') || String(pageSize));
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(generatePaginatedResponse(totalProducts, limit, offset))
        });
      });
      
      // Fetch first 3 pages
      for (let offset = 0; offset < pageSize * 3; offset += pageSize) {
        const response = await fetch(`https://mock.supabase.co/rest/v1/precios_proveedor?limit=${pageSize}&offset=${offset}`);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.data.productos.length).toBeLessThanOrEqual(pageSize);
        
        totalFetched += data.data.productos.length;
        pages++;
      }
      
      expect(totalFetched).toBe(pageSize * 3);
      expect(pages).toBe(3);
      
      console.log(`📊 Pagination: ${totalFetched} products in ${pages} pages`);
    });
    
  });
  
  describe('⏱️ Response Time Simulation', () => {
    
    it('debe medir tiempo de respuesta mock', async () => {
      const responseTimes: number[] = [];
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] })
          }), Math.random() * 50) // 0-50ms latency simulation
        )
      );
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await fetch('https://mock.supabase.co/test');
        responseTimes.push(Date.now() - start);
      }
      
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      
      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME);
      
      console.log(`⏱️ Response times: avg=${avgTime.toFixed(1)}ms, max=${maxTime}ms`);
    });
    
  });
  
  describe('🔗 Real Network Tests (requires credentials)', () => {
    
    SKIP_REAL('debe conectar a Supabase real', async () => {
      // This test only runs with RUN_REAL_TESTS=true
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;
      
      expect(url).toBeDefined();
      expect(key).toBeDefined();
      
      // Real fetch (not mocked)
      vi.unstubAllGlobals();
      
      const response = await fetch(`${url}/rest/v1/precios_proveedor?limit=1`, {
        headers: {
          'apikey': key!,
          'Authorization': `Bearer ${key}`
        }
      });
      
      expect(response.ok).toBe(true);
    });
    
  });
  
});
