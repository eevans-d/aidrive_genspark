/**
 * Authentication and authorization helpers for api-minimarket.
 *
 * Security model:
 * - Uses JWT from user's Auth session (anon key for verification)
 * - Validates roles server-side from app_metadata (NOT user_metadata)
 * - Service role is NOT used for regular queries
 * - Token validation cached in-memory (TTL 30s) with negative-cache (10s)
 * - Dedicated circuit breaker for /auth/v1/user
 * - Timeout via AbortController (5s)
 */

import { toAppError, AppError } from '../../_shared/errors.ts';

export type UserInfo = {
  id: string;
  email?: string;
  role: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export type AuthResult = {
  user: UserInfo | null;
  token: string | null;
  error: AppError | null;
};

/**
 * Base roles allowed in the system.
 * Role names are always lowercase for comparison.
 */
export const BASE_ROLES = ['admin', 'deposito', 'ventas'] as const;
export type BaseRole = (typeof BASE_ROLES)[number];

// ============================================================================
// AUTH CACHE (in-memory, per-instance)
// ============================================================================
const AUTH_CACHE_TTL_MS = 30_000;         // 30s for valid tokens
const AUTH_NEGATIVE_CACHE_TTL_MS = 10_000; // 10s for 401s (avoid loops)
const AUTH_TIMEOUT_MS = 5_000;            // 5s timeout for /auth/v1/user

type AuthCacheEntry = {
  result: AuthResult;
  expiresAt: number;
};

/** Key: SHA-256 hash of token (never store raw token) */
const authCache = new Map<string, AuthCacheEntry>();

/** Compute a short hash of the token for cache key (never log raw token) */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  // Use first 16 bytes as hex for key (enough for uniqueness, not reversible)
  return Array.from(hashArray.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Evict expired entries periodically (max 100 entries, lazy cleanup) */
function evictExpired(): void {
  if (authCache.size <= 100) return;
  const now = Date.now();
  for (const [key, entry] of authCache) {
    if (now >= entry.expiresAt) authCache.delete(key);
  }
}

// Exported for testing
export function _clearAuthCache(): void {
  authCache.clear();
}
export function _getAuthCacheSize(): number {
  return authCache.size;
}

// ============================================================================
// AUTH CIRCUIT BREAKER (dedicated for /auth/v1/user)
// ============================================================================
const AUTH_BREAKER_FAILURE_THRESHOLD = 3;
const AUTH_BREAKER_OPEN_TIMEOUT_MS = 15_000; // 15s before half-open
const AUTH_BREAKER_SUCCESS_THRESHOLD = 1;

type AuthBreakerState = 'closed' | 'open' | 'half_open';

const authBreaker = {
  state: 'closed' as AuthBreakerState,
  failureCount: 0,
  successCount: 0,
  openedAt: 0,
};

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

// Exported for testing
export function _resetAuthBreaker(): void {
  authBreaker.state = 'closed';
  authBreaker.failureCount = 0;
  authBreaker.successCount = 0;
  authBreaker.openedAt = 0;
}
export function _getAuthBreakerStats() {
  return { ...authBreaker, state: getAuthBreakerState() };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Extract bearer token from Authorization header.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const trimmed = authHeader.trim();
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim() || null;
  }
  return null;
}

/**
 * Fetch user info from Supabase Auth API with caching, timeout, and breaker.
 *
 * Flow:
 * 1. Check cache (hit → return cached)
 * 2. Check breaker (open → fail-fast)
 * 3. Fetch /auth/v1/user with AbortController timeout
 * 4. Cache result (positive or negative)
 * 5. Update breaker state
 */
export async function fetchUserInfo(
  supabaseUrl: string,
  anonKey: string,
  token: string,
): Promise<AuthResult> {
  // 1. Cache lookup
  const cacheKey = await hashToken(token);
  evictExpired();

  const cached = authCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  // 2. Breaker check
  if (!authBreakerAllows()) {
    return {
      user: null,
      token,
      error: toAppError(
        new Error('Auth service temporarily unavailable (breaker open)'),
        'AUTH_BREAKER_OPEN',
        503,
      ),
    };
  }

  // 3. Fetch with timeout
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
      // 4a. Negative cache for 401
      const errorResult: AuthResult = {
        user: null,
        token,
        error:
          response.status === 401
            ? toAppError(new Error('Token inválido o expirado'), 'UNAUTHORIZED', 401)
            : toAppError(new Error('Error verificando token'), 'AUTH_ERROR', response.status),
      };

      if (response.status === 401) {
        authCache.set(cacheKey, {
          result: errorResult,
          expiresAt: Date.now() + AUTH_NEGATIVE_CACHE_TTL_MS,
        });
      }

      authBreakerRecordSuccess(); // 401 means auth service IS reachable
      return errorResult;
    }

    const userData = await response.json();

    // Extract role from app_metadata ONLY (more secure than user_metadata).
    // ARQUITECTURA: El backend usa app_metadata.role (JWT context);
    // el frontend usa personal.rol (DB query directa).
    // Ambos aplican la misma normalizacion de aliases.
    // Sincronizacion: scripts/supabase-admin-sync-role.mjs (D-065).
    const appRole = userData.app_metadata?.role;
    let role = typeof appRole === 'string' ? appRole.toLowerCase().trim() : null;

    if (role === 'jefe' || role === 'administrador' || role === 'administrator') role = 'admin';
    if (role === 'depósito' || role === 'warehouse') role = 'deposito';
    if (role === 'vendedor' || role === 'sales') role = 'ventas';

    const user: UserInfo = {
      id: userData.id,
      email: userData.email,
      role,
      app_metadata: userData.app_metadata,
      user_metadata: userData.user_metadata,
    };

    const successResult: AuthResult = { user, token, error: null };

    // 4b. Positive cache
    authCache.set(cacheKey, {
      result: successResult,
      expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
    });

    // 5. Breaker success
    authBreakerRecordSuccess();
    return successResult;
  } catch (err) {
    // Timeout or network error → breaker failure
    const isTimeout =
      err instanceof DOMException && err.name === 'AbortError';

    authBreakerRecordFailure();

    return {
      user: null,
      token,
      error: toAppError(
        new Error(isTimeout ? 'Auth service timeout' : 'Auth service unreachable'),
        isTimeout ? 'AUTH_TIMEOUT' : 'AUTH_ERROR',
        503,
      ),
    };
  }
}

