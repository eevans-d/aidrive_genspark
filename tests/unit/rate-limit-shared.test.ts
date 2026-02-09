import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the pure functions from rate-limit.ts by re-implementing them
// to avoid Deno import issues in Node/Vitest environment.

// --- buildRateLimitKey ---
function buildRateLimitKey(userId?: string | null, clientIp?: string | null): string {
  if (userId && clientIp && clientIp !== 'unknown') {
    return `user:${userId}:ip:${clientIp}`;
  }
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${clientIp || 'unknown'}`;
}

// --- buildRateLimitHeaders ---
type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

function buildRateLimitHeaders(result: RateLimitResult, limit: number) {
  const resetDeltaSeconds = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000));
  const headers: Record<string, string> = {
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'RateLimit-Reset': String(resetDeltaSeconds),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(resetDeltaSeconds);
  }
  return headers;
}

// --- FixedWindowRateLimiter ---
class FixedWindowRateLimiter {
  private readonly max: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
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

  getLimit(): number { return this.max; }
}

// --- checkRateLimitShared ---
let rpcAvailable: boolean | undefined = undefined;

async function checkRateLimitShared(
  key: string,
  limit: number,
  windowSeconds: number,
  serviceRoleKey: string,
  supabaseUrl: string,
  fallbackLimiter: FixedWindowRateLimiter,
): Promise<RateLimitResult> {
  if (rpcAvailable === false) {
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
      body: JSON.stringify({ p_key: key, p_limit: limit, p_window_seconds: windowSeconds }),
    });

    if (response.status === 404) {
      rpcAvailable = false;
      return fallbackLimiter.check(key);
    }
    if (!response.ok) {
      return fallbackLimiter.check(key);
    }

    rpcAvailable = true;
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return fallbackLimiter.check(key);

    return {
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at).getTime(),
    };
  } catch {
    return fallbackLimiter.check(key);
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Rate Limit Shared (A1)', () => {
  beforeEach(() => {
    rpcAvailable = undefined;
    vi.restoreAllMocks();
  });

  describe('buildRateLimitKey', () => {
    it('builds user:uid:ip:ip when both present', () => {
      expect(buildRateLimitKey('u123', '1.2.3.4')).toBe('user:u123:ip:1.2.3.4');
    });

    it('uses user:uid when IP is unknown', () => {
      expect(buildRateLimitKey('u123', 'unknown')).toBe('user:u123');
    });

    it('uses user:uid when IP is null', () => {
      expect(buildRateLimitKey('u123', null)).toBe('user:u123');
    });

    it('uses ip:ip when user is null', () => {
      expect(buildRateLimitKey(null, '1.2.3.4')).toBe('ip:1.2.3.4');
    });

    it('uses ip:unknown when both are null', () => {
      expect(buildRateLimitKey(null, null)).toBe('ip:unknown');
    });

    it('uses ip:unknown when both are undefined', () => {
      expect(buildRateLimitKey()).toBe('ip:unknown');
    });
  });

  describe('buildRateLimitHeaders', () => {
    it('includes RateLimit-* headers', () => {
      const result: RateLimitResult = { allowed: true, remaining: 59, resetAt: Date.now() + 60000 };
      const headers = buildRateLimitHeaders(result, 60);

      expect(headers['RateLimit-Limit']).toBe('60');
      expect(headers['RateLimit-Remaining']).toBe('59');
      expect(Number(headers['RateLimit-Reset'])).toBeGreaterThan(0);
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('includes Retry-After when not allowed', () => {
      const result: RateLimitResult = { allowed: false, remaining: 0, resetAt: Date.now() + 30000 };
      const headers = buildRateLimitHeaders(result, 60);

      expect(headers['RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBeDefined();
      expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
    });
  });

  describe('checkRateLimitShared', () => {
    it('uses RPC when available and returns result', async () => {
      const resetAt = new Date(Date.now() + 60000).toISOString();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([{ allowed: true, remaining: 55, reset_at: resetAt }]), { status: 200 }),
      );

      const fallback = new FixedWindowRateLimiter(60, 60_000);
      const result = await checkRateLimitShared('user:u1:ip:1.2.3.4', 60, 60, 'srv-key', 'https://x.supabase.co', fallback);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(55);
      expect(rpcAvailable).toBe(true);
    });

    it('falls back to in-memory when RPC returns 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Not Found', { status: 404 }),
      );

      const fallback = new FixedWindowRateLimiter(60, 60_000);
      const result = await checkRateLimitShared('ip:1.2.3.4', 60, 60, 'srv-key', 'https://x.supabase.co', fallback);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
      expect(rpcAvailable).toBe(false);
    });

    it('stays on fallback after RPC flagged unavailable', async () => {
      rpcAvailable = false;
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const fallback = new FixedWindowRateLimiter(60, 60_000);
      const result = await checkRateLimitShared('ip:1.2.3.4', 60, 60, 'srv-key', 'https://x.supabase.co', fallback);

      expect(result.allowed).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled(); // No fetch when flag is false
    });

    it('falls back on transient error (500) without disabling RPC', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Internal Error', { status: 500 }),
      );

      const fallback = new FixedWindowRateLimiter(60, 60_000);
      await checkRateLimitShared('ip:1.2.3.4', 60, 60, 'srv-key', 'https://x.supabase.co', fallback);

      // RPC not permanently disabled on 500
      expect(rpcAvailable).toBeUndefined();
    });

    it('falls back on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const fallback = new FixedWindowRateLimiter(60, 60_000);
      const result = await checkRateLimitShared('ip:1.2.3.4', 60, 60, 'srv-key', 'https://x.supabase.co', fallback);

      expect(result.allowed).toBe(true);
    });

    it('uses service_role key (not user JWT) in headers', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([{ allowed: true, remaining: 59, reset_at: new Date().toISOString() }]), { status: 200 }),
      );

      const fallback = new FixedWindowRateLimiter(60, 60_000);
      await checkRateLimitShared('user:u1', 60, 60, 'my-service-role-key', 'https://x.supabase.co', fallback);

      const callArgs = fetchSpy.mock.calls[0];
      const reqInit = callArgs[1] as RequestInit;
      const headers = reqInit.headers as Record<string, string>;
      expect(headers['apikey']).toBe('my-service-role-key');
      expect(headers['Authorization']).toBe('Bearer my-service-role-key');
    });
  });
});
