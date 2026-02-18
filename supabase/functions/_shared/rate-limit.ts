type RateLimitState = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type RateLimitHeaders = {
  'RateLimit-Limit': string;
  'RateLimit-Remaining': string;
  'RateLimit-Reset': string;
  'Retry-After'?: string;
};

/**
 * Builds standard rate limit headers from a RateLimitResult.
 * Follows IETF draft-ietf-httpapi-ratelimit-headers-07.
 */
export function buildRateLimitHeaders(
  result: RateLimitResult,
  limit: number,
): RateLimitHeaders {
  const resetDeltaSeconds = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000));

  const headers: RateLimitHeaders = {
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'RateLimit-Reset': String(resetDeltaSeconds),
  };

  if (!result.allowed) {
    headers['Retry-After'] = String(resetDeltaSeconds);
  }

  return headers;
}

/**
 * Merges rate limit headers into an existing headers object.
 */
export function withRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult,
  limit: number,
): Record<string, string> {
  return {
    ...headers,
    ...buildRateLimitHeaders(result, limit),
  };
}

/**
 * Build rate limit key from user/ip context.
 * Priority: user:{uid}:ip:{ip} > user:{uid} > ip:{ip}
 */
export function buildRateLimitKey(userId?: string | null, clientIp?: string | null): string {
  if (userId && clientIp && clientIp !== 'unknown') {
    return `user:${userId}:ip:${clientIp}`;
  }
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${clientIp || 'unknown'}`;
}

export class FixedWindowRateLimiter {
  private readonly max: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, RateLimitState>();
  private lastSweep = Date.now();
  private static readonly SWEEP_INTERVAL_MS = 60_000;

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  /**
   * Remove expired entries from the buckets map to prevent unbounded memory growth.
   * Called periodically (every 60s) from check().
   */
  sweepStale(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, state] of this.buckets) {
      if (now >= state.resetAt) {
        this.buckets.delete(key);
        removed++;
      }
    }
    this.lastSweep = now;
    return removed;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();

    // Periodic sweep to prevent unbounded Map growth (MED-04)
    if (now - this.lastSweep >= FixedWindowRateLimiter.SWEEP_INTERVAL_MS) {
      this.sweepStale();
    }

    const current = this.buckets.get(key);

    if (!current || now >= current.resetAt) {
      const resetAt = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.max - 1, resetAt };
    }

    if (current.count >= this.max) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count += 1;
    this.buckets.set(key, current);
    return { allowed: true, remaining: this.max - current.count, resetAt: current.resetAt };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  getLimit(): number {
    return this.max;
  }

  /**
   * Checks rate limit and returns headers to include in response.
   */
  checkWithHeaders(key: string): { result: RateLimitResult; headers: RateLimitHeaders } {
    const result = this.check(key);
    return {
      result,
      headers: buildRateLimitHeaders(result, this.max),
    };
  }
}

// ============================================================================
// SHARED RATE LIMITER (RPC-backed with in-memory fallback)
// ============================================================================

/** RPC availability flag: undefined=unknown, true=available, false=missing */
let rpcAvailable: boolean | undefined = undefined;
/** Timestamp when rpcAvailable was last set to false (for re-check TTL) */
let rlRpcDisabledAt = 0;
/** Re-check RPC availability every 5 minutes instead of permanent disable */
const RL_RPC_RECHECK_MS = 5 * 60 * 1000;
/** Timeout for RPC calls to prevent death spiral */
const RL_RPC_TIMEOUT_MS = 3000;

function isRlRpcDisabled(): boolean {
  if (rpcAvailable === false) {
    if (Date.now() - rlRpcDisabledAt >= RL_RPC_RECHECK_MS) {
      rpcAvailable = undefined; // allow re-check
      return false;
    }
    return true;
  }
  return false;
}

function disableRlRpc(): void {
  rpcAvailable = false;
  rlRpcDisabledAt = Date.now();
}

/**
 * Check rate limit using shared RPC (cross-instance).
 * Falls back to in-memory if RPC is not available (404).
 *
 * @param key - Rate limit key (e.g. "user:uid:ip:1.2.3.4")
 * @param limit - Max requests per window
 * @param windowSeconds - Window size in seconds
 * @param serviceRoleKey - Supabase service role key (NOT user JWT)
 * @param supabaseUrl - Supabase project URL
 * @param fallbackLimiter - In-memory limiter for fallback
 */
export async function checkRateLimitShared(
  key: string,
  limit: number,
  windowSeconds: number,
  serviceRoleKey: string,
  supabaseUrl: string,
  fallbackLimiter: FixedWindowRateLimiter,
): Promise<RateLimitResult> {
  // If we already know RPC is missing (with TTL re-check), use fallback directly
  if (isRlRpcDisabled()) {
    return fallbackLimiter.check(key);
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sp_check_rate_limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      signal: AbortSignal.timeout(RL_RPC_TIMEOUT_MS),
      body: JSON.stringify({
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      }),
    });

    if (response.status === 404) {
      // RPC does not exist yet → fallback (with re-check TTL)
      disableRlRpc();
      return fallbackLimiter.check(key);
    }

    if (!response.ok) {
      // Transient error → fallback this time but don't disable RPC
      return fallbackLimiter.check(key);
    }

    rpcAvailable = true;
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : rows;

    if (!row) {
      return fallbackLimiter.check(key);
    }

    return {
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at).getTime(),
    };
  } catch {
    // Network error → fallback
    return fallbackLimiter.check(key);
  }
}

// Exported for testing
export function _resetRpcAvailability(): void {
  rpcAvailable = undefined;
  rlRpcDisabledAt = 0;
}

type AdaptiveRateLimiterOptions = {
  initialRate?: number;
  maxRate?: number;
  minRate?: number;
  errorThreshold?: number;
  windowMs?: number;
  baseRate?: number;
  burstRate?: number;
  adaptiveFactor?: number;
  decreaseFactor?: number;
  increaseFactor?: number;
};

export class AdaptiveRateLimiter {
  private requests: number[] = [];
  private currentRate: number;
  private readonly maxRate: number;
  private readonly minRate: number;
  private readonly errorThreshold: number;
  private readonly windowMs: number;
  private readonly decreaseFactor: number;
  private readonly increaseFactor: number;

  constructor(options: AdaptiveRateLimiterOptions = {}) {
    const initialRate = options.initialRate ?? options.baseRate ?? 10;
    const maxRate = options.maxRate ?? options.burstRate ?? 50;
    const minRate = options.minRate ?? 1;

    this.maxRate = maxRate;
    this.minRate = minRate;
    this.currentRate = Math.min(maxRate, Math.max(minRate, initialRate));
    this.errorThreshold = options.errorThreshold ?? 0.1;
    this.windowMs = options.windowMs ?? 60000;
    this.decreaseFactor = options.decreaseFactor ?? options.adaptiveFactor ?? 0.8;
    this.increaseFactor = options.increaseFactor ?? 1.1;
  }

  tryAcquire(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    if (this.requests.length >= this.currentRate) {
      return false;
    }
    this.requests.push(now);
    return true;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.currentRate) {
      const oldest = this.requests[0];
      const waitTime = Math.max(this.windowMs - (now - oldest), 0);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(Date.now());
  }

  adjust(errorRate: number): void {
    if (errorRate > this.errorThreshold) {
      this.currentRate = Math.max(this.minRate, Math.floor(this.currentRate * this.decreaseFactor));
      return;
    }
    this.currentRate = Math.min(this.maxRate, Math.ceil(this.currentRate * this.increaseFactor));
  }

  getCurrentRate(): number {
    return this.currentRate;
  }
}
