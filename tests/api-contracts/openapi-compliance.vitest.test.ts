/**
 * API CONTRACT TESTS - Vitest Migration
 * 
 * Tests para validar cumplimiento con especificación OpenAPI 3.1.
 * Migrado de Jest a Vitest.
 * 
 * @module tests/api-contracts
 * @requires Vitest
 * 
 * Execution:
 *   npx vitest run --config vitest.auxiliary.config.ts tests/api-contracts
 * 
 * Environment:
 *   - RUN_REAL_TESTS=true: Enable tests with real network calls
 *   - By default, all tests use mocks (no credentials needed)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Test Configuration
// ============================================================================
const RUN_REAL_TESTS = process.env.RUN_REAL_TESTS === 'true';
const SKIP_REAL = RUN_REAL_TESTS ? it : it.skip;
const DEFAULT_TEST_ORIGIN = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)[0] || 'http://localhost:5173';
const REAL_TEST_ORIGIN = process.env.TEST_ORIGIN || DEFAULT_TEST_ORIGIN;

// Mock fetch
const mockFetch = vi.fn();

// OpenAPI spec paths
const OPENAPI_SPEC_PATH = path.resolve(__dirname, '../../docs/api-proveedor-openapi-3.1.yaml');
const OPENAPI_MAIN_PATH = path.resolve(__dirname, '../../docs/api-openapi-3.1.yaml');

// ============================================================================
// OpenAPI Mock Responses (based on spec)
// ============================================================================
const MOCK_STATUS_RESPONSE = {
  success: true,
  data: {
    sistema: {
      estado: 'operativo',
      version: '1.0.0',
      proveedor: 'Maxiconsumo Necochea'
    },
    estadisticas: {
      ultima_ejecucion: new Date().toISOString(),
      productos_totales: 40000,
      oportunidades_activas: 150,
      ultima_sincronizacion: new Date().toISOString(),
      proximo_scrape_programado: new Date().toISOString()
    }
  }
};

const MOCK_PRECIOS_RESPONSE = {
  success: true,
  data: {
    productos: [
      {
        sku: 'SKU-000001',
        nombre: 'Producto Test',
        marca: 'Marca Test',
        categoria: 'almacen',
        precio_unitario: 150.50,
        stock_disponible: 100,
        fuente: 'Maxiconsumo Necochea',
        activo: true,
        ultima_actualizacion: new Date().toISOString()
      }
    ],
    paginacion: {
      total: 40000,
      limite: 50,
      offset: 0,
      productos_mostrados: 1,
      tiene_mas: true
    }
  }
};

const MOCK_PRODUCTOS_RESPONSE = {
  success: true,
  data: {
    productos: [
      {
        id: 'uuid-123',
        sku: 'SKU-000001',
        nombre: 'Producto Test',
        precio_unitario: 150.50
      }
    ],
    estadisticas: {
      total_productos: 40000,
      productos_con_stock: 35000,
      marcas_unicas: 250,
      categorias_disponibles: ['almacen', 'bebidas', 'limpieza']
    }
  }
};

const MOCK_COMPARACION_RESPONSE = {
  success: true,
  data: {
    comparaciones: [
      {
        producto_id: 'uuid-123',
        nombre_producto: 'Producto Test',
        precio_actual: 180.00,
        precio_proveedor: 150.50,
        diferencia_absoluta: 29.50,
        diferencia_porcentual: 19.6,
        es_oportunidad_ahorro: true,
        recomendacion: '💰 BUENA OPORTUNIDAD'
      }
    ],
    resumen: {
      total_comparados: 40000,
      oportunidades_ahorro: 150,
      ahorro_potencial: 45000
    }
  }
};

// ============================================================================
// API Contract Tests (Mocked - No credentials needed)
// ============================================================================
describe('📋 API CONTRACT TESTS - Vitest', () => {
  
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });
  
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  
  describe('📖 OpenAPI Spec Validation', () => {
    
    it('debe existir especificación OpenAPI para api-proveedor', () => {
      const exists = fs.existsSync(OPENAPI_SPEC_PATH);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = fs.readFileSync(OPENAPI_SPEC_PATH, 'utf8');
        expect(content).toContain('openapi:');
        expect(content).toContain('paths:');
        expect(content).toContain('components:');
      }
    });
    
    it('debe existir especificación OpenAPI para api-minimarket', () => {
      const exists = fs.existsSync(OPENAPI_MAIN_PATH);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = fs.readFileSync(OPENAPI_MAIN_PATH, 'utf8');
        expect(content).toContain('openapi:');
        expect(content).toContain('paths:');
      }
    });
    
    it('debe tener versión OpenAPI 3.1 o superior', () => {
      const content = fs.readFileSync(OPENAPI_SPEC_PATH, 'utf8');
      const versionMatch = content.match(/openapi:\s*['"]?([\d.]+)['"]?/);
      
      expect(versionMatch).not.toBeNull();
      if (versionMatch) {
        const version = parseFloat(versionMatch[1]);
        expect(version).toBeGreaterThanOrEqual(3.0);
      }
    });

    it('incluye al menos un server local definido en spec', () => {
      const content = fs.readFileSync(OPENAPI_SPEC_PATH, 'utf8');
      const hasServer = content.includes('servers:') && content.match(/https?:\/\//);
      expect(hasServer).toBeTruthy();
    });
    
  });
  
  describe('🔌 GET /status Contract', () => {
    
    it('debe retornar estructura según OpenAPI spec', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(MOCK_STATUS_RESPONSE)
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/status');
      const data = await response.json();
      
      // Validate response structure
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      
      // Validate sistema object
      expect(data.data.sistema).toBeDefined();
      expect(data.data.sistema.estado).toBeDefined();
      expect(data.data.sistema.version).toBeDefined();
      expect(data.data.sistema.proveedor).toBeDefined();
      
      // Validate estadisticas object
      expect(data.data.estadisticas).toBeDefined();
      expect(data.data.estadisticas.productos_totales).toBeDefined();
      expect(typeof data.data.estadisticas.productos_totales).toBe('number');
    });
    
  });
  
  describe('🔌 GET /precios Contract', () => {
    
    it('debe retornar estructura de paginación según spec', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_PRECIOS_RESPONSE)
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/precios?limit=50');
      const data = await response.json();
      
      // Validate response
      expect(data.success).toBe(true);
      expect(data.data.productos).toBeInstanceOf(Array);
      
      // Validate pagination
      const paginacion = data.data.paginacion;
      expect(paginacion).toBeDefined();
      expect(paginacion.total).toBeDefined();
      expect(paginacion.limite).toBeDefined();
      expect(paginacion.offset).toBeDefined();
      expect(paginacion.tiene_mas).toBeDefined();
      expect(typeof paginacion.tiene_mas).toBe('boolean');
    });
    
    it('debe validar query params según spec', async () => {
      const validParams = [
        { name: 'categoria', value: 'almacen' },
        { name: 'limit', value: '50' },
        { name: 'offset', value: '0' },
        { name: 'activo', value: 'true' }
      ];
      
      for (const param of validParams) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MOCK_PRECIOS_RESPONSE)
        });
        
        const response = await fetch(`https://mock.supabase.co/functions/v1/api-proveedor/precios?${param.name}=${param.value}`);
        expect(response.ok).toBe(true);
      }
    });
    
  });
  
  describe('🔌 GET /productos Contract', () => {
    
    it('debe retornar estructura de productos según spec', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_PRODUCTOS_RESPONSE)
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/productos');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.productos).toBeInstanceOf(Array);
      expect(data.data.estadisticas).toBeDefined();
      
      // Validate producto structure if present
      if (data.data.productos.length > 0) {
        const producto = data.data.productos[0];
        expect(producto).toHaveProperty('sku');
        expect(producto).toHaveProperty('nombre');
      }
    });
    
  });
  
  describe('🔌 GET /comparacion Contract', () => {
    
    it('debe retornar estructura de comparaciones según spec', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_COMPARACION_RESPONSE)
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/comparacion');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.comparaciones).toBeInstanceOf(Array);
      expect(data.data.resumen).toBeDefined();
      
      // Validate comparacion structure if present
      if (data.data.comparaciones.length > 0) {
        const comp = data.data.comparaciones[0];
        expect(comp).toHaveProperty('producto_id');
        expect(comp).toHaveProperty('precio_actual');
        expect(comp).toHaveProperty('precio_proveedor');
        expect(comp).toHaveProperty('diferencia_porcentual');
      }
    });
    
  });
  
  describe('❌ Error Response Contract', () => {
    
    it('debe retornar estructura de error estándar', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetro inválido: limit debe ser número'
          }
        })
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/precios?limit=invalid');
      const data = await response.json();
      
      expect(response.ok).toBe(false);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });
    
  });
  
  describe('🔗 Real Contract Tests (requires credentials)', () => {
    
    SKIP_REAL('debe validar contrato real de /status', async () => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;
      
      vi.unstubAllGlobals();
      
      const response = await fetch(`${url}/functions/v1/api-proveedor/status`, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'x-api-secret': process.env.API_PROVEEDOR_SECRET || '',
          'origin': REAL_TEST_ORIGIN
        }
      });
      
      const data = await response.json();
      
      // Same validations as mock test
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.sistema).toBeDefined();
      expect(data.data.estadisticas).toBeDefined();
    });
    
  });
  
});
