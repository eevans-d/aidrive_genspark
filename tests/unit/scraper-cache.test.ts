/**
 * Tests para cache de scraper-maxiconsumo (get/add/ttl/withCache/metrics)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getFromCache,
  addToCache,
  removeFromCache,
  clearExpiredEntries,
  clearCache,
  getCacheStats,
  calculateCacheHitRate,
  withCache,
  getCacheMap
} from '../../supabase/functions/scraper-maxiconsumo/cache.ts';

describe('scraper-maxiconsumo/cache', () => {
  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registra hits/misses y respeta TTL', () => {
    // Miss inicial
    expect(getFromCache('k')).toBeNull();
    let stats = getCacheStats();
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(0);

    // Hit
    addToCache('k', { foo: 'bar' }, 1000);
    expect(getFromCache<{ foo: string }>('k')).toEqual({ foo: 'bar' });
    stats = getCacheStats();
    expect(stats.hits).toBe(1);

    // Expira después de TTL
    vi.advanceTimersByTime(1500);
    expect(getFromCache('k')).toBeNull();
    stats = getCacheStats();
    expect(stats.misses).toBeGreaterThanOrEqual(2);
  });

  it('withCache guarda y reusa valor', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ val: 123 });
    const first = await withCache('key1', 1000, fetchFn);
    expect(first.fromCache).toBe(false);
    expect(first.data).toEqual({ val: 123 });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    const second = await withCache('key1', 1000, fetchFn);
    expect(second.fromCache).toBe(true);
    expect(second.data).toEqual({ val: 123 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('removeFromCache y clearExpiredEntries eliminan entradas', () => {
    addToCache('a', 1, 500);
    addToCache('b', 2, 2000);
    expect(removeFromCache('a')).toBe(true);
    expect(getFromCache('a')).toBeNull();

    vi.advanceTimersByTime(2500);
    const cleared = clearExpiredEntries();
    expect(cleared).toBeGreaterThanOrEqual(1);
    expect(getFromCache('b')).toBeNull();
  });

  it('calculateCacheHitRate calcula promedio de accessCount', () => {
    const map = getCacheMap();
    const now = Date.now();
    map.set('x', { data: 1, timestamp: now, ttl: 1000, accessCount: 1 });
    map.set('y', { data: 2, timestamp: now, ttl: 1000, accessCount: 0 });
    expect(calculateCacheHitRate()).toBe(50);
  });
});
