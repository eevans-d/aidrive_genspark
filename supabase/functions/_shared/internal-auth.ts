import { fail } from './response.ts';

type HeadersLike = Record<string, string>;

type AuthResult = {
  authorized: boolean;
  errorResponse?: Response;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    // JWT payload is base64url without padding.
    const b64url = parts[1];
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks on secret tokens.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Do extra work to keep time roughly constant
    let dummy = 0;
    for (let i = 0; i < a.length; i++) {
      dummy |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Restricts internal cron endpoints to service-role callers.
 * Accepts either Authorization Bearer token or apikey header.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function requireServiceRoleAuth(
  req: Request,
  serviceRoleKey: string,
  headers: HeadersLike = {},
  requestId?: string,
): AuthResult {
  const authHeader = req.headers.get('authorization') ?? '';
  const apiKeyHeader = req.headers.get('apikey') ?? '';
  const expectedBearer = `Bearer ${serviceRoleKey}`;

  const authorized = timingSafeEqual(authHeader, expectedBearer) || timingSafeEqual(apiKeyHeader, serviceRoleKey);

  if (authorized) {
    return { authorized: true };
  }

  return {
    authorized: false,
    errorResponse: fail(
      'UNAUTHORIZED',
      'Unauthorized: internal service token required',
      401,
      headers,
      { requestId },
    ),
  };
}
