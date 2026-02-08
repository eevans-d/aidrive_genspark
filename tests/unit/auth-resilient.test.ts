import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno global for non-Deno environments
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

// --- Inline helpers that mirror auth.ts logic for unit testing ---
// We test the pure logic without importing the Deno module directly.

// ============================================================================
// AUTH CACHE
// ============================================================================
const AUTH_CACHE_TTL_MS = 30_000;
const AUTH_NEGATIVE_CACHE_TTL_MS = 10_000;
const AUTH_TIMEOUT_MS = 5_000;

type UserInfo = {
  id: string;
  email?: string;
  role: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type AuthResult = {
  user: UserInfo | null;
  token: string | null;
  error: { code: string; status: number; message: string } | null;
};

type AuthCacheEntry = {
  result: AuthResult;
  expiresAt: number;
};

const authCache = new Map<string, AuthCacheEntry>();

function clearAuthCache() { authCache.clear(); }
function getAuthCacheSize() { return authCache.size; }

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// AUTH BREAKER
// ============================================================================
const AUTH_BREAKER_FAILURE_THRESHOLD = 3;
const AUTH_BREAKER_OPEN_TIMEOUT_MS = 15_000;
const AUTH_BREAKER_SUCCESS_THRESHOLD = 1;

type AuthBreakerState = 'closed' | 'open' | 'half_open';

const authBreaker = {
  state: 'closed' as AuthBreakerState,
  failureCount: 0,
  successCount: 0,
  openedAt: 0,
};

function resetAuthBreaker() {
  authBreaker.state = 'closed';
  authBreaker.failureCount = 0;
  authBreaker.successCount = 0;
  authBreaker.openedAt = 0;
}

function getAuthBreakerState(): AuthBreakerState {
  if (
    authBreaker.state === 'open' &&
    Date.now() - authBreaker.openedAt >= AUTH_BREAKER_OPEN_TIMEOUT_MS
  ) {
    authBreaker.state = 'half_open';
    authBreaker.successCount = 0;
    authBreaker.failureCount = 0;
  }
  return authBreaker.state;
}

function authBreakerAllows(): boolean {
  return getAuthBreakerState() !== 'open';
}

function authBreakerRecordSuccess(): void {
  const state = getAuthBreakerState();
  if (state === 'half_open') {
    authBreaker.successCount += 1;
    if (authBreaker.successCount >= AUTH_BREAKER_SUCCESS_THRESHOLD) {
      authBreaker.state = 'closed';
      authBreaker.failureCount = 0;
      authBreaker.successCount = 0;
      authBreaker.openedAt = 0;
    }
    return;
  }
  authBreaker.failureCount = 0;
}

function authBreakerRecordFailure(): void {
  const state = getAuthBreakerState();
  if (state === 'open') return;
  authBreaker.failureCount += 1;
  if (authBreaker.failureCount >= AUTH_BREAKER_FAILURE_THRESHOLD) {
    authBreaker.state = 'open';
    authBreaker.openedAt = Date.now();
  }
}

// ============================================================================
// fetchUserInfo (standalone for testing)
// ============================================================================
async function fetchUserInfo(
  supabaseUrl: string,
  anonKey: string,
  token: string,
): Promise<AuthResult> {
  const cacheKey = await hashToken(token);

  const cached = authCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  if (!authBreakerAllows()) {
    return {
      user: null,
      token,
      error: { code: 'AUTH_BREAKER_OPEN', status: 503, message: 'Auth service temporarily unavailable (breaker open)' },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorResult: AuthResult = {
        user: null,
        token,
        error:
          response.status === 401
            ? { code: 'UNAUTHORIZED', status: 401, message: 'Token inválido o expirado' }
            : { code: 'AUTH_ERROR', status: response.status, message: 'Error verificando token' },
      };

      if (response.status === 401) {
        authCache.set(cacheKey, {
          result: errorResult,
          expiresAt: Date.now() + AUTH_NEGATIVE_CACHE_TTL_MS,
        });
      }

      authBreakerRecordSuccess();
      return errorResult;
    }

    const userData = await response.json();
    const appRole = userData.app_metadata?.role;
    const role = typeof appRole === 'string' ? appRole.toLowerCase() : null;

    const user: UserInfo = {
      id: userData.id,
      email: userData.email,
      role,
      app_metadata: userData.app_metadata,
      user_metadata: userData.user_metadata,
    };

    const successResult: AuthResult = { user, token, error: null };
    authCache.set(cacheKey, {
      result: successResult,
      expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
    });

    authBreakerRecordSuccess();
    return successResult;
  } catch (err: any) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    authBreakerRecordFailure();
    return {
      user: null,
      token,
      error: {
        code: isTimeout ? 'AUTH_TIMEOUT' : 'AUTH_ERROR',
        status: 503,
        message: isTimeout ? 'Auth service timeout' : 'Auth service unreachable',
      },
    };
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Auth Resilient (A3)', () => {
  beforeEach(() => {
    clearAuthCache();
    resetAuthBreaker();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token hash', () => {
    it('produces consistent hex hash', async () => {
      const h1 = await hashToken('test-token-123');
      const h2 = await hashToken('test-token-123');
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[0-9a-f]{32}$/);
    });

    it('produces different hashes for different tokens', async () => {
      const h1 = await hashToken('token-a');
      const h2 = await hashToken('token-b');
      expect(h1).not.toBe(h2);
    });
  });

  describe('Cache hit/miss', () => {
    it('returns cached result on second call (cache hit)', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'u1', email: 'a@b.com', app_metadata: { role: 'admin' } }), { status: 200 }),
      );

      const r1 = await fetchUserInfo('https://x.supabase.co', 'anon', 'tok1');
      expect(r1.user?.id).toBe('u1');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const r2 = await fetchUserInfo('https://x.supabase.co', 'anon', 'tok1');
      expect(r2.user?.id).toBe('u1');
      expect(fetchSpy).toHaveBeenCalledTimes(1); // No second fetch
    });

    it('fetches again after cache expires', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'u1', email: 'a@b.com', app_metadata: { role: 'admin' } }), { status: 200 }),
      );

      await fetchUserInfo('https://x.supabase.co', 'anon', 'tok-expire');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Manually expire the cache
      for (const [, entry] of authCache) {
        entry.expiresAt = Date.now() - 1;
      }

      await fetchUserInfo('https://x.supabase.co', 'anon', 'tok-expire');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Negative cache (401)', () => {
    it('caches 401 response for negative TTL', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const r1 = await fetchUserInfo('https://x.supabase.co', 'anon', 'bad-tok');
      expect(r1.error?.code).toBe('UNAUTHORIZED');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const r2 = await fetchUserInfo('https://x.supabase.co', 'anon', 'bad-tok');
      expect(r2.error?.code).toBe('UNAUTHORIZED');
      expect(fetchSpy).toHaveBeenCalledTimes(1); // Served from negative cache
    });

    it('does NOT cache non-401 errors', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Server Error', { status: 500 }),
      );

      const r1 = await fetchUserInfo('https://x.supabase.co', 'anon', 'err-tok');
      expect(r1.error?.code).toBe('AUTH_ERROR');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const r2 = await fetchUserInfo('https://x.supabase.co', 'anon', 'err-tok');
      expect(r2.error?.code).toBe('AUTH_ERROR');
      expect(fetchSpy).toHaveBeenCalledTimes(2); // NOT cached
    });
  });

  describe('Timeout', () => {
    it('returns AUTH_TIMEOUT when fetch exceeds timeout', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const err = new DOMException('The operation was aborted', 'AbortError');
            reject(err);
          }, 10);
        });
      });

      const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'slow-tok');
      expect(result.error?.code).toBe('AUTH_TIMEOUT');
      expect(result.error?.status).toBe(503);
    });

    it('returns AUTH_ERROR on network failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'net-err-tok');
      expect(result.error?.code).toBe('AUTH_ERROR');
      expect(result.error?.status).toBe(503);
    });
  });

  describe('Auth Breaker', () => {
    it('starts in closed state', () => {
      expect(getAuthBreakerState()).toBe('closed');
      expect(authBreakerAllows()).toBe(true);
    });

    it('opens after threshold failures', () => {
      for (let i = 0; i < AUTH_BREAKER_FAILURE_THRESHOLD; i++) {
        authBreakerRecordFailure();
      }
      expect(getAuthBreakerState()).toBe('open');
      expect(authBreakerAllows()).toBe(false);
    });

    it('fails fast when breaker is open', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // Open the breaker
      for (let i = 0; i < AUTH_BREAKER_FAILURE_THRESHOLD; i++) {
        authBreakerRecordFailure();
      }

      const result = await fetchUserInfo('https://x.supabase.co', 'anon', 'breaker-tok');
      expect(result.error?.code).toBe('AUTH_BREAKER_OPEN');
      expect(result.error?.status).toBe(503);
      expect(fetchSpy).not.toHaveBeenCalled(); // No fetch attempted
    });

    it('transitions to half_open after timeout', () => {
      for (let i = 0; i < AUTH_BREAKER_FAILURE_THRESHOLD; i++) {
        authBreakerRecordFailure();
      }
      expect(getAuthBreakerState()).toBe('open');

      // Simulate time passing
      authBreaker.openedAt = Date.now() - AUTH_BREAKER_OPEN_TIMEOUT_MS - 1;
      expect(getAuthBreakerState()).toBe('half_open');
      expect(authBreakerAllows()).toBe(true);
    });

    it('closes after success in half_open', () => {
      for (let i = 0; i < AUTH_BREAKER_FAILURE_THRESHOLD; i++) {
        authBreakerRecordFailure();
      }
      authBreaker.openedAt = Date.now() - AUTH_BREAKER_OPEN_TIMEOUT_MS - 1;
      expect(getAuthBreakerState()).toBe('half_open');

      authBreakerRecordSuccess();
      expect(getAuthBreakerState()).toBe('closed');
    });

    it('reopens if failure in half_open', () => {
      for (let i = 0; i < AUTH_BREAKER_FAILURE_THRESHOLD; i++) {
        authBreakerRecordFailure();
      }
      authBreaker.openedAt = Date.now() - AUTH_BREAKER_OPEN_TIMEOUT_MS - 1;
      expect(getAuthBreakerState()).toBe('half_open');

      // Fail enough times to reopen
      for (let i = 0; i < AUTH_BREAKER_FAILURE_THRESHOLD; i++) {
        authBreakerRecordFailure();
      }
      expect(getAuthBreakerState()).toBe('open');
    });

    it('401 counts as success (service reachable)', async () => {
      // Push breaker near threshold
      authBreakerRecordFailure();
      authBreakerRecordFailure();

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      await fetchUserInfo('https://x.supabase.co', 'anon', 'unauth-tok');
      // 401 resets failure count
      expect(authBreaker.failureCount).toBe(0);
    });
  });

  describe('Cache size control', () => {
    it('cache size tracks entries', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'u1', email: 'a@b.com', app_metadata: { role: 'admin' } }), { status: 200 }),
      );

      expect(getAuthCacheSize()).toBe(0);
      await fetchUserInfo('https://x.supabase.co', 'anon', 'size-tok');
      expect(getAuthCacheSize()).toBe(1);
    });
  });
});
