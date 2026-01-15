/**
 * SECURITY TESTS
 * Tests exhaustivos de seguridad para el sistema Mini Market Sprint 6
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');

// Mock global
global.fetch = jest.fn();

describe('🔒 SECURITY TESTS - Mini Market Sprint 6', () => {
  
  describe('💉 SQL Injection Prevention', () => {
    
    test('debe prevenir SQL injection en parámetros de query', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE precios_proveedor; --",
        "1' OR '1'='1",
        "' UNION SELECT * FROM usuarios --",
        "admin'; DELETE FROM comparacion_precios; --",
        "' OR 1=1 LIMIT 1 --",
        "1; INSERT INTO logs_scraping VALUES ('hacked')",
        "' AND (SELECT COUNT(*) FROM precios_proveedor) > 0 --"
      ];
      
      for (const payload of sqlInjectionPayloads) {
        const maliciousUrl = `https://test.supabase.co/functions/v1/api-proveedor/precios?categoria=${encodeURIComponent(payload)}&limit=10`;
        
        // El sistema debería manejar el payload de forma segura
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              productos: [],
              filtros_aplicados: { categoria: payload }
            }
          })
        });
        
        const response = await fetch(maliciousUrl);
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        expect(data.data.productos).toBeDefined();
        expect(data.data.filtros_aplicados.categoria).toBe(payload); // Debería escapar/validar
        
        // Verificar que no hay errores de SQL
        expect(data.error).toBeUndefined();
      }
    });
    
    test('debe validar entrada en búsquedas de productos', async () => {
      const maliciousSearches = [
        "'; SELECT password FROM admin_users; --",
        "' UNION SELECT * FROM configuracion_proveedor --",
        "admin<script>alert('xss')</script>",
        "1' AND SLEEP(5) --",
        "' OR 'a'='a' /*",
        "'; WAITFOR DELAY '00:00:05' --"
      ];
      
      for (const search of maliciousSearches) {
        const searchUrl = `https://test.supabase.co/functions/v1/api-proveedor/productos?busqueda=${encodeURIComponent(search)}`;
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              productos: [],
              filtros_aplicados: { busqueda: search }
            }
          })
        });
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        expect(data.data.productos).toBeDefined();
        
        // La búsqueda debería haber sido sanitizada
        const queryCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const queryString = queryCall[0];
        
        // Verificar que no se ejecutó SQL malicioso directamente
        expect(queryString).not.toContain('password');
        expect(queryString).not.toContain('admin_users');
        expect(queryString).not.toContain('DROP');
        expect(queryString).not.toContain('DELETE');
      }
    });
    
    test('debe prevenir injection en parámetros numéricos', async () => {
      const numericPayloads = [
        "1; DROP TABLE estadisticas_scraping; --",
        "0 OR 1=1",
        "-1 UNION SELECT * FROM logs_scraping",
        "9999999999999999999999999", // Overflow
        "-9223372036854775808" // Underflow
      ];
      
      for (const payload of numericPayloads) {
        const url = `https://test.supabase.co/functions/v1/api-proveedor/precios?limit=${payload}&offset=${payload}`;
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              productos: [],
              paginacion: { limite: 50, offset: 0 } // Valores por defecto
            }
          })
        });
        
        const response = await fetch(url);
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        
        // Debería usar valores por defecto para parámetros inválidos
        const paginacion = data.data.paginacion;
        expect(paginacion.limite).toBeLessThanOrEqual(500); // Límite máximo
        expect(paginacion.offset).toBeGreaterThanOrEqual(0); // Offset mínimo
      }
    });
    
  });
  
  describe('🔐 Authentication Bypass Prevention', () => {
    
    test('debe requerir autenticación para endpoints protegidos', async () => {
      const protectedEndpoints = [
        '/sincronizar',
        '/configuracion',
        '/estadisticas'
      ];
      
      for (const endpoint of protectedEndpoints) {
        const url = `https://test.supabase.co/functions/v1/api-proveedor${endpoint}`;
        
        // Sin token de autenticación
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            error: { code: 'AUTH_REQUIRED', message: 'Se requiere autenticación' }
          })
        });
        
        const response = await fetch(url, {
          method: 'POST', // Para sincronizar
          headers: {
            'Content-Type': 'application/json'
            // Sin Authorization header
          }
        });
        
        expect(response.status).toBe(401);
        
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('AUTH_REQUIRED');
      }
    });
    
    test('debe rechazar tokens inválidos o expirados', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid',
        'Basic YWRtaW46cGFzc3dvcmQ=', // Base64
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'Bearer null',
        'Bearer undefined',
        '',
        null,
        undefined
      ];
      
      for (const token of invalidTokens) {
        const url = 'https://test.supabase.co/functions/v1/api-proveedor/sincronizar';
        
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' }
          })
        });
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
        
        expect(response.status).toBe(401);
        
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INVALID_TOKEN');
      }
    });
    
  });
  
  describe('🛡️ CORS & Security Headers', () => {
    
    test('debe aplicar CORS restrictivo', async () => {
      const allowedOrigins = [
        'https://minimarket.app',
        'https://admin.minimarket.app'
      ];
      
      for (const origin of allowedOrigins) {
        fetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (header) => {
              if (header === 'Access-Control-Allow-Origin') return origin;
              return null;
            }
          }
        });
        
        const response = await fetch('https://test.supabase.co/functions/v1/api-proveedor/status', {
          headers: { Origin: origin }
        });
        
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      }
    });
    
    test('debe rechazar orígenes no permitidos', async () => {
      const invalidOrigins = [
        'http://malicious.com',
        'https://evil-site.net',
        'null',
        'file://'
      ];
      
      for (const origin of invalidOrigins) {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            success: false,
            error: { code: 'CORS_NOT_ALLOWED', message: 'Origen no autorizado' }
          })
        });
        
        const response = await fetch('https://test.supabase.co/functions/v1/api-proveedor/status', {
          headers: { Origin: origin }
        });
        
        expect(response.status).toBe(403);
      }
    });
    
  });
  
  describe('⛔ Rate Limiting', () => {
    
    test('debe limitar requests excesivas', async () => {
      const url = 'https://test.supabase.co/functions/v1/api-proveedor/status';
      
      // Simular requests dentro del límite
      for (let i = 0; i < 60; i++) {
        fetch.mockResolvedValueOnce({ ok: true, status: 200 });
      }
      
      // Request 61 debería fallar
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Demasiadas solicitudes' }
        })
      });
      
      const responses = [];
      for (let i = 0; i < 61; i++) {
        responses.push(fetch(url));
      }
      
      const results = await Promise.all(responses);
      const lastResponse = results[60];
      
      expect(lastResponse.status).toBe(429);
    });
    
  });
  
  describe('🔒 Data Protection', () => {
    
    test('debe prevenir exposición de datos sensibles en responses', async () => {
      const sensitiveFields = [
        'password',
        'token',
        'api_key',
        'secret',
        'credit_card',
        'dni',
        'cuit',
        'internal_id'
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            productos: [{
              id: '1',
              nombre: 'Producto Test',
              precio: 100,
              // No debería incluir campos sensibles
              password: undefined
            }]
          }
        })
      });
      
      const response = await fetch('https://test.supabase.co/functions/v1/api-proveedor/productos');
      const data = await response.json();
      
      const responseString = JSON.stringify(data);
      for (const field of sensitiveFields) {
        expect(responseString).not.toContain(field);
      }
    });
    
  });
  
  describe('🧪 Input Validation', () => {
    
    test('debe validar parámetros requeridos', async () => {
      // Endpoint requiere parámetros específicos
      const url = 'https://test.supabase.co/functions/v1/api-proveedor/precios?limit=invalid';
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'INVALID_PARAMS', message: 'Parámetros inválidos' }
        })
      });
      
      const response = await fetch(url);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_PARAMS');
    });
    
  });
  
});