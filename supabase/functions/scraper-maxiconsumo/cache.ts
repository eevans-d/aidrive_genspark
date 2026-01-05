/**
 * Módulo de gestión de caché para scraper-maxiconsumo
 * Implementa cache LRU con TTL y métricas
 * @module scraper-maxiconsumo/cache
 */

import type { CacheEntry } from './types.ts';
import { CACHE_MAX_SIZE, CACHE_DEFAULT_TTL } from './types.ts';

// ============================================================================
// ESTADO GLOBAL DE CACHÉ
// ============================================================================

const GLOBAL_CACHE = new Map<string, CacheEntry>();

// Métricas de caché
const cacheMetrics = {
  hits: 0,
  misses: 0,
  evictions: 0
};

// ============================================================================
// FUNCIONES DE CACHÉ
// ============================================================================

/**
 * Obtiene un valor del caché
 */
export function getFromCache<T>(key: string): T | null {
  const entry = GLOBAL_CACHE.get(key);
  
  if (!entry) {
    cacheMetrics.misses++;
    return null;
  }
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    GLOBAL_CACHE.delete(key);
    cacheMetrics.misses++;
    return null;
  }
  
  entry.accessCount++;
  cacheMetrics.hits++;
  return entry.data as T;
}

/**
 * Agrega un valor al caché con LRU eviction
 */
export function addToCache<T>(key: string, data: T, ttl: number = CACHE_DEFAULT_TTL): void {
  // LRU cache cleanup si es demasiado grande
  if (GLOBAL_CACHE.size >= CACHE_MAX_SIZE) {
    evictLeastUsedEntries(Math.ceil(CACHE_MAX_SIZE * 0.1)); // Eliminar 10%
  }
  
  GLOBAL_CACHE.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    accessCount: 0
  });
}

/**
 * Elimina una entrada del caché
 */
export function removeFromCache(key: string): boolean {
  return GLOBAL_CACHE.delete(key);
}

/**
 * Limpia todas las entradas expiradas
 */
export function clearExpiredEntries(): number {
  const now = Date.now();
  let cleared = 0;
  
  for (const [key, entry] of GLOBAL_CACHE.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      GLOBAL_CACHE.delete(key);
      cleared++;
    }
  }
  
  return cleared;
}

/**
 * Limpia todo el caché
 */
export function clearCache(): void {
  GLOBAL_CACHE.clear();
  cacheMetrics.evictions = 0;
  cacheMetrics.hits = 0;
  cacheMetrics.misses = 0;
}

/**
 * Evict las entradas menos utilizadas
 */
function evictLeastUsedEntries(count: number): void {
  const entries = Array.from(GLOBAL_CACHE.entries())
    .sort(([, a], [, b]) => a.accessCount - b.accessCount)
    .slice(0, count);
  
  entries.forEach(([key]) => {
    GLOBAL_CACHE.delete(key);
    cacheMetrics.evictions++;
  });
}

// ============================================================================
// MÉTRICAS DE CACHÉ
// ============================================================================

/**
 * Obtiene estadísticas del caché
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
  evictions: number;
} {
  const totalAccess = cacheMetrics.hits + cacheMetrics.misses;
  
  return {
    size: GLOBAL_CACHE.size,
    maxSize: CACHE_MAX_SIZE,
    hitRate: totalAccess > 0 ? Math.round((cacheMetrics.hits / totalAccess) * 100) : 0,
    hits: cacheMetrics.hits,
    misses: cacheMetrics.misses,
    evictions: cacheMetrics.evictions
  };
}

/**
 * Calcula hit rate del caché
 */
export function calculateCacheHitRate(): number {
  let totalAccess = 0;
  let totalEntries = 0;
  
  for (const entry of GLOBAL_CACHE.values()) {
    totalAccess += entry.accessCount;
    totalEntries++;
  }
  
  return totalEntries > 0 ? Math.round((totalAccess / totalEntries) * 100) : 0;
}

// ============================================================================
// FUNCIONES DE CACHÉ ESPECIALIZADAS
// ============================================================================

/**
 * Cache wrapper para funciones async
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const cached = getFromCache<T>(key);
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }
  
  const data = await fetchFn();
  addToCache(key, data, ttl);
  return { data, fromCache: false };
}

/**
 * Obtiene el caché global (para testing/debugging)
 */
export function getCacheMap(): Map<string, CacheEntry> {
  return GLOBAL_CACHE;
}

export { GLOBAL_CACHE };
