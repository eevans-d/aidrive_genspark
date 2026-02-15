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
 * Restricts internal cron endpoints to service-role callers.
 * Accepts either Authorization Bearer token or apikey header.
 */
export function requireServiceRoleAuth(
  req: Request,
  serviceRoleKey: string,
  headers: HeadersLike = {},
  requestId?: string,
): AuthResult {
  const authHeader = req.headers.get('authorization');
  const apiKeyHeader = req.headers.get('apikey');
  const expectedBearer = `Bearer ${serviceRoleKey}`;

  // Primary mode: exact match against the project service role key (or configured internal token).
  let authorized = authHeader === expectedBearer || apiKeyHeader === serviceRoleKey;

  // Fallback: if the platform already verified the JWT (verify_jwt=true), accept any JWT whose role is service_role.
  // This prevents brittle coupling to a specific key string while still requiring a privileged token.
  if (!authorized && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = decodeJwtPayload(token);
    if (payload && payload['role'] === 'service_role') {
      authorized = true;
    }
  }

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
