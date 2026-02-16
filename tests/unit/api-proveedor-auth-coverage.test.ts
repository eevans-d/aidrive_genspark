/**
 * Coverage tests for api-proveedor/utils/auth.ts
 * Covers branches: timingSafeEqual, validateApiSecret, validateInternalOrigin,
 *                  parseReadAuthMode, extractBearerToken, buildSupabaseReadHeaders,
 *                  createAuthErrorResponse
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Deno.env before import
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: vi.fn(() => undefined) } };
}

import {
  validateApiSecret,
  validateInternalOrigin,
  parseReadAuthMode,
  extractBearerToken,
  buildSupabaseReadHeaders,
  createAuthErrorResponse,
} from '../../supabase/functions/api-proveedor/utils/auth';

const VALID_SECRET = 'a'.repeat(32); // 32 chars minimum

function mockDenoEnv(vars: Record<string, string | undefined>) {
  (globalThis as any).Deno.env.get = vi.fn((key: string) => vars[key]);
}

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/test', { headers });
}

describe('validateApiSecret', () => {
  it('returns error when API_PROVEEDOR_SECRET not configured', () => {
    mockDenoEnv({});
    const result = validateApiSecret(makeRequest({ 'x-api-secret': 'test' }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('no configurado');
  });

  it('returns error when secret is too short', () => {
    mockDenoEnv({ API_PROVEEDOR_SECRET: 'short' });
    const result = validateApiSecret(makeRequest({ 'x-api-secret': 'short' }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('32 caracteres');
  });

  it('returns error when x-api-secret header is missing', () => {
    mockDenoEnv({ API_PROVEEDOR_SECRET: VALID_SECRET });
    const result = validateApiSecret(makeRequest({}));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('x-api-secret requerido');
  });

  it('returns error when secrets do not match', () => {
    mockDenoEnv({ API_PROVEEDOR_SECRET: VALID_SECRET });
    const result = validateApiSecret(makeRequest({ 'x-api-secret': 'b'.repeat(32) }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalido');
  });

  it('returns error when secrets have different lengths', () => {
    mockDenoEnv({ API_PROVEEDOR_SECRET: VALID_SECRET });
    const result = validateApiSecret(makeRequest({ 'x-api-secret': 'short' }));
    expect(result.valid).toBe(false);
  });

  it('returns valid when secrets match', () => {
    mockDenoEnv({ API_PROVEEDOR_SECRET: VALID_SECRET });
    const result = validateApiSecret(makeRequest({ 'x-api-secret': VALID_SECRET }));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateInternalOrigin', () => {
  beforeEach(() => {
    mockDenoEnv({});
  });

  it('allows requests without Origin header (server-to-server)', () => {
    const result = validateInternalOrigin(makeRequest({}));
    expect(result.valid).toBe(true);
  });

  it('allows localhost origin', () => {
    const result = validateInternalOrigin(makeRequest({ origin: 'http://localhost' }));
    expect(result.valid).toBe(true);
  });

  it('allows 127.0.0.1 origin', () => {
    const result = validateInternalOrigin(makeRequest({ origin: 'http://127.0.0.1' }));
    expect(result.valid).toBe(true);
  });

  it('allows localhost with port', () => {
    const result = validateInternalOrigin(makeRequest({ origin: 'http://localhost:8000' }));
    expect(result.valid).toBe(true);
  });

  it('allows host.docker.internal', () => {
    const result = validateInternalOrigin(makeRequest({ origin: 'http://host.docker.internal' }));
    expect(result.valid).toBe(true);
  });

  it('blocks unknown origins', () => {
    const result = validateInternalOrigin(makeRequest({ origin: 'https://evil.com' }));
    expect(result.valid).toBe(false);
    expect(result.warning).toContain('not in internal allowlist');
  });

  it('allows custom origins from INTERNAL_ORIGINS_ALLOWLIST env', () => {
    mockDenoEnv({ INTERNAL_ORIGINS_ALLOWLIST: 'https://myapp.com,https://staging.myapp.com' });
    const result = validateInternalOrigin(makeRequest({ origin: 'https://myapp.com' }));
    expect(result.valid).toBe(true);
  });

  it('handles trailing slashes in origins', () => {
    const result = validateInternalOrigin(makeRequest({ origin: 'http://localhost/' }));
    expect(result.valid).toBe(true);
  });
});

describe('parseReadAuthMode', () => {
  it('returns "service" for "service"', () => {
    expect(parseReadAuthMode('service')).toBe('service');
  });

  it('returns "service" for "SERVICE" (case insensitive)', () => {
    expect(parseReadAuthMode('SERVICE')).toBe('service');
  });

  it('returns "anon" for any other value', () => {
    expect(parseReadAuthMode('anon')).toBe('anon');
    expect(parseReadAuthMode('other')).toBe('anon');
    expect(parseReadAuthMode('')).toBe('anon');
  });

  it('returns "anon" for null/undefined', () => {
    expect(parseReadAuthMode(null)).toBe('anon');
    expect(parseReadAuthMode(undefined)).toBe('anon');
  });
});

describe('extractBearerToken (api-proveedor)', () => {
  it('extracts token from Bearer header', () => {
    expect(extractBearerToken('Bearer mytoken')).toBe('mytoken');
  });

  it('is case-insensitive', () => {
    expect(extractBearerToken('bearer mytoken')).toBe('mytoken');
  });

  it('returns null for null', () => {
    expect(extractBearerToken(null)).toBeNull();
  });

  it('returns null for non-Bearer', () => {
    expect(extractBearerToken('Basic mytoken')).toBeNull();
  });

  it('returns null for Bearer with no token', () => {
    expect(extractBearerToken('Bearer ')).toBeNull();
  });
});

describe('buildSupabaseReadHeaders', () => {
  const opts = {
    anonKey: 'anon-key',
    serviceRoleKey: 'srv-key',
    authHeader: null as string | null,
    readMode: 'anon' as const,
  };

  it('returns jwt mode when auth header has Bearer token', () => {
    const result = buildSupabaseReadHeaders({
      ...opts,
      authHeader: 'Bearer user-jwt',
    });
    expect(result.mode).toBe('jwt');
    expect(result.headers.Authorization).toBe('Bearer user-jwt');
    expect(result.headers.apikey).toBe('anon-key');
  });

  it('returns service mode when readMode is service and no auth header', () => {
    const result = buildSupabaseReadHeaders({
      ...opts,
      readMode: 'service',
    });
    expect(result.mode).toBe('service');
    expect(result.headers.Authorization).toBe('Bearer srv-key');
  });

  it('returns anon mode by default', () => {
    const result = buildSupabaseReadHeaders(opts);
    expect(result.mode).toBe('anon');
    expect(result.headers.Authorization).toBe('Bearer anon-key');
  });
});

describe('createAuthErrorResponse', () => {
  it('returns 401 Response with error message', async () => {
    const resp = createAuthErrorResponse('test error', { 'x-req': 'r1' }, 'req1');
    expect(resp.status).toBe(401);
    const body = await resp.json();
    expect(body.error.code).toBe('AUTH_FAILED');
  });
});
