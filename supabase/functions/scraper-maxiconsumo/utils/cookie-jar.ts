/**
 * Cookie Jar - Gestión de cookies en memoria para scraper
 * @module scraper-maxiconsumo/utils/cookie-jar
 * 
 * Implementación simple en memoria (Map por host).
 * Desactivado por defecto (ENABLE_COOKIE_JAR=false).
 * NUNCA exponer cookies en logs ni respuestas.
 */

import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('scraper-maxiconsumo:cookie-jar');

// ============================================================================
// TIPOS
// ============================================================================

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface CookieJarConfig {
  enabled: boolean;
  maxCookiesPerHost: number;
  defaultTtlMs: number;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/**
 * Flag para habilitar cookie jar (default: false)
 */
export const ENABLE_COOKIE_JAR = Deno.env.get('ENABLE_COOKIE_JAR') === 'true';

/**
 * Configuración por defecto del cookie jar
 */
export const DEFAULT_COOKIE_JAR_CONFIG: CookieJarConfig = {
  enabled: ENABLE_COOKIE_JAR,
  maxCookiesPerHost: 50,
  defaultTtlMs: 3600000 // 1 hora
};

// ============================================================================
// ALMACENAMIENTO EN MEMORIA
// ============================================================================

/** Map de cookies por host */
const cookieStore = new Map<string, Map<string, Cookie>>();

/** Timestamps de última actualización por host */
const lastUpdated = new Map<string, number>();

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Verifica si el cookie jar está efectivamente habilitado
 */
export function isCookieJarEnabled(): boolean {
  return ENABLE_COOKIE_JAR;
}

/**
 * Extrae el host de una URL
 */
export function extractHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

/**
 * Parsea un header Set-Cookie a objeto Cookie
 * No loggea el valor de la cookie por seguridad
 */
export function parseSetCookieHeader(setCookieHeader: string): Cookie | null {
  if (!setCookieHeader) return null;

  try {
    const parts = setCookieHeader.split(';').map(p => p.trim());
    const [nameValue, ...attributes] = parts;
    
    if (!nameValue || !nameValue.includes('=')) return null;
    
    const eqIndex = nameValue.indexOf('=');
    const name = nameValue.substring(0, eqIndex).trim();
    const value = nameValue.substring(eqIndex + 1).trim();

    if (!name) return null;

    const cookie: Cookie = { name, value };

    for (const attr of attributes) {
      const lowerAttr = attr.toLowerCase();
      if (lowerAttr.startsWith('domain=')) {
        cookie.domain = attr.substring(7).trim();
      } else if (lowerAttr.startsWith('path=')) {
        cookie.path = attr.substring(5).trim();
      } else if (lowerAttr.startsWith('expires=')) {
        const dateStr = attr.substring(8).trim();
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          cookie.expires = date;
        }
      } else if (lowerAttr === 'httponly') {
        cookie.httpOnly = true;
      } else if (lowerAttr === 'secure') {
        cookie.secure = true;
      } else if (lowerAttr.startsWith('samesite=')) {
        const ssValue = attr.substring(9).trim();
        if (['Strict', 'Lax', 'None'].includes(ssValue)) {
          cookie.sameSite = ssValue as Cookie['sameSite'];
        }
      }
    }

    return cookie;
  } catch {
    return null;
  }
}

/**
 * Guarda cookies desde headers de respuesta
 * Solo opera si ENABLE_COOKIE_JAR=true
 * NO loggea valores de cookies
 */
export function storeCookiesFromResponse(url: string, response: Response): void {
  if (!ENABLE_COOKIE_JAR) return;

  const host = extractHost(url);
  if (!host) return;

  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  
  if (setCookieHeaders.length === 0) return;

  if (!cookieStore.has(host)) {
    cookieStore.set(host, new Map());
  }

  const hostCookies = cookieStore.get(host)!;
  let storedCount = 0;

  for (const header of setCookieHeaders) {
    const cookie = parseSetCookieHeader(header);
    if (cookie) {
      // Verificar límite de cookies por host
      if (hostCookies.size >= DEFAULT_COOKIE_JAR_CONFIG.maxCookiesPerHost) {
        // Eliminar la cookie más antigua (primera en el Map)
        const firstKey = hostCookies.keys().next().value;
        if (firstKey) hostCookies.delete(firstKey);
      }
      
      hostCookies.set(cookie.name, cookie);
      storedCount++;
    }
  }

  lastUpdated.set(host, Date.now());

  // Log sin exponer valores de cookies
  logger.info('COOKIES_STORED', {
    host,
    count: storedCount,
    totalForHost: hostCookies.size
  });
}

/**
 * Obtiene cookies almacenadas para un host como header string
 * Solo opera si ENABLE_COOKIE_JAR=true
 * Retorna string vacío si está desactivado o no hay cookies
 */
export function getCookiesForRequest(url: string): string {
  if (!ENABLE_COOKIE_JAR) return '';

  const host = extractHost(url);
  if (!host) return '';

  const hostCookies = cookieStore.get(host);
  if (!hostCookies || hostCookies.size === 0) return '';

  const now = Date.now();
  const validCookies: string[] = [];

  for (const [name, cookie] of hostCookies) {
    // Verificar expiración
    if (cookie.expires && cookie.expires.getTime() < now) {
      hostCookies.delete(name);
      continue;
    }
    validCookies.push(`${cookie.name}=${cookie.value}`);
  }

  return validCookies.join('; ');
}

/**
 * Limpia todas las cookies de un host específico
 */
export function clearCookiesForHost(host: string): void {
  cookieStore.delete(host);
  lastUpdated.delete(host);
  
  logger.info('COOKIES_CLEARED', { host });
}

/**
 * Limpia todas las cookies almacenadas
 */
export function clearAllCookies(): void {
  const hostCount = cookieStore.size;
  cookieStore.clear();
  lastUpdated.clear();
  
  logger.info('ALL_COOKIES_CLEARED', { hostsCleared: hostCount });
}

/**
 * Obtiene estadísticas del cookie jar (sin exponer valores)
 */
export function getCookieJarStats(): {
  enabled: boolean;
  hostsWithCookies: number;
  totalCookies: number;
} {
  let totalCookies = 0;
  for (const hostMap of cookieStore.values()) {
    totalCookies += hostMap.size;
  }

  return {
    enabled: ENABLE_COOKIE_JAR,
    hostsWithCookies: cookieStore.size,
    totalCookies
  };
}

// ============================================================================
// TESTING HELPERS (solo para tests)
// ============================================================================

/**
 * Reset interno del store (solo para tests)
 */
export function _resetForTesting(): void {
  cookieStore.clear();
  lastUpdated.clear();
}

/**
 * Acceso interno al store (solo para tests)
 */
export function _getStoreForTesting(): Map<string, Map<string, Cookie>> {
  return cookieStore;
}