/**
 * Verify that user has one of the allowed roles.
 * Throws AppError if not authorized.
 */
export function requireRole(user: UserInfo | null, allowedRoles: readonly string[]): void {
  if (!user) {
    throw toAppError(
      new Error('No autorizado - requiere autenticación'),
      'UNAUTHORIZED',
      401,
    );
  }

  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  if (!user.role || !normalizedAllowed.includes(user.role)) {
    throw toAppError(
      new Error(`Acceso denegado - requiere rol: ${allowedRoles.join(' o ')}`),
      'FORBIDDEN',
      403,
    );
  }
}

/**
 * Check if user has a specific role (no throw).
 */
export function hasRole(user: UserInfo | null, role: string): boolean {
  if (!user || !user.role) return false;
  return user.role === role.toLowerCase();
}

/**
 * Check if user has any of the specified roles (no throw).
 */
export function hasAnyRole(user: UserInfo | null, roles: readonly string[]): boolean {
  if (!user || !user.role) return false;
  const normalizedRoles = roles.map((r) => r.toLowerCase());
  return normalizedRoles.includes(user.role);
}

/**
 * Create request headers for PostgREST calls.
 * Uses user's JWT token for RLS enforcement.
 * Falls back to anon key only if no token (public endpoints).
 */
export function createRequestHeaders(
  token: string | null,
  anonKey: string,
  requestId: string,
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  return {
    Authorization: `Bearer ${token || anonKey}`,
    apikey: anonKey,
    'Content-Type': 'application/json',
    'x-request-id': requestId,
    ...extraHeaders,
  };
}
