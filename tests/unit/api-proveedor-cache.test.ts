/**
 * Unit tests for api-proveedor cache utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => 'https://test.supabase.co' } };
}

import {
  API_CACHE,
  IN_MEMORY_CACHE_TTL_MS,
  PERSISTENT_CACHE_TTL_SECONDS,
  getFromAPICache,
  addToAPICache,
  invalidateRelatedCaches,
} from '../../supabase/functions/api-proveedor/utils/cache.ts';

describe('api-proveedor/utils/cache', () => {
  beforeEach(() => {
    API_CACHE.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    API_CACHE.clear();
  });

  describe('TTL constants', () => {
    it('defines in-memory TTLs for key endpoints', () => {
      expect(IN_MEMORY_CACHE_TTL_MS.status).toBe(30000);
      expect(IN_MEMORY_CACHE_TTL_MS.health).toBe(15000);
      expect(IN_MEMORY_CACHE_TTL_MS.precios).toBe(60000);
      expect(IN_MEMORY_CACHE_TTL_MS.productos).toBe(120000);
      expect(IN_MEMORY_CACHE_TTL_MS.alertas).toBe(30000);
      expect(IN_MEMORY_CACHE_TTL_MS.estadisticas).toBe(600000);
    });

    it('defines persistent TTLs in seconds', () => {
      expect(PERSISTENT_CACHE_TTL_SECONDS.precios).toBe(86400);
      expect(PERSISTENT_CACHE_TTL_SECONDS.productos).toBe(86400);
      expect(PERSISTENT_CACHE_TTL_SECONDS.status).toBe(300);
      expect(PERSISTENT_CACHE_TTL_SECONDS.health).toBe(300);
      expect(PERSISTENT_CACHE_TTL_SECONDS.alertas).toBe(3600);
      expect(PERSISTENT_CACHE_TTL_SECONDS.estadisticas).toBe(3600);
    });
  });

  describe('getFromAPICache()', () => {
    it('returns null for missing key', async () => {
      const result = await getFromAPICache('nonexistent');
      expect(result).toBeNull();
    });

    it('returns cached data when entry is valid', async () => {
      API_CACHE.set('test-key', { data: { foo: 'bar' }, timestamp: Date.now(), ttl: 60000 });
      const result = await getFromAPICache('test-key');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns null and cleans up expired entries', async () => {
      API_CACHE.set('expired-key', { data: { old: true }, timestamp: Date.now() - 120000, ttl: 60000 });
      const result = await getFromAPICache('expired-key');
      expect(result).toBeNull();
      expect(API_CACHE.has('expired-key')).toBe(false);
    });

    it('falls back to persistent cache when memory entry is expired and credentials provided', async () => {
      const mockResponse = new Response(JSON.stringify([{
        endpoint: 'expired-key',
        payload: { persistent: true },
        updated_at: new Date().toISOString(),
        ttl_seconds: 3600,
      }]), { status: 200 });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      API_CACHE.set('expired-key', { data: { old: true }, timestamp: Date.now() - 120000, ttl: 60000 });

      const result = await getFromAPICache('expired-key', {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
      });
      expect(result).toEqual({ persistent: true });
    });

    it('returns memory fallback when persistent cache not available', async () => {
      // Entry still valid in memory, no supabase credentials
      API_CACHE.set('valid-key', { data: { mem: true }, timestamp: Date.now(), ttl: 60000 });
      const result = await getFromAPICache('valid-key', {});
      expect(result).toEqual({ mem: true });
    });

    it('returns null when no credentials and no valid memory entry', async () => {
      const result = await getFromAPICache('missing', {});
      expect(result).toBeNull();
    });

    it('uses forcePersistent to bypass valid memory cache', async () => {
      const mockResponse = new Response(JSON.stringify([{
        endpoint: 'force-key',
        payload: { from_db: true },
        updated_at: new Date().toISOString(),
        ttl_seconds: 3600,
      }]), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      API_CACHE.set('force-key', { data: { from_mem: true }, timestamp: Date.now(), ttl: 60000 });

      const result = await getFromAPICache('force-key', {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
        forcePersistent: true,
      });
      expect(result).toEqual({ from_db: true });
    });

    it('returns memory fallback when persistent cache returns failed response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error', { status: 500 }));

      API_CACHE.set('mem-key', { data: { fallback: true }, timestamp: Date.now(), ttl: 60000 });

      const result = await getFromAPICache('mem-key', {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
        forcePersistent: true,
      });
      // Falls back to memory data
      expect(result).toEqual({ fallback: true });
    });

    it('returns memory fallback when persistent cache throws', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      API_CACHE.set('net-key', { data: { net: true }, timestamp: Date.now(), ttl: 60000 });

      const result = await getFromAPICache('net-key', {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
        forcePersistent: true,
      });
      expect(result).toEqual({ net: true });
    });

    it('returns null when persistent entry is expired', async () => {
      const oldDate = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
      const mockResponse = new Response(JSON.stringify([{
        endpoint: 'old-persistent',
        payload: { stale: true },
        updated_at: oldDate,
        ttl_seconds: 300, // 5 min TTL, but 2h old
      }]), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      const result = await getFromAPICache('old-persistent', {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
      });
      expect(result).toBeNull();
    });
  });

  describe('addToAPICache()', () => {
    it('adds entry to in-memory cache', async () => {
      await addToAPICache('new-key', { test: true }, 60000);
      expect(API_CACHE.has('new-key')).toBe(true);
      expect(API_CACHE.get('new-key')!.data).toEqual({ test: true });
    });

    it('does not persist without options', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await addToAPICache('simple-key', { data: 1 }, 60000);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('persists to DB when options provided and no valid memory entry exists', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

      await addToAPICache('persist-key', { data: 1 }, 60000, {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
        ttlSeconds: 3600,
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('cache_proveedor');
    });

    it('skips persistence when valid memory entry already exists', async () => {
      // Pre-populate cache with valid entry
      API_CACHE.set('existing-key', { data: { old: true }, timestamp: Date.now(), ttl: 60000 });

      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await addToAPICache('existing-key', { new: true }, 60000, {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
        ttlSeconds: 3600,
      });

      // Should skip persistence because memory was valid
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('forces persistence with forcePersistent even when memory is valid', async () => {
      API_CACHE.set('force-persist', { data: { old: true }, timestamp: Date.now(), ttl: 60000 });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

      await addToAPICache('force-persist', { new: true }, 60000, {
        supabaseUrl: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
        ttlSeconds: 3600,
        forcePersistent: true,
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('evicts oldest entries when cache exceeds 500 items', async () => {
      // Fill cache with 501 entries
      for (let i = 0; i < 501; i++) {
        API_CACHE.set(`key-${i}`, { data: i, timestamp: Date.now() - (501 - i) * 1000, ttl: 999999 });
      }
      expect(API_CACHE.size).toBe(501);

      await addToAPICache('new-after-eviction', { fresh: true }, 60000);

      // Should have evicted 50 oldest entries, then added 1
      expect(API_CACHE.size).toBeLessThanOrEqual(452);
      expect(API_CACHE.has('new-after-eviction')).toBe(true);
    });

    it('handles persist failure gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('DB down'));

      // Should not throw
      await expect(
        addToAPICache('fail-persist', { data: 1 }, 60000, {
          supabaseUrl: 'https://test.supabase.co',
          serviceRoleKey: 'test-key',
          ttlSeconds: 3600,
        }),
      ).resolves.toBeUndefined();

      // In-memory cache should still have the entry
      expect(API_CACHE.has('fail-persist')).toBe(true);
    });
  });

  describe('invalidateRelatedCaches()', () => {
    it('invalidates precios caches for category', async () => {
      API_CACHE.set('precios:bebidas:page1', { data: 1, timestamp: Date.now(), ttl: 60000 });
      API_CACHE.set('precios:bebidas:page2', { data: 2, timestamp: Date.now(), ttl: 60000 });
      API_CACHE.set('precios:lacteos:page1', { data: 3, timestamp: Date.now(), ttl: 60000 });

      const count = await invalidateRelatedCaches('bebidas');
      expect(count).toBe(2);
      expect(API_CACHE.has('precios:bebidas:page1')).toBe(false);
      expect(API_CACHE.has('precios:bebidas:page2')).toBe(false);
      expect(API_CACHE.has('precios:lacteos:page1')).toBe(true);
    });

    it('invalidates productos caches for category', async () => {
      API_CACHE.set('productos:bebidas:list', { data: 1, timestamp: Date.now(), ttl: 60000 });
      API_CACHE.set('productos:otros:list', { data: 2, timestamp: Date.now(), ttl: 60000 });

      const count = await invalidateRelatedCaches('bebidas');
      expect(count).toBe(1);
    });

    it('returns 0 when no matching caches', async () => {
      API_CACHE.set('status:health', { data: 1, timestamp: Date.now(), ttl: 60000 });
      const count = await invalidateRelatedCaches('nonexistent');
      expect(count).toBe(0);
    });

    it('handles empty cache', async () => {
      const count = await invalidateRelatedCaches('any');
      expect(count).toBe(0);
    });
  });
});
