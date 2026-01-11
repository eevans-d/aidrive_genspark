/**
 * Tests para módulo de configuración de scraper-maxiconsumo
 * Verifica flags ENABLE_PROXY y ENABLE_CAPTCHA
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

// Mock del logger para capturar warnings
const loggerWarnings: Array<{ event: string; data: unknown }> = [];
vi.mock('../../supabase/functions/_shared/logger.ts', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: (event: string, data: unknown) => {
      loggerWarnings.push({ event, data });
    },
    error: vi.fn(),
    debug: vi.fn()
  })
}));

describe('scraper-maxiconsumo/config - Optional Features', () => {
  beforeEach(() => {
    // Limpiar estado entre tests
    mockEnv.clear();
    loggerWarnings.length = 0;
    // Limpiar cache de módulos para re-evaluar env vars
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ENABLE_PROXY flag', () => {
    it('default es false cuando no está definido', async () => {
      const { ENABLE_PROXY } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(ENABLE_PROXY).toBe(false);
    });

    it('es true cuando ENABLE_PROXY=true', async () => {
      mockEnv.set('ENABLE_PROXY', 'true');
      const { ENABLE_PROXY } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(ENABLE_PROXY).toBe(true);
    });

    it('es false para cualquier otro valor', async () => {
      mockEnv.set('ENABLE_PROXY', 'yes');
      const { ENABLE_PROXY } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(ENABLE_PROXY).toBe(false);
    });
  });

  describe('ENABLE_CAPTCHA flag', () => {
    it('default es false cuando no está definido', async () => {
      const { ENABLE_CAPTCHA } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(ENABLE_CAPTCHA).toBe(false);
    });

    it('es true cuando ENABLE_CAPTCHA=true', async () => {
      mockEnv.set('ENABLE_CAPTCHA', 'true');
      const { ENABLE_CAPTCHA } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(ENABLE_CAPTCHA).toBe(true);
    });
  });

  describe('validateOptionalFeatures', () => {
    it('retorna todo desactivado si no hay env vars', async () => {
      const { validateOptionalFeatures } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const result = validateOptionalFeatures();
      
      expect(result.proxyEnabled).toBe(false);
      expect(result.proxyValid).toBe(false);
      expect(result.captchaEnabled).toBe(false);
      expect(result.captchaValid).toBe(false);
    });

    it('loggea WARN si ENABLE_PROXY=true pero falta PROXY_URL', async () => {
      mockEnv.set('ENABLE_PROXY', 'true');
      // No seteamos PROXY_URL
      
      const { validateOptionalFeatures } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const result = validateOptionalFeatures();
      
      expect(result.proxyEnabled).toBe(true);
      expect(result.proxyValid).toBe(false);
      
      // Verificar que se loggeó warning
      const proxyWarning = loggerWarnings.find(w => w.event === 'PROXY_CONFIG_MISSING');
      expect(proxyWarning).toBeDefined();
    });

    it('loggea WARN si ENABLE_CAPTCHA=true pero falta CAPTCHA_PROVIDER', async () => {
      mockEnv.set('ENABLE_CAPTCHA', 'true');
      mockEnv.set('CAPTCHA_API_KEY', 'some-key');
      // No seteamos CAPTCHA_PROVIDER
      
      const { validateOptionalFeatures } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const result = validateOptionalFeatures();
      
      expect(result.captchaEnabled).toBe(true);
      expect(result.captchaValid).toBe(false);
      
      const captchaWarning = loggerWarnings.find(w => w.event === 'CAPTCHA_CONFIG_MISSING');
      expect(captchaWarning).toBeDefined();
    });

    it('loggea WARN si ENABLE_CAPTCHA=true pero falta CAPTCHA_API_KEY', async () => {
      mockEnv.set('ENABLE_CAPTCHA', 'true');
      mockEnv.set('CAPTCHA_PROVIDER', '2captcha');
      // No seteamos CAPTCHA_API_KEY
      
      const { validateOptionalFeatures } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const result = validateOptionalFeatures();
      
      expect(result.captchaEnabled).toBe(true);
      expect(result.captchaValid).toBe(false);
      
      const captchaWarning = loggerWarnings.find(w => w.event === 'CAPTCHA_CONFIG_MISSING');
      expect(captchaWarning).toBeDefined();
    });

    it('valida correctamente cuando proxy está completo', async () => {
      mockEnv.set('ENABLE_PROXY', 'true');
      mockEnv.set('PROXY_URL', 'http://proxy.example.com:8080');
      
      const { validateOptionalFeatures } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const result = validateOptionalFeatures();
      
      expect(result.proxyEnabled).toBe(true);
      expect(result.proxyValid).toBe(true);
    });

    it('valida correctamente cuando captcha está completo', async () => {
      mockEnv.set('ENABLE_CAPTCHA', 'true');
      mockEnv.set('CAPTCHA_PROVIDER', '2captcha');
      mockEnv.set('CAPTCHA_API_KEY', 'test-api-key');
      
      const { validateOptionalFeatures } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const result = validateOptionalFeatures();
      
      expect(result.captchaEnabled).toBe(true);
      expect(result.captchaValid).toBe(true);
    });
  });

  describe('getProxyConfig', () => {
    it('retorna null si proxy no está habilitado', async () => {
      const { getProxyConfig } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getProxyConfig()).toBeNull();
    });

    it('retorna null si proxy está habilitado pero falta URL', async () => {
      mockEnv.set('ENABLE_PROXY', 'true');
      const { getProxyConfig } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getProxyConfig()).toBeNull();
    });

    it('retorna config si proxy está completo', async () => {
      mockEnv.set('ENABLE_PROXY', 'true');
      mockEnv.set('PROXY_URL', 'http://proxy.example.com:8080');
      const { getProxyConfig } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const config = getProxyConfig();
      expect(config).toEqual({ url: 'http://proxy.example.com:8080' });
    });
  });

  describe('getCaptchaConfig', () => {
    it('retorna null si captcha no está habilitado', async () => {
      const { getCaptchaConfig } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getCaptchaConfig()).toBeNull();
    });

    it('retorna null si captcha habilitado pero incompleto', async () => {
      mockEnv.set('ENABLE_CAPTCHA', 'true');
      mockEnv.set('CAPTCHA_PROVIDER', '2captcha');
      // Falta API_KEY
      const { getCaptchaConfig } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getCaptchaConfig()).toBeNull();
    });

    it('retorna config si captcha está completo', async () => {
      mockEnv.set('ENABLE_CAPTCHA', 'true');
      mockEnv.set('CAPTCHA_PROVIDER', '2captcha');
      mockEnv.set('CAPTCHA_API_KEY', 'test-key');
      const { getCaptchaConfig } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const config = getCaptchaConfig();
      expect(config).toEqual({ provider: '2captcha', apiKey: 'test-key' });
    });
  });

  describe('Flujo de scraping no se interrumpe', () => {
    it('getDefaultScraperConfig funciona sin configuración de proxy/captcha', async () => {
      const { getDefaultScraperConfig } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const config = getDefaultScraperConfig();
      
      expect(config).toBeDefined();
      expect(config.categorias).toBeDefined();
      expect(config.antiDetection).toBeDefined();
      expect(config.batchSize).toBe(50);
    });

    it('obtenerConfiguracionCategorias funciona independiente de proxy/captcha', async () => {
      const { obtenerConfiguracionCategorias } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      const categorias = obtenerConfiguracionCategorias();
      
      expect(Object.keys(categorias).length).toBeGreaterThan(0);
      expect(categorias['almacen']).toBeDefined();
    });
  });

  describe('Timeout de scraping', () => {
    it('usa default 25000 ms si no hay SCRAPER_TIMEOUT_MS', async () => {
      const { getRequestTimeoutMs } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getRequestTimeoutMs()).toBe(25000);
    });

    it('acepta valor válido y lo clampa entre 5000 y 60000', async () => {
      mockEnv.set('SCRAPER_TIMEOUT_MS', '10000');
      const { getRequestTimeoutMs } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getRequestTimeoutMs()).toBe(10000);

      mockEnv.set('SCRAPER_TIMEOUT_MS', '2000'); // debajo del mínimo
      vi.resetModules();
      const { getRequestTimeoutMs: getMin } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getMin()).toBe(5000);

      mockEnv.set('SCRAPER_TIMEOUT_MS', '120000'); // por encima del máximo
      vi.resetModules();
      const { getRequestTimeoutMs: getMax } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getMax()).toBe(60000);
    });

    it('ignora valores no numéricos y usa default', async () => {
      mockEnv.set('SCRAPER_TIMEOUT_MS', 'not-a-number');
      const { getRequestTimeoutMs } = await import(
        '../../supabase/functions/scraper-maxiconsumo/config.ts'
      );
      expect(getRequestTimeoutMs()).toBe(25000);
    });
  });
});
