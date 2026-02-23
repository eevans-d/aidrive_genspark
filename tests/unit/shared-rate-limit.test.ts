/**
 * Unit Tests for _shared/rate-limit.ts
 * 
 * Tests the Rate Limiting implementations:
 * - FixedWindowRateLimiter
 * - AdaptiveRateLimiter
 * - Header building functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
        FixedWindowRateLimiter,
        AdaptiveRateLimiter,
        buildRateLimitKey,
        buildRateLimitHeaders,
        withRateLimitHeaders,
        type RateLimitResult
} from '../../supabase/functions/_shared/rate-limit';

describe('buildRateLimitKey', () => {
        it('should build user+ip key when both values are present', () => {
                expect(buildRateLimitKey('user-1', '10.0.0.1')).toBe('user:user-1:ip:10.0.0.1');
        });

        it('should build user-only key when ip is unknown', () => {
                expect(buildRateLimitKey('user-1', 'unknown')).toBe('user:user-1');
        });

        it('should build ip key when user is missing', () => {
                expect(buildRateLimitKey(null, '10.0.0.1')).toBe('ip:10.0.0.1');
                expect(buildRateLimitKey(undefined, null)).toBe('ip:unknown');
        });

        it('should avoid collisions across different user/ip tuples', () => {
                const keyA = buildRateLimitKey('user-1', '10.0.0.1');
                const keyB = buildRateLimitKey('user-1', '10.0.0.2');
                const keyC = buildRateLimitKey('user-2', '10.0.0.1');

                expect(keyA).not.toBe(keyB);
                expect(keyA).not.toBe(keyC);
                expect(keyB).not.toBe(keyC);
        });
});

describe('buildRateLimitHeaders', () => {
        it('should build headers for allowed request', () => {
                const result: RateLimitResult = {
                        allowed: true,
                        remaining: 9,
                        resetAt: Date.now() + 60000
                };

                const headers = buildRateLimitHeaders(result, 10);

                expect(headers['RateLimit-Limit']).toBe('10');
                expect(headers['RateLimit-Remaining']).toBe('9');
                expect(headers['RateLimit-Reset']).toBeDefined();
                expect(headers['Retry-After']).toBeUndefined();
        });

        it('should include Retry-After for blocked request', () => {
                const result: RateLimitResult = {
                        allowed: false,
                        remaining: 0,
                        resetAt: Date.now() + 30000
                };

                const headers = buildRateLimitHeaders(result, 10);

                expect(headers['Retry-After']).toBeDefined();
                expect(parseInt(headers['Retry-After']!)).toBeGreaterThan(0);
        });

        it('should return 0 for reset when already past', () => {
                const result: RateLimitResult = {
                        allowed: true,
                        remaining: 5,
                        resetAt: Date.now() - 1000 // In the past
                };

                const headers = buildRateLimitHeaders(result, 10);

                expect(headers['RateLimit-Reset']).toBe('0');
        });

        it('should clamp remaining to 0', () => {
                const result: RateLimitResult = {
                        allowed: false,
                        remaining: -5, // Negative
                        resetAt: Date.now() + 10000
                };

                const headers = buildRateLimitHeaders(result, 10);

                expect(headers['RateLimit-Remaining']).toBe('0');
        });
});

describe('withRateLimitHeaders', () => {
        it('should merge rate limit headers with existing headers', () => {
                const existingHeaders = {
                        'Content-Type': 'application/json',
                        'X-Custom': 'value'
                };

                const result: RateLimitResult = {
                        allowed: true,
                        remaining: 5,
                        resetAt: Date.now() + 30000
                };

                const merged = withRateLimitHeaders(existingHeaders, result, 10);

                expect(merged['Content-Type']).toBe('application/json');
                expect(merged['X-Custom']).toBe('value');
                expect(merged['RateLimit-Limit']).toBe('10');
                expect(merged['RateLimit-Remaining']).toBe('5');
        });
});

describe('FixedWindowRateLimiter', () => {
        let limiter: FixedWindowRateLimiter;

        beforeEach(() => {
                vi.useFakeTimers();
                limiter = new FixedWindowRateLimiter(5, 60000); // 5 requests per minute
        });

        afterEach(() => {
                vi.useRealTimers();
        });

        describe('Basic Limiting', () => {
                it('should allow requests within limit', () => {
                        const result1 = limiter.check('user1');
                        expect(result1.allowed).toBe(true);
                        expect(result1.remaining).toBe(4);

                        const result2 = limiter.check('user1');
                        expect(result2.allowed).toBe(true);
                        expect(result2.remaining).toBe(3);
                });

                it('should block requests after limit reached', () => {
                        // Use all 5 requests
                        for (let i = 0; i < 5; i++) {
                                limiter.check('user1');
                        }

                        const result = limiter.check('user1');
                        expect(result.allowed).toBe(false);
                        expect(result.remaining).toBe(0);
                });

                it('should track different keys separately', () => {
                        // Use all requests for user1
                        for (let i = 0; i < 5; i++) {
                                limiter.check('user1');
                        }

                        // user2 should still be allowed
                        const result = limiter.check('user2');
                        expect(result.allowed).toBe(true);
                        expect(result.remaining).toBe(4);
                });

                it('should enforce max allowance under burst requests', () => {
                        const results = Array.from({ length: 20 }, () => limiter.check('burst-user'));
                        const allowedCount = results.filter((result) => result.allowed).length;
                        const blockedCount = results.filter((result) => !result.allowed).length;

                        expect(allowedCount).toBe(5);
                        expect(blockedCount).toBe(15);
                });
        });

        describe('Window Reset', () => {
                it('should reset after window expires', () => {
                        // Use all requests
                        for (let i = 0; i < 5; i++) {
                                limiter.check('user1');
                        }
                        expect(limiter.check('user1').allowed).toBe(false);

                        // Advance past window
                        vi.advanceTimersByTime(60001);

                        // Should be allowed again
                        const result = limiter.check('user1');
                        expect(result.allowed).toBe(true);
                        expect(result.remaining).toBe(4);
                });

                it('should provide correct resetAt timestamp', () => {
                        const now = Date.now();
                        const result = limiter.check('user1');

                        expect(result.resetAt).toBeGreaterThan(now);
                        expect(result.resetAt).toBeLessThanOrEqual(now + 60000);
                });
        });

        describe('Reset Method', () => {
                it('should manually reset a key', () => {
                        // Use some requests
                        limiter.check('user1');
                        limiter.check('user1');
                        limiter.check('user1');

                        limiter.reset('user1');

                        const result = limiter.check('user1');
                        expect(result.remaining).toBe(4); // Full limit minus 1
                });
        });

        describe('Helper Methods', () => {
                it('should return limit via getLimit()', () => {
                        expect(limiter.getLimit()).toBe(5);
                });

                it('should return result and headers via checkWithHeaders()', () => {
                        const { result, headers } = limiter.checkWithHeaders('user1');

                        expect(result.allowed).toBe(true);
                        expect(headers['RateLimit-Limit']).toBe('5');
                        expect(headers['RateLimit-Remaining']).toBe('4');
                });
        });

        describe('sweepStale (MED-04)', () => {
                it('should remove expired entries', () => {
                        // Create entries for multiple keys
                        limiter.check('user1');
                        limiter.check('user2');
                        limiter.check('user3');

                        // Advance past the window so all entries expire
                        vi.advanceTimersByTime(60001);

                        const removed = limiter.sweepStale();
                        expect(removed).toBe(3);

                        // After sweep, new check should start fresh
                        const result = limiter.check('user1');
                        expect(result.remaining).toBe(4);
                });

                it('should not remove active entries', () => {
                        limiter.check('user1');
                        limiter.check('user2');

                        // Only advance 30s (window is 60s)
                        vi.advanceTimersByTime(30000);

                        const removed = limiter.sweepStale();
                        expect(removed).toBe(0);
                });

                it('should auto-sweep during check after 60s interval', () => {
                        // Create stale entries
                        limiter.check('user-old-1');
                        limiter.check('user-old-2');

                        // Advance past both the window (60s) and sweep interval (60s)
                        vi.advanceTimersByTime(61000);

                        // This check should trigger auto-sweep internally
                        const result = limiter.check('user-new');
                        expect(result.allowed).toBe(true);
                        expect(result.remaining).toBe(4);
                });
        });
});

describe('AdaptiveRateLimiter', () => {
        let limiter: AdaptiveRateLimiter;

        beforeEach(() => {
                vi.useFakeTimers();
                limiter = new AdaptiveRateLimiter({
                        initialRate: 10,
                        maxRate: 50,
                        minRate: 1,
                        errorThreshold: 0.1,
                        windowMs: 1000
                });
        });

        afterEach(() => {
                vi.useRealTimers();
        });

        describe('Acquire', () => {
                it('should allow requests within rate', () => {
                        for (let i = 0; i < 5; i++) {
                                expect(limiter.tryAcquire()).toBe(true);
                        }
                });

                it('should block requests when rate exceeded', () => {
                        // Exhaust the rate (10 requests)
                        for (let i = 0; i < 10; i++) {
                                limiter.tryAcquire();
                        }

                        expect(limiter.tryAcquire()).toBe(false);
                });

                it('should reset after window expires', () => {
                        // Exhaust rate
                        for (let i = 0; i < 10; i++) {
                                limiter.tryAcquire();
                        }
                        expect(limiter.tryAcquire()).toBe(false);

                        // Advance past window
                        vi.advanceTimersByTime(1001);

                        expect(limiter.tryAcquire()).toBe(true);
                });
        });

        describe('Adaptive Adjustment', () => {
                it('should decrease rate on high error rate', () => {
                        const initialRate = limiter.getCurrentRate();

                        limiter.adjust(0.2); // 20% error rate - above threshold

                        expect(limiter.getCurrentRate()).toBeLessThan(initialRate);
                });

                it('should increase rate on low error rate', () => {
                        const initialRate = limiter.getCurrentRate();

                        limiter.adjust(0.05); // 5% error rate - below threshold

                        expect(limiter.getCurrentRate()).toBeGreaterThan(initialRate);
                });

                it('should not exceed maxRate', () => {
                        // Keep adjusting up
                        for (let i = 0; i < 100; i++) {
                                limiter.adjust(0);
                        }

                        expect(limiter.getCurrentRate()).toBeLessThanOrEqual(50);
                });

                it('should not go below minRate', () => {
                        // Keep adjusting down
                        for (let i = 0; i < 100; i++) {
                                limiter.adjust(1); // 100% error rate
                        }

                        expect(limiter.getCurrentRate()).toBeGreaterThanOrEqual(1);
                });
        });

        describe('Default Options', () => {
                it('should use default options', () => {
                        const defaultLimiter = new AdaptiveRateLimiter();
                        expect(defaultLimiter.getCurrentRate()).toBe(10); // Default baseRate
                });

                it('should support legacy option names', () => {
                        const legacyLimiter = new AdaptiveRateLimiter({
                                baseRate: 20,
                                burstRate: 100
                        });
                        expect(legacyLimiter.getCurrentRate()).toBe(20);
                });
        });
});
