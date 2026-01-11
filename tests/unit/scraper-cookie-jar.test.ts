/**
 * Tests para módulo cookie-jar del scraper
 * Verifica: a) jar desactivado no guarda, b) jar activado guarda/devuelve, c) no revienta sin cookies previas
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock de Deno.env para tests
const mockEnv = new Map<string, string>();

vi.stubGlobal('Deno', {
  env: {
    get: (key: string) => mockEnv.get(key),
    set: (key: string, value: string) => mockEnv.set(key, value),
    delete: (key: string) => mockEnv.delete(key)
  }
});

// Mock del logger
vi.mock('../../supabase/functions/_shared/logger.ts', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

describe('scraper-maxiconsumo/utils/cookie-jar', () => {
  beforeEach(() => {
    mockEnv.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ENABLE_COOKIE_JAR flag', () => {
    it('default es false cuando no está definido', async () => {
      const { ENABLE_COOKIE_JAR } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(ENABLE_COOKIE_JAR).toBe(false);
    });

    it('es true cuando ENABLE_COOKIE_JAR=true', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      const { ENABLE_COOKIE_JAR } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(ENABLE_COOKIE_JAR).toBe(true);
    });

    it('es false para cualquier otro valor', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'yes');
      const { ENABLE_COOKIE_JAR } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(ENABLE_COOKIE_JAR).toBe(false);
    });
  });

  describe('isCookieJarEnabled', () => {
    it('retorna false cuando desactivado', async () => {
      const { isCookieJarEnabled } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(isCookieJarEnabled()).toBe(false);
    });

    it('retorna true cuando activado', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      const { isCookieJarEnabled } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(isCookieJarEnabled()).toBe(true);
    });
  });

  describe('extractHost', () => {
    it('extrae host de URL válida', async () => {
      const { extractHost } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(extractHost('https://example.com/path')).toBe('example.com');
      expect(extractHost('http://sub.domain.com:8080/test')).toBe('sub.domain.com');
    });

    it('retorna string vacío para URL inválida', async () => {
      const { extractHost } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(extractHost('not-a-url')).toBe('');
      expect(extractHost('')).toBe('');
    });
  });

  describe('parseSetCookieHeader', () => {
    it('parsea cookie simple', async () => {
      const { parseSetCookieHeader } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      const cookie = parseSetCookieHeader('sessionid=abc123');
      expect(cookie).not.toBeNull();
      expect(cookie?.name).toBe('sessionid');
      expect(cookie?.value).toBe('abc123');
    });

    it('parsea cookie con atributos', async () => {
      const { parseSetCookieHeader } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      const cookie = parseSetCookieHeader(
        'token=xyz; Domain=example.com; Path=/; HttpOnly; Secure; SameSite=Strict'
      );
      expect(cookie).not.toBeNull();
      expect(cookie?.name).toBe('token');
      expect(cookie?.value).toBe('xyz');
      expect(cookie?.domain).toBe('example.com');
      expect(cookie?.path).toBe('/');
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.secure).toBe(true);
      expect(cookie?.sameSite).toBe('Strict');
    });

    it('retorna null para header vacío o inválido', async () => {
      const { parseSetCookieHeader } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      expect(parseSetCookieHeader('')).toBeNull();
      expect(parseSetCookieHeader('invalid')).toBeNull();
    });
  });

  describe('Jar desactivado - no guarda cookies', () => {
    it('storeCookiesFromResponse no hace nada cuando desactivado', async () => {
      // ENABLE_COOKIE_JAR default es false
      const { 
        storeCookiesFromResponse, 
        getCookiesForRequest,
        _resetForTesting,
        _getStoreForTesting 
      } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      // Crear mock response con cookies
      const mockResponse = new Response('', {
        headers: new Headers()
      });
      // Mock getSetCookie
      Object.defineProperty(mockResponse.headers, 'getSetCookie', {
        value: () => ['session=test123; Path=/']
      });

      storeCookiesFromResponse('https://example.com/test', mockResponse);
      
      // Store debe estar vacío
      expect(_getStoreForTesting().size).toBe(0);
      expect(getCookiesForRequest('https://example.com/test')).toBe('');
    });

    it('getCookiesForRequest retorna vacío cuando desactivado', async () => {
      const { getCookiesForRequest, _resetForTesting } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      expect(getCookiesForRequest('https://example.com')).toBe('');
    });
  });

  describe('Jar activado - guarda y devuelve cookies', () => {
    it('guarda cookies de response y las devuelve para siguiente request', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { 
        storeCookiesFromResponse, 
        getCookiesForRequest,
        _resetForTesting,
        _getStoreForTesting 
      } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      // Crear mock response con cookies
      const mockResponse = new Response('', {
        headers: new Headers()
      });
      Object.defineProperty(mockResponse.headers, 'getSetCookie', {
        value: () => ['session=abc123; Path=/', 'user=john; Path=/']
      });

      storeCookiesFromResponse('https://maxiconsumo.com/test', mockResponse);
      
      // Verificar que se guardaron
      expect(_getStoreForTesting().size).toBe(1);
      expect(_getStoreForTesting().get('maxiconsumo.com')?.size).toBe(2);
      
      // Verificar que se devuelven
      const cookies = getCookiesForRequest('https://maxiconsumo.com/otra-pagina');
      expect(cookies).toContain('session=abc123');
      expect(cookies).toContain('user=john');
    });

    it('no mezcla cookies entre hosts diferentes', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { 
        storeCookiesFromResponse, 
        getCookiesForRequest,
        _resetForTesting 
      } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      // Cookies para host A
      const responseA = new Response('');
      Object.defineProperty(responseA.headers, 'getSetCookie', {
        value: () => ['token=hostA']
      });
      storeCookiesFromResponse('https://hostA.com/', responseA);
      
      // Cookies para host B
      const responseB = new Response('');
      Object.defineProperty(responseB.headers, 'getSetCookie', {
        value: () => ['token=hostB']
      });
      storeCookiesFromResponse('https://hostB.com/', responseB);
      
      // Verificar aislamiento
      expect(getCookiesForRequest('https://hostA.com/')).toBe('token=hostA');
      expect(getCookiesForRequest('https://hostB.com/')).toBe('token=hostB');
    });
  });

  describe('No revienta sin cookies previas', () => {
    it('getCookiesForRequest retorna vacío si no hay cookies guardadas', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { getCookiesForRequest, _resetForTesting } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      // No debe lanzar error, debe retornar vacío
      const cookies = getCookiesForRequest('https://nuevo-host.com/path');
      expect(cookies).toBe('');
    });

    it('getCookiesForRequest maneja URL inválida sin error', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { getCookiesForRequest, _resetForTesting } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      // No debe lanzar error
      expect(() => getCookiesForRequest('invalid-url')).not.toThrow();
      expect(getCookiesForRequest('invalid-url')).toBe('');
    });

    it('storeCookiesFromResponse maneja response sin cookies', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { 
        storeCookiesFromResponse, 
        _resetForTesting,
        _getStoreForTesting 
      } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      const responseNoCookies = new Response('');
      Object.defineProperty(responseNoCookies.headers, 'getSetCookie', {
        value: () => []
      });
      
      // No debe lanzar error
      expect(() => 
        storeCookiesFromResponse('https://example.com/', responseNoCookies)
      ).not.toThrow();
      
      expect(_getStoreForTesting().size).toBe(0);
    });
  });

  describe('getCookieJarStats', () => {
    it('retorna estadísticas correctas', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { 
        storeCookiesFromResponse,
        getCookieJarStats,
        _resetForTesting 
      } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      // Agregar cookies
      const response = new Response('');
      Object.defineProperty(response.headers, 'getSetCookie', {
        value: () => ['a=1', 'b=2']
      });
      storeCookiesFromResponse('https://test.com/', response);
      
      const stats = getCookieJarStats();
      expect(stats.enabled).toBe(true);
      expect(stats.hostsWithCookies).toBe(1);
      expect(stats.totalCookies).toBe(2);
    });
  });

  describe('clearCookiesForHost y clearAllCookies', () => {
    it('clearCookiesForHost elimina cookies de un host', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { 
        storeCookiesFromResponse,
        clearCookiesForHost,
        getCookiesForRequest,
        _resetForTesting 
      } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      const response = new Response('');
      Object.defineProperty(response.headers, 'getSetCookie', {
        value: () => ['test=value']
      });
      storeCookiesFromResponse('https://test.com/', response);
      
      expect(getCookiesForRequest('https://test.com/')).toBe('test=value');
      
      clearCookiesForHost('test.com');
      
      expect(getCookiesForRequest('https://test.com/')).toBe('');
    });

    it('clearAllCookies elimina todas las cookies', async () => {
      mockEnv.set('ENABLE_COOKIE_JAR', 'true');
      
      const { 
        storeCookiesFromResponse,
        clearAllCookies,
        getCookieJarStats,
        _resetForTesting 
      } = await import(
        '../../supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts'
      );
      
      _resetForTesting();
      
      // Agregar cookies a múltiples hosts
      const r1 = new Response('');
      Object.defineProperty(r1.headers, 'getSetCookie', { value: () => ['a=1'] });
      storeCookiesFromResponse('https://host1.com/', r1);
      
      const r2 = new Response('');
      Object.defineProperty(r2.headers, 'getSetCookie', { value: () => ['b=2'] });
      storeCookiesFromResponse('https://host2.com/', r2);
      
      expect(getCookieJarStats().hostsWithCookies).toBe(2);
      
      clearAllCookies();
      
      expect(getCookieJarStats().hostsWithCookies).toBe(0);
      expect(getCookieJarStats().totalCookies).toBe(0);
    });
  });
});
