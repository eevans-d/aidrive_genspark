/**
 * Tests for fetchUserInfo and related auth internals from helpers/auth.ts
 * Covers: fetchUserInfo (cache, breaker, timeout, role normalization),
 *         evictExpired, hashToken
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchUserInfo,
  _clearAuthCache,
  _resetAuthBreaker,
  _getAuthCacheSize,
  _getAuthBreakerStats,
} from '../../supabase/functions/api-minimarket/helpers/auth';

describe('fetchUserInfo (real module)', () => {
  beforeEach(() => {
    _clearAuthCache();
    _resetAuthBreaker();
    vi.restoreAllMocks();
  });

  // -- Success path --
  it('returns user with role on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'u1', email: 'a@b.com', app_metadata: { role: 'admin' } }),
        { status: 200 },
      ),
    );

    const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'tok1');
    expect(result.user).toBeTruthy();
    expect(result.user!.id).toBe('u1');
    expect(result.user!.role).toBe('admin');
    expect(result.error).toBeNull();
  });

  // -- Role normalization --
  it.each([
    ['jefe', 'admin'],
    ['administrador', 'admin'],
    ['administrator', 'admin'],
    ['depósito', 'deposito'],
    ['warehouse', 'deposito'],
    ['vendedor', 'ventas'],
    ['sales', 'ventas'],
  ])('normalizes role "%s" to "%s"', async (raw, expected) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'u1', email: 'a@b.com', app_metadata: { role: raw } }),
        { status: 200 },
      ),
    );

    const result = await fetchUserInfo('https://x.supabase.co', 'anon', `tok-${raw}`);
    expect(result.user!.role).toBe(expected);
  });

  it('returns null role when app_metadata.role is not a string', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'u1', email: 'a@b.com', app_metadata: { role: 123 } }),
        { status: 200 },
      ),
    );

    const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'tok-nrole');
    expect(result.user!.role).toBeNull();
  });

  // -- Cache hit/miss --
  it('returns cached result on second call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'u1', email: 'a@b.com', app_metadata: { role: 'admin' } }),
        { status: 200 },
      ),
    );

    await fetchUserInfo('https://x.supabase.co', 'anon', 'tok-cache');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await fetchUserInfo('https://x.supabase.co', 'anon', 'tok-cache');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(_getAuthCacheSize()).toBe(1);
  });

  // -- Negative cache (401) --
  it('caches 401 response with negative TTL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );

    const r1 = await fetchUserInfo('https://x.supabase.co', 'anon', 'bad-tok');
    expect(r1.error).toBeTruthy();
    expect(r1.error!.code).toBe('UNAUTHORIZED');

    // Second call should be served from negative cache
    await fetchUserInfo('https://x.supabase.co', 'anon', 'bad-tok');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache non-401 errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Server Error', { status: 500 }),
    );

    await fetchUserInfo('https://x.supabase.co', 'anon', 'err-tok');
    await fetchUserInfo('https://x.supabase.co', 'anon', 'err-tok');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // -- Timeout --
  it('returns AUTH_TIMEOUT on AbortError', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        }, 10);
      });
    });

    const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'slow-tok');
    expect(result.error!.code).toBe('AUTH_TIMEOUT');
    expect(result.error!.status).toBe(503);
  });

  // -- Network error --
  it('returns AUTH_ERROR on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'net-tok');
    expect(result.error!.code).toBe('AUTH_ERROR');
    expect(result.error!.status).toBe(503);
  });

  // -- Breaker: fail-fast when open --
  it('fails fast when breaker is open', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));

    // Open the breaker by triggering 3 failures
    await fetchUserInfo('https://x.supabase.co', 'anon', 'brk1');
    await fetchUserInfo('https://x.supabase.co', 'anon', 'brk2');
    await fetchUserInfo('https://x.supabase.co', 'anon', 'brk3');

    // Breaker should now be open
    const stats = _getAuthBreakerStats();
    expect(stats.state).toBe('open');

    // Next call should not invoke fetch
    const callsBefore = fetchSpy.mock.calls.length;
    const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'brk4');
    expect(result.error!.code).toBe('AUTH_BREAKER_OPEN');
    expect(result.error!.status).toBe(503);
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
  });

  // -- 401 resets breaker failure count --
  it('401 counts as breaker success (service reachable)', async () => {
    // Push breaker to 2 failures
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));
    await fetchUserInfo('https://x.supabase.co', 'anon', 'reset1');
    await fetchUserInfo('https://x.supabase.co', 'anon', 'reset2');

    // Now return 401 (service IS reachable)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );
    await fetchUserInfo('https://x.supabase.co', 'anon', 'reset3');

    const stats = _getAuthBreakerStats();
    expect(stats.state).toBe('closed');
    expect(stats.failureCount).toBe(0);
  });
});
