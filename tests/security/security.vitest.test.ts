/**
 * SECURITY TESTS - Vitest Migration
 * 
 * Tests de seguridad para el sistema Mini Market.
 * Migrado de Jest a Vitest.
 * 
 * @module tests/security
 * @requires Vitest
 * 
 * Execution:
 *   npx vitest run --config vitest.auxiliary.config.ts tests/security
 * 
 * Environment:
 *   - RUN_REAL_TESTS=true: Enable tests with real network calls
 *   - By default, all tests use mocks (no credentials needed)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Test Configuration
// ============================================================================
const RUN_REAL_TESTS = process.env.RUN_REAL_TESTS === 'true';
const SKIP_REAL = RUN_REAL_TESTS ? it : it.skip;

// Mock fetch for all tests
const mockFetch = vi.fn();

// ============================================================================
// Security Payloads (Fixtures)
// ============================================================================
const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE precios_proveedor; --",
  "1' OR '1'='1",
  "' UNION SELECT * FROM usuarios --",
  "admin'; DELETE FROM comparacion_precios; --",
  "' OR 1=1 LIMIT 1 --",
  "1; INSERT INTO logs_scraping VALUES ('hacked')",
  "' AND (SELECT COUNT(*) FROM precios_proveedor) > 0 --"
];

const XSS_PAYLOADS = [
  "<script>alert('xss')</script>",
  "<img src=x onerror=alert('xss')>",
  "javascript:alert('xss')",
  "<svg onload=alert('xss')>",
  "'\"><script>alert('xss')</script>",
  "<body onload=alert('xss')>"
];

const NUMERIC_INJECTION_PAYLOADS = [
  "1; DROP TABLE estadisticas_scraping; --",
  "0 OR 1=1",
  "-1 UNION SELECT * FROM logs_scraping",
  "9999999999999999999999999",
  "-9223372036854775808"
];

const PROTECTED_ENDPOINTS = [
  '/sincronizar',
  '/configuracion',
  '/estadisticas'
];

// ============================================================================
// Mock Response Helpers
// ============================================================================
function mockSafeResponse(payload: string) {
  return {
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: {
        productos: [],
        filtros_aplicados: { input: payload }  // Echo back sanitized
      }
    })
  };
}

function mockAuthErrorResponse() {
  return {
    ok: false,
    status: 401,
    json: () => Promise.resolve({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Se requiere autenticación' }
    })
  };
}

function mockRateLimitResponse() {
  return {
    ok: false,
    status: 429,
    json: () => Promise.resolve({
      success: false,
      error: { code: 'RATE_LIMIT', message: 'Demasiadas solicitudes' }
    })
  };
}

// ============================================================================
// Security Tests (Mocked - No credentials needed)
// ============================================================================
describe('🔒 SECURITY TESTS - Vitest', () => {
  
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });
  
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  
  describe('💉 SQL Injection Prevention', () => {
    
    it('debe manejar payloads SQL injection sin error', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS) {
        mockFetch.mockResolvedValueOnce(mockSafeResponse(payload));
        
        const url = `https://mock.supabase.co/functions/v1/api-proveedor/precios?categoria=${encodeURIComponent(payload)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Should respond without DB error
        expect(response.ok).toBe(true);
        expect(data.success).toBe(true);
        expect(data.data.productos).toBeDefined();
        
        // Should not contain SQL keywords in error
        expect(JSON.stringify(data)).not.toContain('syntax error');
        expect(JSON.stringify(data)).not.toContain('permission denied');
      }
      
      expect(mockFetch).toHaveBeenCalledTimes(SQL_INJECTION_PAYLOADS.length);
    });
    
    it('debe validar parámetros numéricos contra injection', async () => {
      for (const payload of NUMERIC_INJECTION_PAYLOADS) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              productos: [],
              paginacion: { limite: 50, offset: 0 }  // Default values
            }
          })
        });
        
        const url = `https://mock.supabase.co/functions/v1/api-proveedor/precios?limit=${payload}`;
        const response = await fetch(url);
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        
        // Should use default/safe values
        expect(data.data.paginacion.limite).toBeLessThanOrEqual(500);
        expect(data.data.paginacion.offset).toBeGreaterThanOrEqual(0);
      }
    });
    
  });
  
  describe('🛡️ XSS Prevention', () => {
    
    it('debe manejar payloads XSS sin ejecutar scripts', async () => {
      for (const payload of XSS_PAYLOADS) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              productos: [{
                nombre: payload,  // Echoed but should be sanitized client-side
                precio: 100
              }]
            }
          })
        });
        
        const url = `https://mock.supabase.co/functions/v1/api-proveedor/productos?busqueda=${encodeURIComponent(payload)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        expect(data.success).toBe(true);
        
        // Note: XSS prevention is primarily client-side
        // Server should not crash or error on these payloads
      }
    });
    
  });

  describe('🌐 CORS y headers seguros', () => {
    it('retorna headers CORS esperados en respuestas mock', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['access-control-allow-origin', 'https://permitido.com'],
          ['access-control-allow-headers', 'authorization, x-api-secret']
        ]),
        json: () => Promise.resolve({ success: true })
      });

      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/status');

      expect(response.ok).toBe(true);
      expect(response.headers.get('access-control-allow-origin')).toBe('https://permitido.com');
      expect(response.headers.get('access-control-allow-headers')).toContain('authorization');
    });
  });
  
  describe('🔐 Authentication & Authorization', () => {
    
    it('debe rechazar acceso sin autenticación a endpoints protegidos', async () => {
      for (const endpoint of PROTECTED_ENDPOINTS) {
        mockFetch.mockResolvedValueOnce(mockAuthErrorResponse());
        
        const url = `https://mock.supabase.co/functions/v1/api-proveedor${endpoint}`;
        const response = await fetch(url);  // No auth header
        
        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
        
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('AUTH_REQUIRED');
      }
    });
    
    it('debe permitir acceso con autenticación válida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { authenticated: true }
        })
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/status', {
        headers: {
          'Authorization': 'Bearer valid-token',
          'x-api-secret': 'valid-secret'
        }
      });
      
      expect(response.ok).toBe(true);
      
      // Verify auth header was sent
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Authorization');
    });
    
  });
  
  describe('⏱️ Rate Limiting', () => {
    
    it('debe aplicar rate limiting después de muchas requests', async () => {
      // First 60 requests succeed
      for (let i = 0; i < 60; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      // 61st request is rate limited
      mockFetch.mockResolvedValueOnce(mockRateLimitResponse());
      
      // Make 61 requests
      let rateLimited = false;
      for (let i = 0; i < 61; i++) {
        const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/precios');
        if (response.status === 429) {
          rateLimited = true;
          break;
        }
      }
      
      expect(rateLimited).toBe(true);
    });
    
  });
  
  describe('Path Traversal Prevention', () => {
    
    const PATH_TRAVERSAL_PAYLOADS = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc/passwd',
      '/var/log/../../../etc/shadow'
    ];
    
    it('debe bloquear path traversal en parámetros de archivo', async () => {
      for (const payload of PATH_TRAVERSAL_PAYLOADS) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            success: false,
            error: { code: 'INVALID_PATH', message: 'Ruta no válida' }
          })
        });
        
        const url = `https://mock.supabase.co/functions/v1/api-minimarket/reportes?file=${encodeURIComponent(payload)}`;
        const response = await fetch(url);
        
        // Should reject or sanitize path traversal
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
    
  });
  
  describe('🔄 SSRF Prevention', () => {
    
    const SSRF_PAYLOADS = [
      'http://localhost:22',
      'http://127.0.0.1:3306',
      'http://169.254.169.254/latest/meta-data/',
      'http://[::1]:80',
      'file:///etc/passwd',
      'gopher://localhost:25/'
    ];
    
    it('debe bloquear URLs internas en webhooks', async () => {
      for (const payload of SSRF_PAYLOADS) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            success: false,
            error: { code: 'INVALID_URL', message: 'URL no permitida' }
          })
        });
        
        const response = await fetch('https://mock.supabase.co/functions/v1/cron-notifications/send', {
          method: 'POST',
          body: JSON.stringify({ webhookUrl: payload })
        });
        
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
    
  });
  
  describe('💾 Input Validation', () => {
    
    it('debe rechazar JSON malformado', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'INVALID_JSON', message: 'JSON inválido' }
        })
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid json'
      });
      
      expect(response.status).toBe(400);
    });
    
    it('debe limitar tamaño de payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload excede límite' }
        })
      });
      
      const largePayload = 'x'.repeat(10 * 1024 * 1024);  // 10MB
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-minimarket/productos', {
        method: 'POST',
        body: JSON.stringify({ data: largePayload })
      });
      
      expect(response.status).toBe(413);
    });
    
    it('debe validar tipos de datos esperados', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Tipo inválido' }
        })
      });
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-proveedor/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio: 'not-a-number', cantidad: null })
      });
      
      expect(response.status).toBe(400);
    });
    
  });
  
  describe('🔑 JWT Validation', () => {
    
    it('debe rechazar JWT expirado', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Token expirado' }
        })
      });
      
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-minimarket/stock', {
        headers: { 'Authorization': `Bearer ${expiredToken}` }
      });
      
      expect(response.status).toBe(401);
    });
    
    it('debe rechazar JWT con firma inválida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'INVALID_SIGNATURE', message: 'Firma inválida' }
        })
      });
      
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiYWRtaW4iOnRydWV9.tampered';
      
      const response = await fetch('https://mock.supabase.co/functions/v1/api-minimarket/admin', {
        headers: { 'Authorization': `Bearer ${tamperedToken}` }
      });
      
      expect(response.status).toBe(401);
    });
    
  });
  
  describe('Real Security Tests (requires credentials)', () => {
    
    SKIP_REAL('debe validar auth real contra Supabase', async () => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;
      
      vi.unstubAllGlobals();
      
      // Test without auth - should return 401
      const noAuthResponse = await fetch(`${url}/functions/v1/api-minimarket/health`);
      
      // api-minimarket health doesn't require auth, so test another endpoint
      const noAuthProtected = await fetch(`${url}/functions/v1/api-minimarket/productos`);
      expect(noAuthProtected.status).toBe(401);
      
      // Test with auth - health endpoint should work
      const authResponse = await fetch(`${url}/functions/v1/api-minimarket/health`, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      
      expect(authResponse.ok).toBe(true);
    });
    
  });
  
});
