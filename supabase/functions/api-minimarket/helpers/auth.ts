/**
 * Authentication and authorization helpers for api-minimarket.
 *
 * Security model:
 * - Uses JWT from user's Auth session (anon key for verification)
 * - Validates roles server-side from app_metadata (NOT user_metadata)
 * - Service role is NOT used for regular queries
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
 * Fetch user info from Supabase Auth API.
 * Uses anon key for verification - NOT service role.
 */
export async function fetchUserInfo(
  supabaseUrl: string,
  anonKey: string,
  token: string,
): Promise<AuthResult> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          user: null,
          token,
          error: toAppError(new Error('Token inválido o expirado'), 'UNAUTHORIZED', 401),
        };
      }
      return {
        user: null,
        token,
        error: toAppError(new Error('Error verificando token'), 'AUTH_ERROR', response.status),
      };
    }

    const userData = await response.json();
    
    // Extract role from app_metadata ONLY (more secure)
    const appRole = userData.app_metadata?.role;
    const role = typeof appRole === 'string' ? appRole.toLowerCase() : null;

    const user: UserInfo = {
      id: userData.id,
      email: userData.email,
      role,
      app_metadata: userData.app_metadata,
      user_metadata: userData.user_metadata,
    };

    return { user, token, error: null };
  } catch (err) {
    return {
      user: null,
      token,
      error: toAppError(err, 'AUTH_ERROR', 500),
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
