import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- CircuitBreaker (inline for test isolation) ---
type CircuitState = 'closed' | 'open' | 'half_open';

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private openedAt = 0;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly openTimeoutMs: number;

  constructor(opts: { failureThreshold?: number; successThreshold?: number; openTimeoutMs?: number } = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.successThreshold = opts.successThreshold ?? 2;
    this.openTimeoutMs = opts.openTimeoutMs ?? 30_000;
  }

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.openedAt >= this.openTimeoutMs) {
      this.state = 'half_open';
      this.successCount = 0;
      this.failureCount = 0;
    }
    return this.state;
  }

  allowRequest(): boolean { return this.getState() !== 'open'; }

  recordSuccess(): void {
    const state = this.getState();
    if (state === 'half_open') {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) this.reset();
      return;
    }
    this.failureCount = 0;
  }

  recordFailure(): void {
    if (this.getState() === 'open') return;
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = 0;
  }

  // Expose for tests
  _setOpenedAt(t: number) { this.openedAt = t; }
}

// --- recordCircuitBreakerEvent (inline) ---
let cbRpcAvailable: boolean | undefined = undefined;

async function recordCircuitBreakerEvent(
  key: string,
  event: 'success' | 'failure',
  serviceRoleKey: string,
  supabaseUrl: string,
  fallbackBreaker: CircuitBreaker,
): Promise<{ state: CircuitState; allows: boolean }> {
  if (event === 'success') fallbackBreaker.recordSuccess();
  else fallbackBreaker.recordFailure();

  if (cbRpcAvailable === false) {
    return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sp_circuit_breaker_record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ p_key: key, p_event: event }),
    });

    if (response.status === 404) {
      cbRpcAvailable = false;
      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
    }
    if (!response.ok) {
      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
    }

    cbRpcAvailable = true;
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
    return { state: row.current_state as CircuitState, allows: row.allows_request };
  } catch {
    return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Circuit Breaker Semi-Persistent (A2)', () => {
  beforeEach(() => {
    cbRpcAvailable = undefined;
    vi.restoreAllMocks();
  });

  describe('In-memory transitions', () => {
    it('closed -> open after threshold failures', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });
      expect(cb.getState()).toBe('closed');
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe('closed');
      cb.recordFailure();
      expect(cb.getState()).toBe('open');
      expect(cb.allowRequest()).toBe(false);
    });

    it('open -> half_open after timeout', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2, openTimeoutMs: 100 });
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe('open');
      cb._setOpenedAt(Date.now() - 200);
      expect(cb.getState()).toBe('half_open');
      expect(cb.allowRequest()).toBe(true);
    });

    it('half_open -> closed after success threshold', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2, successThreshold: 2, openTimeoutMs: 100 });
      cb.recordFailure();
      cb.recordFailure();
      cb._setOpenedAt(Date.now() - 200);
      expect(cb.getState()).toBe('half_open');
      cb.recordSuccess();
      expect(cb.getState()).toBe('half_open');
      cb.recordSuccess();
      expect(cb.getState()).toBe('closed');
    });

    it('success in closed resets failure count', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess(); // resets failure count
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe('closed'); // still closed
    });
  });

  describe('RPC-backed shared recording', () => {
    it('records via RPC when available', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([{ current_state: 'closed', allows_request: true, failures: 0, successes: 0 }]), { status: 200 }),
      );

      const cb = new CircuitBreaker();
      const result = await recordCircuitBreakerEvent('api-minimarket-db', 'success', 'srv', 'https://x.supabase.co', cb);
      expect(result.state).toBe('closed');
      expect(result.allows).toBe(true);
      expect(cbRpcAvailable).toBe(true);
    });

    it('falls back to in-memory when RPC 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Not Found', { status: 404 }),
      );

      const cb = new CircuitBreaker();
      const result = await recordCircuitBreakerEvent('api-minimarket-db', 'success', 'srv', 'https://x.supabase.co', cb);
      expect(result.state).toBe('closed');
      expect(cbRpcAvailable).toBe(false);
    });

    it('skips RPC fetch when already flagged unavailable', async () => {
      cbRpcAvailable = false;
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const cb = new CircuitBreaker();
      await recordCircuitBreakerEvent('api-minimarket-db', 'failure', 'srv', 'https://x.supabase.co', cb);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('uses service_role key in headers', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([{ current_state: 'closed', allows_request: true }]), { status: 200 }),
      );

      const cb = new CircuitBreaker();
      await recordCircuitBreakerEvent('api-minimarket-db', 'success', 'my-srv-key', 'https://x.supabase.co', cb);

      const headers = (fetchSpy.mock.calls[0][1] as any).headers;
      expect(headers.apikey).toBe('my-srv-key');
      expect(headers.Authorization).toBe('Bearer my-srv-key');
    });

    it('falls back on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

      const cb = new CircuitBreaker();
      cb.recordFailure(); // via the function
      const result = await recordCircuitBreakerEvent('api-minimarket-db', 'failure', 'srv', 'https://x.supabase.co', cb);
      expect(result.state).toBe('closed'); // not enough failures yet (only 2)
    });
  });
});
