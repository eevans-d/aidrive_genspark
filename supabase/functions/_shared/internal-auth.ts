import { fail } from './response.ts';

type HeadersLike = Record<string, string>;

type AuthResult = {
  authorized: boolean;
  errorResponse?: Response;
};

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

  const authorized = authHeader === expectedBearer || apiKeyHeader === serviceRoleKey;

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
