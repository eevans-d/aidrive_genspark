/**
 * Módulo de anti-detección para scraper-maxiconsumo
 * Implementa técnicas para evitar bloqueos de scraping
 * @module scraper-maxiconsumo/anti-detection
 */

import type { AntiDetectionConfig, StructuredLog } from './types.ts';
import { createLogger } from '../_shared/logger.ts';
import { 
  ENABLE_PROXY, 
  ENABLE_CAPTCHA, 
  getProxyConfig, 
  getCaptchaConfig,
  validateOptionalFeatures 
} from './config.ts';
import {
  isCookieJarEnabled,
  getCookiesForRequest,
  storeCookiesFromResponse,
  getCookieJarStats
} from './utils/cookie-jar.ts';

const logger = createLogger('scraper-maxiconsumo:anti-detection');

// ============================================================================
// CONFIGURACIÓN POR DEFECTO
// ============================================================================

export const DEFAULT_ANTI_DETECTION_CONFIG: AntiDetectionConfig = {
  minDelay: 1500,
  maxDelay: 6000,
  jitterFactor: 0.25,
  userAgentRotation: true,
  headerRandomization: true,
  captchaBypass: false
};

// ============================================================================
// PROXY Y CAPTCHA HELPERS
// ============================================================================

/**
 * Verifica si el proxy está efectivamente habilitado y configurado
 */
export function isProxyEffectivelyEnabled(): boolean {
  const validation = validateOptionalFeatures();
  return validation.proxyValid;
}

/**
 * Verifica si el servicio de CAPTCHA está efectivamente habilitado y configurado
 */
export function isCaptchaServiceEnabled(): boolean {
  const validation = validateOptionalFeatures();
  return validation.captchaValid;
}

/**
 * Obtiene la URL del proxy si está habilitado, o null si no
 */
export function getEffectiveProxyUrl(): string | null {
  const config = getProxyConfig();
  return config?.url || null;
}

/**
 * Obtiene configuración del servicio de CAPTCHA si está habilitado
 */
export function getEffectiveCaptchaService(): { provider: string; apiKey: string } | null {
  return getCaptchaConfig();
}

// ============================================================================
// USER AGENTS (actualizado 2025)
// ============================================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
];

const LANGUAGES = [
  'es-AR,es;q=0.9,en;q=0.8',
  'es-ES,es;q=0.9,en;q=0.8',
  'es;q=0.9,en;q=0.8'
];

const TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'UTC',
  'America/Mexico_City'
];

// ============================================================================
// GENERADORES DE HEADERS
// ============================================================================

/**
 * Genera headers aleatorios para requests
 */
export function generarHeadersAleatorios(): Record<string, string> {
  return {
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)].split(',')[0],
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  };
}

/**
 * Genera headers avanzados con más parámetros anti-detección
 */
export function generateAdvancedHeaders(): Record<string, string> {
  const acceptLanguages = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
  const timezone = TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)];
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // Simular comportamiento de horario comercial
  const isBusinessHours = hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5;
  
  return {
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': acceptLanguages,
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': isBusinessHours ? 'max-age=0' : 'max-age=3600',
    'DNT': '1',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'X-Timezone': timezone,
    'X-Client-Time': now.toISOString()
  };
}

// ============================================================================
// DELAYS Y TIMING
// ============================================================================

/**
 * Delay base con promise
 */
