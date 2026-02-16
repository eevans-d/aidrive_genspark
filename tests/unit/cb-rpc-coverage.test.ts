/**
 * Tests for _shared/circuit-breaker.ts RPC-backed functions
 * Covers: recordCircuitBreakerEvent, checkCircuitBreakerShared, _resetCbRpcAvailability
 * Also covers getCircuitBreaker, getCircuitBreakersSnapshot from the real module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CircuitBreaker,
  getCircuitBreaker,
  getCircuitBreakersSnapshot,
  recordCircuitBreakerEvent,
  checkCircuitBreakerShared,
  _resetCbRpcAvailability,
} from '../../supabase/functions/_shared/circuit-breaker';

describe('CircuitBreaker (real module)', () => {
  it('starts closed', () => {
    const cb = new CircuitBreaker();
    expect(cb.getState()).toBe('closed');
    expect(cb.allowRequest()).toBe(true);
  });

  it('opens after failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    expect(cb.allowRequest()).toBe(false);
  });

  it('getStats returns current state info', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    cb.recordFailure();
    const stats = cb.getStats();
    expect(stats.state).toBe('closed');
    expect(stats.failures).toBe(1);
    expect(stats.successes).toBe(0);
  });

  it('does not count additional failures when already open', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    const failuresBefore = cb.getStats().failures;
    cb.recordFailure(); // should be ignored (returns early)
    expect(cb.getStats().failures).toBe(failuresBefore);
  });

  it('resets properly', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    cb.recordFailure();
    cb.recordFailure();
    cb.reset();
    expect(cb.getState()).toBe('closed');
    expect(cb.getStats().failures).toBe(0);
  });
});

describe('getCircuitBreaker / getCircuitBreakersSnapshot', () => {
  it('returns same breaker for same key', () => {
    const b1 = getCircuitBreaker('test-key-unique');
    const b2 = getCircuitBreaker('test-key-unique');
    expect(b1).toBe(b2);
  });

  it('snapshot includes registered breakers', () => {
    getCircuitBreaker('snapshot-test');
    const snap = getCircuitBreakersSnapshot();
    const entry = snap.find(([k]) => k === 'snapshot-test');
    expect(entry).toBeTruthy();
    expect(entry![1].state).toBe('closed');
  });
});

describe('recordCircuitBreakerEvent (RPC)', () => {
  beforeEach(() => {
    _resetCbRpcAvailability();
    vi.restoreAllMocks();
  });

  it('records locally and returns RPC result on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([{ current_state: 'closed', allows_request: true }]),
        { status: 200 },
      ),
    );

    const fb = new CircuitBreaker();
    const result = await recordCircuitBreakerEvent(
      'k1', 'success', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
    expect(result.allows).toBe(true);
  });

  it('records failure locally when RPC returns 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    const fb = new CircuitBreaker({ failureThreshold: 5 });
    const result = await recordCircuitBreakerEvent(
      'k2', 'failure', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
    expect(result.allows).toBe(true);
  });

  it('skips RPC after 404 (cbRpcAvailable = false)', async () => {
    let fetchCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCalls++;
      if (fetchCalls === 1) return new Response('Not Found', { status: 404 });
      return new Response('OK', { status: 200 });
    });

    const fb = new CircuitBreaker();
    await recordCircuitBreakerEvent('k3', 'success', 'srv', 'https://x.supabase.co', fb);
    expect(fetchCalls).toBe(1);

    // Second call should NOT fetch (cbRpcAvailable is now false)
    await recordCircuitBreakerEvent('k3', 'success', 'srv', 'https://x.supabase.co', fb);
    expect(fetchCalls).toBe(1); // Still 1 — no additional fetch
  });

  it('falls back on non-ok response (not 404)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Server Error', { status: 500 }),
    );

    const fb = new CircuitBreaker();
    const result = await recordCircuitBreakerEvent(
      'k4', 'success', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
  });

  it('falls back on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

    const fb = new CircuitBreaker();
    const result = await recordCircuitBreakerEvent(
      'k5', 'failure', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
  });

  it('handles null row from RPC response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const fb = new CircuitBreaker();
    const result = await recordCircuitBreakerEvent(
      'k6', 'success', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
  });

  it('handles non-array response from RPC', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ current_state: 'open', allows_request: false }), { status: 200 }),
    );

    const fb = new CircuitBreaker();
    const result = await recordCircuitBreakerEvent(
      'k7', 'success', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('open');
    expect(result.allows).toBe(false);
  });
});

describe('checkCircuitBreakerShared (RPC)', () => {
  beforeEach(() => {
    _resetCbRpcAvailability();
    vi.restoreAllMocks();
  });

  it('returns RPC state when available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([{ current_state: 'closed', allows_request: true, failures: 0 }]),
        { status: 200 },
      ),
    );

    const fb = new CircuitBreaker();
    const result = await checkCircuitBreakerShared(
      'ck1', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
    expect(result.allows).toBe(true);
    expect(result.failures).toBe(0);
  });

  it('falls back on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    const fb = new CircuitBreaker();
    const result = await checkCircuitBreakerShared(
      'ck2', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
  });

  it('falls back on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    const fb = new CircuitBreaker();
    const result = await checkCircuitBreakerShared(
      'ck3', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
  });

  it('falls back on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

    const fb = new CircuitBreaker();
    const result = await checkCircuitBreakerShared(
      'ck4', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
  });

  it('skips RPC when cbRpcAvailable is false', async () => {
    let fetchCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCalls++;
      if (fetchCalls === 1) return new Response('Not Found', { status: 404 });
      return new Response('OK', { status: 200 });
    });

    const fb = new CircuitBreaker();
    await checkCircuitBreakerShared('ck5', 'srv', 'https://x.supabase.co', fb);
    expect(fetchCalls).toBe(1);

    await checkCircuitBreakerShared('ck5', 'srv', 'https://x.supabase.co', fb);
    expect(fetchCalls).toBe(1); // No additional fetch
  });

  it('handles null row from RPC', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const fb = new CircuitBreaker();
    const result = await checkCircuitBreakerShared(
      'ck6', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('closed');
  });

  it('handles non-array response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ current_state: 'half_open', allows_request: true, failures: 2 }), { status: 200 }),
    );

    const fb = new CircuitBreaker();
    const result = await checkCircuitBreakerShared(
      'ck7', 'srv', 'https://x.supabase.co', fb,
    );
    expect(result.state).toBe('half_open');
    expect(result.failures).toBe(2);
  });
});
