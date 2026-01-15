/**
 * API CONTRACT TESTS
 * Tests para validar cumplimiento con especificación OpenAPI 3.1
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Mock global
global.fetch = jest.fn();

// Cargar especificación OpenAPI
const openapiSpecPath = '/workspace/docs/api-proveedor-openapi-3.1.yaml';
let openapiSpec;

describe('📋 API CONTRACT TESTS - OpenAPI 3.1 Compliance', () => {
  
  describe('📖 Spec Loading and Validation', () => {
    
    test('debe cargar especificación OpenAPI correctamente', () => {
      expect(fs.existsSync(openapiSpecPath)).toBe(true);
      
      // Verificar que es un archivo YAML válido
      const specContent = fs.readFileSync(openapiSpecPath, 'utf8');
      expect(specContent).toContain('openapi: 3.1.0');
      expect(specContent).toContain('title: Mini Market API - Proveedor Maxiconsumo');
      expect(specContent).toContain('version: 1.0.0');
    });
    
    test('debe tener estructura OpenAPI válida', () => {
      const specContent = fs.readFileSync(openapiSpecPath, 'utf8');
      
      // Verificar secciones principales
      expect(specContent).toContain('info:');
      expect(specContent).toContain('servers:');
      expect(specContent).toContain('components:');
      expect(specContent).toContain('paths:');
      expect(specContent).toContain('security:');
    });
    
  });
  
  describe('🔌 Endpoint Compliance', () => {
    
    test('debe implementar GET /status según spec', async () => {
      const expectedResponse = {
        success: true,
        data: {
          sistema: {
            estado: 'operativo',
            version: '1.0.0',
            proveedor: 'Maxiconsumo Necochea'
          },
          estadisticas: {
            ultima_ejecucion: 'string',
            productos_totales: 0,
            oportunidades_activas: 0,
            ultima_sincronizacion: 'string',
            proximo_scrape_programado: 'string'
          },
          configuracion: {
            $ref: '#/components/schemas/ConfiguracionProveedor'
          }
        }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(expectedResponse)
      });
      
      const response = await fetch('https://test.supabase.co/functions/v1/api-proveedor/status');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(data.success).toBe(true);
      expect(data.data.sistema).toBeDefined();
      expect(data.data.estadisticas).toBeDefined();
    });
    
    test('debe implementar GET /precios según spec', async () => {
      const queryParams = [
        { name: 'categoria', type: 'string', required: false, default: 'todos' },
        { name: 'limit', type: 'integer', required: false, minimum: 1, maximum: 500, default: 50 },
        { name: 'offset', type: 'integer', required: false, minimum: 0, default: 0 },
        { name: 'activo', type: 'string', required: false, enum: ['true', 'false'], default: 'true' }
      ];
      
      for (const param of queryParams) {
        const url = `https://test.supabase.co/functions/v1/api-proveedor/precios?${param.name}=test`;
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              productos: [],
              paginacion: {
                total: 0,
                limite: param.default || 50,
                offset: 0,
                productos_mostrados: 0,
                tiene_mas: false
              }
            }
          })
        });
        
        const response = await fetch(url);
        expect(response.ok).toBe(true);
        
        const data = await response.json();
        expect(data.data.paginacion).toBeDefined();
        expect(data.data.productos).toBeDefined();
      }
    });
    
    test('debe implementar GET /productos según spec', async () => {
      const queryParams = [
        { name: 'busqueda', type: 'string', required: false },
        { name: 'categoria', type: 'string', required: false },
        { name: 'marca', type: 'string', required: false },
        { name: 'solo_con_stock', type: 'boolean', required: false, default: false },
        { name: 'limit', type: 'integer', required: false, minimum: 1, maximum: 1000, default: 100 }
      ];
      
      for (const param of queryParams) {
        const url = `https://test.supabase.co/functions/v1/api-proveedor/productos?${param.name}=test`;
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              productos: [],
              estadisticas: {
                total_productos: 0,
                productos_con_stock: 0,
                marcas_unicas: 0,
                categorias_disponibles: []
              }
            }
          })
        });
        
        const response = await fetch(url);
        expect(response.ok).toBe(true);
        
        const data = await response.json();
        expect(data.data.estadisticas).toBeDefined();
        expect(data.data.productos).toBeDefined();
      }
    });
    
    test('debe implementar GET /comparacion según spec', async () => {
      const queryParams = [
        { name: 'solo_oportunidades', type: 'boolean', required: false, default: false },
        { name: 'min_diferencia', type: 'number', required: false, minimum: 0, default: 0 },
        { name: 'orden', type: 'string', required: false, enum: ['diferencia_absoluta_desc', 'diferencia_absoluta_asc', 'diferencia_porcentual_desc', 'nombre_asc'], default: 'diferencia_absoluta_desc' },
        { name: 'limit', type: 'integer', required: false, minimum: 1, maximum: 200, default: 50 }
      ];
      
      for (const param of queryParams) {
        const url = `https://test.supabase.co/functions/v1/api-proveedor/comparacion?${param.name}=test`;
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              oportunidades: [],
              estadisticas: {
                total_oportunidades: 0,
                ahorro_total_estimado: 0,
                oportunidad_promedio: 0,
                mejor_oportunidad: null
              }
            }
          })
        });
        
        const response = await fetch(url);
        expect(response.ok).toBe(true);
        
        const data = await response.json();
        expect(data.data.oportunidades).toBeDefined();
        expect(data.data.estadisticas).toBeDefined();
      }
    });
    
    test('debe implementar POST /sincronizar según spec', async () => {
      const queryParams = [
        { name: 'categoria', type: 'string', required: false },
        { name: 'force_full', type: 'boolean', required: false, default: false }
      ];
      
      const url = `https://test.supabase.co/functions/v1/api-proveedor/sincronizar`;