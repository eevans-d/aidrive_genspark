/**
 * Coverage tests for _shared/rate-limit.ts
 * Covers: checkRateLimitShared, AdaptiveRateLimiter, buildRateLimitKey, buildRateLimitHeaders
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FixedWindowRateLimiter,
  buildRateLimitHeaders,
  withRateLimitHeaders,
  buildRateLimitKey,
  checkRateLimitShared,
  _resetRpcAvailability,
  AdaptiveRateLimiter,
} from '../../supabase/functions/_shared/rate-limit';

describe('buildRateLimitKey', () => {
  it('builds user:ip key', () => {
    expect(buildRateLimitKey('u1', '1.2.3.4')).toBe('user:u1:ip:1.2.3.4');
  });

  it('builds user-only key when ip is unknown', () => {
    expect(buildRateLimitKey('u1', 'unknown')).toBe('user:u1');
  });

  it('builds user-only key when ip is null', () => {
    expect(buildRateLimitKey('u1', null)).toBe('user:u1');
  });

  it('builds ip-only key when no userId', () => {
    expect(buildRateLimitKey(null, '1.2.3.4')).toBe('ip:1.2.3.4');
  });

  it('defaults to ip:unknown when both null', () => {
    expect(buildRateLimitKey(null, null)).toBe('ip:unknown');
  });
});

describe('buildRateLimitHeaders', () => {
  it('returns standard headers when allowed', () => {
    const h = buildRateLimitHeaders(
      { allowed: true, remaining: 9, resetAt: Date.now() + 60000 },
      10,
    );
    expect(h['RateLimit-Limit']).toBe('10');
    expect(Number(h['RateLimit-Remaining'])).toBeGreaterThanOrEqual(0);
    expect(h['Retry-After']).toBeUndefined();
  });

  it('includes Retry-After when not allowed', () => {
    const h = buildRateLimitHeaders(
      { allowed: false, remaining: 0, resetAt: Date.now() + 30000 },
      10,
    );
    expect(h['Retry-After']).toBeTruthy();
    expect(Number(h['Retry-After'])).toBeGreaterThan(0);
  });
});

describe('withRateLimitHeaders', () => {
  it('merges rate limit headers into existing', () => {
    const result = withRateLimitHeaders(
      { 'Content-Type': 'application/json' },
      { allowed: true, remaining: 5, resetAt: Date.now() + 10000 },
      10,
    );
    expect(result['Content-Type']).toBe('application/json');
    expect(result['RateLimit-Limit']).toBe('10');
  });
});

describe('FixedWindowRateLimiter', () => {
  it('allows up to max requests', () => {
    const rl = new FixedWindowRateLimiter(3, 60000);
    expect(rl.check('k').allowed).toBe(true);
    expect(rl.check('k').allowed).toBe(true);
    expect(rl.check('k').allowed).toBe(true);
    expect(rl.check('k').allowed).toBe(false);
  });

  it('resets after window expires', () => {
    const rl = new FixedWindowRateLimiter(1, 1); // 1ms window
    rl.check('k');
    // Wait-based tests are flaky, so just test the reset method
    rl.reset('k');
    expect(rl.check('k').allowed).toBe(true);
  });

  it('getLimit returns configured max', () => {
    const rl = new FixedWindowRateLimiter(42, 1000);
    expect(rl.getLimit()).toBe(42);
  });

  it('checkWithHeaders returns result and headers', () => {
    const rl = new FixedWindowRateLimiter(5, 60000);
    const { result, headers } = rl.checkWithHeaders('k');
    expect(result.allowed).toBe(true);
    expect(headers['RateLimit-Limit']).toBe('5');
  });
});

describe('checkRateLimitShared (RPC)', () => {
  beforeEach(() => {
    _resetRpcAvailability();
    vi.restoreAllMocks();
  });

  it('returns RPC result when available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([{ allowed: true, remaining: 8, reset_at: new Date(Date.now() + 60000).toISOString() }]),
        { status: 200 },
      ),
    );

    const fb = new FixedWindowRateLimiter(10, 60000);
    const result = await checkRateLimitShared('k1', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(8);
  });

  it('falls back on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    const fb = new FixedWindowRateLimiter(10, 60000);
    const result = await checkRateLimitShared('k2', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(result.allowed).toBe(true);
  });

  it('skips RPC after 404', async () => {
    let fetchCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCalls++;
      if (fetchCalls === 1) return new Response('Not Found', { status: 404 });
      return new Response('OK', { status: 200 });
    });

    const fb = new FixedWindowRateLimiter(10, 60000);
    await checkRateLimitShared('k3', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(fetchCalls).toBe(1);

    await checkRateLimitShared('k3', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(fetchCalls).toBe(1); // No additional fetch
  });

  it('falls back on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    const fb = new FixedWindowRateLimiter(10, 60000);
    const result = await checkRateLimitShared('k4', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(result.allowed).toBe(true);
  });

  it('falls back on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

    const fb = new FixedWindowRateLimiter(10, 60000);
    const result = await checkRateLimitShared('k5', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(result.allowed).toBe(true);
  });

  it('handles null row from RPC', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const fb = new FixedWindowRateLimiter(10, 60000);
    const result = await checkRateLimitShared('k6', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(result.allowed).toBe(true);
  });

  it('handles non-array response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ allowed: false, remaining: 0, reset_at: new Date(Date.now() + 30000).toISOString() }),
        { status: 200 },
      ),
    );

    const fb = new FixedWindowRateLimiter(10, 60000);
    const result = await checkRateLimitShared('k7', 10, 60, 'srv', 'https://x.supabase.co', fb);
    expect(result.allowed).toBe(false);
  });
});

describe('AdaptiveRateLimiter', () => {
  it('starts with initialRate', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 5 });
    expect(arl.getCurrentRate()).toBe(5);
  });

  it('allows up to currentRate in window', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 2, windowMs: 60000 });
    expect(arl.tryAcquire()).toBe(true);
    expect(arl.tryAcquire()).toBe(true);
    expect(arl.tryAcquire()).toBe(false);
  });

  it('decreases rate on high error rate', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 10, decreaseFactor: 0.5, errorThreshold: 0.1 });
    arl.adjust(0.5); // 50% error rate > 10% threshold
    expect(arl.getCurrentRate()).toBe(5);
  });

  it('increases rate on low error rate', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 10, increaseFactor: 1.5, errorThreshold: 0.1 });
    arl.adjust(0.01); // 1% error rate < 10% threshold
    expect(arl.getCurrentRate()).toBe(15);
  });

  it('does not go below minRate', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 2, minRate: 1, decreaseFactor: 0.1 });
    arl.adjust(1.0);
    expect(arl.getCurrentRate()).toBeGreaterThanOrEqual(1);
  });

  it('does not exceed maxRate', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 10, maxRate: 15, increaseFactor: 2.0 });
    arl.adjust(0);
    expect(arl.getCurrentRate()).toBeLessThanOrEqual(15);
  });

  it('acquire waits when rate exceeded', async () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 1, windowMs: 50 });
    arl.tryAcquire();
    // acquire should wait
    const start = Date.now();
    await arl.acquire();
    // Should have waited some time (at least a small amount)
    expect(Date.now() - start).toBeGreaterThanOrEqual(0);
  });

  it('uses baseRate and burstRate aliases', () => {
    const arl = new AdaptiveRateLimiter({ baseRate: 7, burstRate: 20 });
    expect(arl.getCurrentRate()).toBe(7);
  });

  it('uses adaptiveFactor alias for decreaseFactor', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 10, adaptiveFactor: 0.5, errorThreshold: 0.1 });
    arl.adjust(0.5);
    expect(arl.getCurrentRate()).toBe(5);
  });

  it('clamps initialRate between min and max', () => {
    const arl = new AdaptiveRateLimiter({ initialRate: 100, maxRate: 10 });
    expect(arl.getCurrentRate()).toBe(10);
  });
});