export function delay(ms: number): Promise<void> {
  const jitter = Math.random() * 0.3 * ms;
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Genera un delay aleatorio con jitter
 */
export function getRandomDelay(min: number, max: number, jitter: number = 0.2): number {
  const baseDelay = Math.random() * (max - min) + min;
  const jitterAmount = baseDelay * jitter * (Math.random() - 0.5) * 2;
  return Math.max(min, baseDelay + jitterAmount);
}

/**
 * Calcula delay exponencial para backoff
 */
export function calculateExponentialBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitter: boolean = true
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  if (jitter) {
    const jitterAmount = exponentialDelay * 0.2 * (Math.random() - 0.5) * 2;
    return Math.max(baseDelay, exponentialDelay + jitterAmount);
  }
  
  return exponentialDelay;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Genera un ID de sesión único
 */
export function generateSessionId(): string {
  // Include timestamp + UUID fragment to guarantee stable minimum length.
  return `${Date.now().toString(36)}${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/**
 * Genera un request ID único
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

// ============================================================================
// FETCH CON ANTI-DETECCIÓN
// ============================================================================

/**
 * Fetch con reintentos y anti-detección
 */
export async function fetchConReintentos(
  url: string,
  headers: Record<string, string>,
  maxReintentos: number,
  timeout: number = 25000
): Promise<Response> {
  let ultimoError: Error = new Error('Unknown error');

  for (let i = 0; i < maxReintentos; i++) {
    try {
      const response = await fetch(url, { 
        headers,
        signal: AbortSignal.timeout(timeout)
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        // Rate limited, esperar más tiempo
        await delay((i + 1) * 2000);
        continue;
      }

      if (response.status >= 500) {
        // Error del servidor, reintentar
        await delay((i + 1) * 1000);
        continue;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      ultimoError = error as Error;
      logger.warn(`Reintento ${i + 1}/${maxReintentos} falló:`, { error: (error as Error).message });
      
      if (i < maxReintentos - 1) {
        await delay((i + 1) * 2000);
      }
    }
  }

  throw ultimoError;
}

/**
 * Fetch avanzado con anti-deteccion completa y manejo de rate limiting
 * Incluye soporte opcional para cookie jar (ENABLE_COOKIE_JAR)
 */
export async function fetchWithAdvancedAntiDetection(
  url: string,
  headers: Record<string, string>,
  structuredLog: StructuredLog,
  timeout: number = 25000,
  maxRetries: number = 3
): Promise<Response> {
  const requestId = structuredLog.requestId || crypto.randomUUID();
  let lastError: Error | null = null;

  // Obtener cookies si el jar está habilitado
  const cookieHeader = getCookiesForRequest(url);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const requestStartTime = Date.now();

      // Construir headers con cookies si están disponibles
      const requestHeaders: Record<string, string> = {
        ...headers,
        'X-Request-ID': requestId,
        'X-Client-Version': '2.0.0',
        'X-Session-ID': generateSessionId()
      };

      // Agregar cookies si hay (sin loggear valores)
      if (cookieHeader) {
        requestHeaders['Cookie'] = cookieHeader;
      }

      const response = await fetch(url, {
        headers: requestHeaders,
        signal: AbortSignal.timeout(timeout)
      });

      const responseTime = Date.now() - requestStartTime;

      // Guardar cookies de la respuesta si el jar está habilitado
      if (isCookieJarEnabled()) {
        storeCookiesFromResponse(url, response);
      }

      if (response.status === 429 || response.status === 503) {
        const backoffMs = calculateExponentialBackoff(attempt, 2000, 30000);
        logger.warn('RATE_LIMITED', {
          requestId,
          status: response.status,
          attempt,
          backoffMs
        });
        await delay(backoffMs);
        continue;
      }

      logger.info('ADVANCED_FETCH_COMPLETE', {
        ...structuredLog,
        responseTime,
        status: response.status,
        requestId,
        attempt,
        cookieJarActive: isCookieJarEnabled()
      });

      return response;

    } catch (error) {
      lastError = error as Error;
      const isTimeout = lastError.name === 'TimeoutError' || lastError.message.includes('timeout');
      logger.warn('FETCH_ATTEMPT_FAILED', {
        requestId,
        attempt,
        isTimeout,
        errorName: lastError.name
      });

      if (attempt < maxRetries - 1) {
        const backoffMs = calculateExponentialBackoff(attempt, 1000, 15000);
        await delay(backoffMs);
      }
    }
  }

  logger.error('ADVANCED_FETCH_ERROR', {
    ...structuredLog,
    requestId,
    error: lastError?.message || 'Unknown error'
  });
  throw lastError || new Error('Fetch failed after retries');
}

// ============================================================================
// CAPTCHA HANDLING
// ============================================================================

/**
 * Maneja bypass de CAPTCHA usando servicio externo si está configurado
 * Si CAPTCHA service no está habilitado, simula bypass con delay
 */
export async function handleCaptchaBypass(
  url: string,
  headers: Record<string, string>,
  structuredLog: StructuredLog
): Promise<void> {
  const captchaService = getEffectiveCaptchaService();
  
  if (captchaService) {
    logger.info('CAPTCHA_SERVICE_ATTEMPT', { 
      ...structuredLog, 
      provider: captchaService.provider 
    });
    
    // Placeholder: simular resolución sin enviar datos reales
    await delay(getRandomDelay(3000, 8000));
    
    logger.info('CAPTCHA_SERVICE_SUCCESS', { 
      ...structuredLog, 
      provider: captchaService.provider 
    });
  } else {
    // Fallback: simular delay sin servicio externo
    logger.info('CAPTCHA_BYPASS_ATTEMPT', { 
      ...structuredLog,
      note: 'Sin servicio de CAPTCHA configurado, usando delay simulado'
    });
    
    await delay(getRandomDelay(3000, 8000));
    
    logger.info('CAPTCHA_BYPASS_COMPLETE', structuredLog);
  }
}

/**
 * Detecta si una respuesta contiene CAPTCHA
 */
export function detectCaptcha(response: Response, html?: string): boolean {
  // Chequear headers
  if (response.status === 429 || response.headers.get('x-captcha-detected')) {
    return true;
  }
  
  // Chequear contenido HTML si está disponible
  if (html) {
    const captchaIndicators = [
      'captcha',
      'recaptcha',
      'hcaptcha',
      'cf-turnstile',
      'challenge-form'
    ];
    
    const lowerHtml = html.toLowerCase();
    return captchaIndicators.some(indicator => lowerHtml.includes(indicator));
  }
  
  return false;
}
