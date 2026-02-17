export type CircuitState = 'closed' | 'open' | 'half_open';

export type CircuitBreakerOptions = {
  failureThreshold: number;
  successThreshold: number;
  openTimeoutMs: number;
};

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 2,
  openTimeoutMs: 30_000,
};

export class CircuitBreaker {
  private readonly options: CircuitBreakerOptions;
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private openedAt = 0;
  private lastFailure = 0;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.openedAt >= this.options.openTimeoutMs) {
      this.state = 'half_open';
      this.successCount = 0;
      this.failureCount = 0;
    }

    return this.state;
  }

  getStats(): { state: CircuitState; failures: number; successes: number; openedAt: number; lastFailure: number } {
    return {
      state: this.getState(),
      failures: this.failureCount,
      successes: this.successCount,
      openedAt: this.openedAt,
      lastFailure: this.lastFailure,
    };
  }

  allowRequest(): boolean {
    const state = this.getState();
    return state !== 'open';
  }

  recordSuccess(): void {
    const state = this.getState();
    if (state === 'half_open') {
      this.successCount += 1;
      if (this.successCount >= this.options.successThreshold) {
        this.reset();
      }
      return;
    }

    this.failureCount = 0;
  }

  recordFailure(): void {
    const state = this.getState();
    if (state === 'open') {
      return;
    }

    this.failureCount += 1;
    this.lastFailure = Date.now();
    if (this.failureCount >= this.options.failureThreshold) {
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
}

const CIRCUIT_BREAKERS = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  key: string,
  options: Partial<CircuitBreakerOptions> = {},
): CircuitBreaker {
  const existing = CIRCUIT_BREAKERS.get(key);
  if (existing) {
    return existing;
  }

  const breaker = new CircuitBreaker(options);
  CIRCUIT_BREAKERS.set(key, breaker);
  return breaker;
}

export function getCircuitBreakersSnapshot(): Array<[string, ReturnType<CircuitBreaker['getStats']>]> {
  return Array.from(CIRCUIT_BREAKERS.entries()).map(([key, breaker]) => [key, breaker.getStats()]);
}

// ============================================================================
// SHARED CIRCUIT BREAKER (RPC-backed, for critical breakers only)
// ============================================================================

/** RPC availability: undefined=unknown, true=available, false=missing */
let cbRpcAvailable: boolean | undefined = undefined;
/** Timestamp when cbRpcAvailable was last set to false (for re-check TTL) */
let cbRpcDisabledAt = 0;
/** Re-check RPC availability every 5 minutes instead of permanent disable */
const CB_RPC_RECHECK_MS = 5 * 60 * 1000;
/** Timeout for RPC calls to prevent death spiral */
const CB_RPC_TIMEOUT_MS = 3000;

function isCbRpcDisabled(): boolean {
  if (cbRpcAvailable === false) {
    if (Date.now() - cbRpcDisabledAt >= CB_RPC_RECHECK_MS) {
      cbRpcAvailable = undefined; // allow re-check
      return false;
    }
    return true;
  }
  return false;
}

function disableCbRpc(): void {
  cbRpcAvailable = false;
  cbRpcDisabledAt = Date.now();
}

/**
 * Record a circuit breaker event using shared RPC.
 * Only persist the critical breaker (e.g. 'api-minimarket-db').
 * Falls back to in-memory breaker if RPC not available.
 */
export async function recordCircuitBreakerEvent(
  key: string,
  event: 'success' | 'failure',
  serviceRoleKey: string,
  supabaseUrl: string,
  fallbackBreaker: CircuitBreaker,
  options: Partial<CircuitBreakerOptions> = {},
): Promise<{ state: CircuitState; allows: boolean }> {
  // Record locally regardless
  if (event === 'success') {
    fallbackBreaker.recordSuccess();
  } else {
    fallbackBreaker.recordFailure();
  }

  // If we know RPC is missing (with TTL re-check), skip
  if (isCbRpcDisabled()) {
    return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
  }

  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sp_circuit_breaker_record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      signal: AbortSignal.timeout(CB_RPC_TIMEOUT_MS),
      body: JSON.stringify({
        p_key: key,
        p_event: event,
        p_failure_threshold: opts.failureThreshold,
        p_success_threshold: opts.successThreshold,
        p_open_timeout_seconds: Math.ceil(opts.openTimeoutMs / 1000),
      }),
    });

    if (response.status === 404) {
      disableCbRpc();
      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
    }

    if (!response.ok) {
      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
    }

    cbRpcAvailable = true;
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : rows;

    if (!row) {
      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
    }

    return {
      state: row.current_state as CircuitState,
      allows: row.allows_request,
    };
  } catch {
    return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
  }
}

/**
 * Check circuit breaker state using shared RPC (cross-instance).
 * Falls back to the in-memory breaker if RPC is not available.
 */
export async function checkCircuitBreakerShared(
  key: string,
  serviceRoleKey: string,
  supabaseUrl: string,
  fallbackBreaker: CircuitBreaker,
  options: Partial<CircuitBreakerOptions> = {},
): Promise<{ state: CircuitState; allows: boolean; failures: number }> {
  if (isCbRpcDisabled()) {
    const stats = fallbackBreaker.getStats();
    return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
  }

  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sp_circuit_breaker_check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      signal: AbortSignal.timeout(CB_RPC_TIMEOUT_MS),
      body: JSON.stringify({
        p_key: key,
        p_open_timeout_seconds: Math.ceil(opts.openTimeoutMs / 1000),
      }),
    });

    if (response.status === 404) {
      disableCbRpc();
      const stats = fallbackBreaker.getStats();
      return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
    }

    if (!response.ok) {
      const stats = fallbackBreaker.getStats();
      return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
    }

    cbRpcAvailable = true;
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : rows;

    if (!row) {
      const stats = fallbackBreaker.getStats();
      return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
    }

    return {
      state: row.current_state as CircuitState,
      allows: row.allows_request,
      failures: Number(row.failures) || 0,
    };
  } catch {
    const stats = fallbackBreaker.getStats();
    return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
  }
}

// Exported for testing
export function _resetCbRpcAvailability(): void {
  cbRpcAvailable = undefined;
  cbRpcDisabledAt = 0;
}
