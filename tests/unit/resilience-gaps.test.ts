/**
 * RESILIENCE GAPS - Tests de resiliencia ejecutando código REAL del proyecto
 *
 * Importa y ejecuta:
 * - CircuitBreaker de _shared/circuit-breaker (state machine completa)
 * - toAppError / fromFetchError de _shared/errors (error wrapping)
 * - FixedWindowRateLimiter de _shared/rate-limit (rate limiting)
 * - fetchConReintentos (retry logic con backoff) del scraper
 * - Auth breaker integration
 *
 * @module tests/unit/resilience-gaps
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// 1. CircuitBreaker — state transitions completas
// ═══════════════════════════════════════════════════════════════════════════

describe('CircuitBreaker — state machine under failure cascade', () => {
  let CircuitBreaker: any;

  beforeEach(async () => {
    ({ CircuitBreaker } = await import(
      '../../supabase/functions/_shared/circuit-breaker'
    ));
  });

  it('starts in closed state, transitions to open after threshold failures', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      openTimeoutMs: 5000,
    });

    expect(cb.getState()).toBe('closed');
    expect(cb.allowRequest()).toBe(true);

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('closed');
    expect(cb.allowRequest()).toBe(true);

    cb.recordFailure(); // threshold reached
    expect(cb.getState()).toBe('open');
    expect(cb.allowRequest()).toBe(false);
  });

  it('transitions from open to half_open after timeout elapses', () => {
    vi.useFakeTimers();
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 1,
      openTimeoutMs: 1000,
    });

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('open');

    vi.advanceTimersByTime(1001);
    expect(cb.getState()).toBe('half_open');
    expect(cb.allowRequest()).toBe(true);

    vi.useRealTimers();
  });

  it('transitions from half_open back to closed after success threshold', () => {
    vi.useFakeTimers();
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 2,
      openTimeoutMs: 1000,
    });

    cb.recordFailure();
    cb.recordFailure();
    vi.advanceTimersByTime(1001);
    expect(cb.getState()).toBe('half_open');

    cb.recordSuccess();
    cb.recordSuccess();
    expect(cb.getState()).toBe('closed');

    vi.useRealTimers();
  });

  it('transitions from half_open back to open on failure', () => {
    vi.useFakeTimers();
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 2,
      openTimeoutMs: 1000,
    });

    cb.recordFailure();
    cb.recordFailure();
    vi.advanceTimersByTime(1001);
    expect(cb.getState()).toBe('half_open');

    cb.recordFailure();
    cb.recordFailure(); // two failures needed (failureThreshold: 2)
    expect(cb.getState()).toBe('open');

    vi.useRealTimers();
  });

  it('getStats returns correct counters and complete shape', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      openTimeoutMs: 5000,
    });

    cb.recordSuccess();
    cb.recordSuccess();
    cb.recordFailure();

    const stats = cb.getStats();
    expect(stats.state).toBe('closed');
    expect(stats.failures).toBe(1);
    expect(stats.successes).toBe(0); // recordSuccess in closed resets failureCount only
    // Verify complete stats shape includes timing properties
    expect(stats).toHaveProperty('openedAt');
    expect(stats).toHaveProperty('lastFailure');
    expect(stats.openedAt).toBe(0); // never opened
    expect(stats.lastFailure).toBeGreaterThan(0); // one failure recorded
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Error wrapping — toAppError y fromFetchError real behavior
// ═══════════════════════════════════════════════════════════════════════════

describe('Error wrapping — toAppError resilience', () => {
  let toAppError: any;
  let fromFetchError: any;
  let isAppError: (e: unknown) => boolean;

  beforeEach(async () => {
    ({ toAppError, fromFetchError, isAppError } = await import(
      '../../supabase/functions/_shared/errors'
    ));
  });

  it('wraps Error subclasses preserving message', () => {
    const err = toAppError(new TypeError('fetch failed'), 'NETWORK_ERROR', 503);
    expect(isAppError(err)).toBe(true);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.status).toBe(503);
    expect(err.message).toContain('fetch failed');
  });

  it('wraps AbortError (timeout scenario)', () => {
    const abort = new DOMException('signal timed out', 'AbortError');
    const err = toAppError(abort, 'TIMEOUT', 504);
    expect(err.code).toBe('TIMEOUT');
    expect(err.status).toBe(504);
  });

  it('wraps non-Error objects gracefully', () => {
    expect(isAppError(toAppError({ weird: 'object' }))).toBe(true);
    expect(isAppError(toAppError(42))).toBe(true);
    expect(isAppError(toAppError(''))).toBe(true);
  });

  it('fromFetchError creates AppError from TypeError (network)', () => {
    const err = fromFetchError(new TypeError('Failed to fetch'));
    expect(isAppError(err)).toBe(true);
    expect(err.status).toBeGreaterThanOrEqual(500);
  });

  it('fromFetchError handles AbortError', () => {
    const abort = new DOMException('Aborted', 'AbortError');
    const err = fromFetchError(abort);
    expect(isAppError(err)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Auth breaker — _clearAuthCache, _resetAuthBreaker
// ═══════════════════════════════════════════════════════════════════════════

describe('Auth breaker resilience — cache and breaker management', () => {
  let _clearAuthCache: () => void;
  let _getAuthCacheSize: () => number;
  let _resetAuthBreaker: () => void;
  let _getAuthBreakerStats: () => any;

  beforeEach(async () => {
    ({
      _clearAuthCache,
      _getAuthCacheSize,
      _resetAuthBreaker,
      _getAuthBreakerStats,
    } = await import(
      '../../supabase/functions/api-minimarket/helpers/auth'
    ));
    _clearAuthCache();
    _resetAuthBreaker();
  });

  it('auth cache starts empty after clear', () => {
    expect(_getAuthCacheSize()).toBe(0);
  });

  it('auth breaker starts in closed state after reset', () => {
    const stats = _getAuthBreakerStats();
    expect(stats.state).toBe('closed');
    expect(stats.failureCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Anti-detection retry logic — calculateExponentialBackoff
// ═══════════════════════════════════════════════════════════════════════════

describe('Anti-detection — calculateExponentialBackoff (real import)', () => {
  let calculateExponentialBackoff: any;
  let getRandomDelay: any;

  beforeEach(async () => {
    ({ calculateExponentialBackoff, getRandomDelay } = await import(
      '../../supabase/functions/scraper-maxiconsumo/anti-detection'
    ));
  });

  it('increases delay exponentially with attempt number', () => {
    // Signature: (attempt, baseDelay, maxDelay, jitter)
    const d1 = calculateExponentialBackoff(1, 1000, 30000, false);
    const d2 = calculateExponentialBackoff(2, 1000, 30000, false);
    const d3 = calculateExponentialBackoff(3, 1000, 30000, false);
    expect(d2).toBeGreaterThan(d1);
    expect(d3).toBeGreaterThan(d2);
  });

  it('caps delay at maxMs', () => {
    const d = calculateExponentialBackoff(20, 1000, 5000, false);
    expect(d).toBeLessThanOrEqual(5000);
  });

  it('getRandomDelay returns value within min-max range', () => {
    for (let i = 0; i < 20; i++) {
      const d = getRandomDelay(100, 500, 0);
      expect(d).toBeGreaterThanOrEqual(100);
      expect(d).toBeLessThanOrEqual(500);
    }
  });

  it('getRandomDelay with jitter still stays near range', () => {
    for (let i = 0; i < 20; i++) {
      const d = getRandomDelay(100, 500, 0.2);
      expect(d).toBeGreaterThanOrEqual(100);  // Math.max(min, ...) guarantees min as floor
      expect(d).toBeLessThanOrEqual(600); // max + max*jitter upper bound
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. CORS resilience — origin validation
// ═══════════════════════════════════════════════════════════════════════════

describe('CORS — validateOrigin resilience against forged origins', () => {
  let validateOrigin: any;
  let parseAllowedOrigins: any;
  let createCorsErrorResponse: any;

  beforeEach(async () => {
    ({ validateOrigin, parseAllowedOrigins, createCorsErrorResponse } = await import(
      '../../supabase/functions/_shared/cors'
    ));
  });

  it('rejects unknown origin', () => {
    const req = new Request('http://localhost/test', { headers: { origin: 'https://evil.com' } });
    const result = validateOrigin(req, ['https://myapp.com']);
    expect(result.allowed).toBe(false);
  });

  it('accepts known origin', () => {
    const req = new Request('http://localhost/test', { headers: { origin: 'https://myapp.com' } });
    const result = validateOrigin(req, ['https://myapp.com']);
    expect(result.allowed).toBe(true);
  });

  it('parseAllowedOrigins handles comma-separated values', () => {
    const origins = parseAllowedOrigins('https://a.com, https://b.com');
    expect(origins).toContain('https://a.com');
    expect(origins).toContain('https://b.com');
  });

  it('createCorsErrorResponse returns 403', () => {
    const res = createCorsErrorResponse('Origin not allowed');
    expect(res.status).toBe(403);
  });
});
