/**
 * Módulo de configuración de categorías para scraper-maxiconsumo
 * @module scraper-maxiconsumo/config
 */

import type { CategoriaConfig, ScraperConfig, AntiDetectionConfig } from './types.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('scraper-maxiconsumo:config');

function getEnvValue(key: string): string {
  try {
    // Prefer Deno.env pero hacer fallback a process.env en tests
    // @ts-expect-error Deno global may not exist in Node/Vitest runtime
    const denoVal = typeof Deno !== 'undefined' && Deno?.env?.get ? Deno.env.get(key) : undefined;
    if (denoVal !== undefined) return denoVal;
  } catch {
    // ignore
  }
  return (typeof process !== 'undefined' && process.env?.[key]) || '';
}

// ============================================================================
// FLAGS DE CARACTERÍSTICAS OPCIONALES (ENV)
// ============================================================================

/**
 * Flag para habilitar proxy (default: false)
 * Requiere PROXY_URL si está habilitado
 */
export const ENABLE_PROXY = getEnvValue('ENABLE_PROXY') === 'true';

/**
 * Flag para habilitar servicio de CAPTCHA (default: false)
 * Requiere CAPTCHA_PROVIDER y CAPTCHA_API_KEY si está habilitado
 */
export const ENABLE_CAPTCHA = getEnvValue('ENABLE_CAPTCHA') === 'true';

/**
 * URL del proxy (solo se usa si ENABLE_PROXY=true)
 */
export const PROXY_URL = getEnvValue('PROXY_URL') || '';

/**
 * Provider de CAPTCHA (ej: '2captcha', 'anticaptcha')
 */
export const CAPTCHA_PROVIDER = getEnvValue('CAPTCHA_PROVIDER') || '';

/**
 * API Key del provider de CAPTCHA
 */
export const CAPTCHA_API_KEY = getEnvValue('CAPTCHA_API_KEY') || '';

/**
 * Timeout en ms para requests de scraping. Se puede ajustar vía SCRAPER_TIMEOUT_MS.
 * Rango permitido: 5000 - 60000. Default: 25000.
 */
export function getRequestTimeoutMs(): number {
  const raw = Number(getEnvValue('SCRAPER_TIMEOUT_MS'));
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(Math.max(raw, 5000), 60000);
  }
  return 25000;
}

/**
 * Valida la configuración de proxy/captcha y loggea warnings si hay inconsistencias.
 * Retorna objeto con el estado de validación.
 */
export function validateOptionalFeatures(): {
  proxyEnabled: boolean;
  proxyValid: boolean;
  captchaEnabled: boolean;
  captchaValid: boolean;
} {
  let proxyValid = true;
  let captchaValid = true;

  // Validar proxy
  if (ENABLE_PROXY && !PROXY_URL) {
    logger.warn('PROXY_CONFIG_MISSING', {
      message: 'ENABLE_PROXY=true pero PROXY_URL no está configurado. Proxy desactivado.',
      feature: 'proxy'
    });
    proxyValid = false;
  }

  // Validar captcha
  if (ENABLE_CAPTCHA) {
    if (!CAPTCHA_PROVIDER) {
      logger.warn('CAPTCHA_CONFIG_MISSING', {
        message: 'ENABLE_CAPTCHA=true pero CAPTCHA_PROVIDER no está configurado. CAPTCHA desactivado.',
        feature: 'captcha'
      });
      captchaValid = false;
    }
    if (!CAPTCHA_API_KEY) {
      logger.warn('CAPTCHA_CONFIG_MISSING', {
        message: 'ENABLE_CAPTCHA=true pero CAPTCHA_API_KEY no está configurado. CAPTCHA desactivado.',
        feature: 'captcha'
      });
      captchaValid = false;
    }
  }

  return {
    proxyEnabled: ENABLE_PROXY,
    proxyValid: ENABLE_PROXY && proxyValid,
    captchaEnabled: ENABLE_CAPTCHA,
    captchaValid: ENABLE_CAPTCHA && captchaValid
  };
}

/**
 * Obtiene configuración efectiva de proxy (null si no está habilitado/válido)
 */
export function getProxyConfig(): { url: string } | null {
  const validation = validateOptionalFeatures();
  if (!validation.proxyValid) return null;
  return { url: PROXY_URL };
}

/**
 * Obtiene configuración efectiva de captcha (null si no está habilitado/válido)
 */
export function getCaptchaConfig(): { provider: string; apiKey: string } | null {
  const validation = validateOptionalFeatures();
  if (!validation.captchaValid) return null;
  return { provider: CAPTCHA_PROVIDER, apiKey: CAPTCHA_API_KEY };
}

// Re-exportar ENABLE_COOKIE_JAR desde cookie-jar para conveniencia
export { ENABLE_COOKIE_JAR, isCookieJarEnabled } from './utils/cookie-jar.ts';

export const DEFAULT_ANTI_DETECTION: AntiDetectionConfig = {
  minDelay: 1500,
  maxDelay: 6000,
  jitterFactor: 0.25,
  userAgentRotation: true,
  headerRandomization: true,
  captchaBypass: false
};

export function obtenerConfiguracionCategorias(): Record<string, CategoriaConfig> {
  return {
    'almacen': { slug: 'almacen', prioridad: 1, max_productos: 1000 },
    'bebidas': { slug: 'bebidas', prioridad: 2, max_productos: 500 },
    'limpieza': { slug: 'limpieza', prioridad: 3, max_productos: 300 },
    'frescos': { slug: 'frescos', prioridad: 4, max_productos: 200 },
    'congelados': { slug: 'congelados', prioridad: 5, max_productos: 200 },
    'perfumeria': { slug: 'perfumeria', prioridad: 6, max_productos: 150 },
    'mascotas': { slug: 'mascotas', prioridad: 7, max_productos: 100 },
    'hogar': { slug: 'hogar-y-bazar', prioridad: 8, max_productos: 150 },
    'electro': { slug: 'electro', prioridad: 9, max_productos: 100 }
  };
}

export function getDefaultScraperConfig(): ScraperConfig {
  return {
    categorias: obtenerConfiguracionCategorias(),
    antiDetection: DEFAULT_ANTI_DETECTION,
    batchSize: 50,
    maxRetries: 5,
    timeout: getRequestTimeoutMs()
  };
}

export const MAXICONSUMO_BREAKER_OPTIONS = {
  failureThreshold: 5,
  successThreshold: 2,
  openTimeoutMs: 90000
};
