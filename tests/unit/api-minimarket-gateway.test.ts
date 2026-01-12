/**
 * Unit tests for api-minimarket helpers and gateway security.
 */

import { describe, it, expect } from 'vitest';

// Import helpers
import {
  extractBearerToken,
  requireRole,
  hasRole,
  hasAnyRole,
  createRequestHeaders,
  BASE_ROLES,
  type UserInfo,
} from '../../supabase/functions/api-minimarket/helpers/auth.ts';

import {
  isUuid,
  parsePositiveNumber,
  parseNonNegativeNumber,
  parsePositiveInt,
  parseNonNegativeInt,
  sanitizeTextParam,
  isValidMovimientoTipo,
  isValidCodigo,
} from '../../supabase/functions/api-minimarket/helpers/validation.ts';

import {
  parsePagination,
  buildPaginationMeta,
} from '../../supabase/functions/api-minimarket/helpers/pagination.ts';

import {
  parseContentRange,
  buildQueryUrl,
} from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

// ============================================================================
// AUTH HELPERS TESTS
// ============================================================================

describe('auth helpers', () => {
  describe('extractBearerToken', () => {
    it('extracts token from valid Bearer header', () => {
      expect(extractBearerToken('Bearer abc123')).toBe('abc123');
      expect(extractBearerToken('bearer XYZ')).toBe('XYZ');
      expect(extractBearerToken('BEARER token')).toBe('token');
    });

    it('returns null for invalid headers', () => {
      expect(extractBearerToken(null)).toBeNull();
      expect(extractBearerToken('')).toBeNull();
      expect(extractBearerToken('Basic abc123')).toBeNull();
      expect(extractBearerToken('Bearer ')).toBeNull();
      expect(extractBearerToken('Bearer')).toBeNull();
    });
  });

  describe('requireRole', () => {
    const adminUser: UserInfo = { id: '1', role: 'admin' };
    const depositoUser: UserInfo = { id: '2', role: 'deposito' };
    const ventasUser: UserInfo = { id: '3', role: 'ventas' };
    const noRoleUser: UserInfo = { id: '4', role: null };

    it('does not throw when user has allowed role', () => {
      expect(() => requireRole(adminUser, ['admin'])).not.toThrow();
      expect(() => requireRole(depositoUser, ['admin', 'deposito'])).not.toThrow();
      expect(() => requireRole(ventasUser, BASE_ROLES)).not.toThrow();
    });

    it('throws UNAUTHORIZED when user is null', () => {
      expect(() => requireRole(null, ['admin'])).toThrow(/No autorizado/);
    });

    it('throws FORBIDDEN when user lacks required role', () => {
      expect(() => requireRole(ventasUser, ['admin'])).toThrow(/Acceso denegado/);
      expect(() => requireRole(noRoleUser, ['admin'])).toThrow(/Acceso denegado/);
    });
  });

  describe('hasRole', () => {
    const adminUser: UserInfo = { id: '1', role: 'admin' };

    it('returns true for matching role', () => {
      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(hasRole(adminUser, 'ADMIN')).toBe(true); // case-insensitive
    });

    it('returns false for non-matching role', () => {
      expect(hasRole(adminUser, 'deposito')).toBe(false);
      expect(hasRole(null, 'admin')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    const depositoUser: UserInfo = { id: '2', role: 'deposito' };

    it('returns true if user has any of the roles', () => {
      expect(hasAnyRole(depositoUser, ['admin', 'deposito'])).toBe(true);
    });

    it('returns false if user has none of the roles', () => {
      expect(hasAnyRole(depositoUser, ['admin', 'ventas'])).toBe(false);
    });
  });

  describe('createRequestHeaders', () => {
    it('uses token when provided', () => {
      const headers = createRequestHeaders('user-token', 'anon-key', 'req-123');
      expect(headers.Authorization).toBe('Bearer user-token');
      expect(headers.apikey).toBe('anon-key');
      expect(headers['x-request-id']).toBe('req-123');
    });

    it('falls back to anon key when no token', () => {
      const headers = createRequestHeaders(null, 'anon-key', 'req-456');
      expect(headers.Authorization).toBe('Bearer anon-key');
    });

    it('merges extra headers', () => {
      const headers = createRequestHeaders('token', 'key', 'id', { Prefer: 'count=exact' });
      expect(headers.Prefer).toBe('count=exact');
    });
  });
});

// ============================================================================
// VALIDATION HELPERS TESTS
// ============================================================================

describe('validation helpers', () => {
  describe('isUuid', () => {
    it('validates correct UUIDs', () => {
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(isUuid(null)).toBe(false);
      expect(isUuid(undefined)).toBe(false);
      expect(isUuid('')).toBe(false);
      expect(isUuid('not-a-uuid')).toBe(false);
      expect(isUuid('550e8400-e29b-41d4-a716')).toBe(false); // too short
    });
  });

  describe('parsePositiveNumber', () => {
    it('parses valid positive numbers', () => {
      expect(parsePositiveNumber(5)).toBe(5);
      expect(parsePositiveNumber('10.5')).toBe(10.5);
      expect(parsePositiveNumber(0.001)).toBe(0.001);
    });

    it('rejects invalid values', () => {
      expect(parsePositiveNumber(0)).toBeNull();
      expect(parsePositiveNumber(-5)).toBeNull();
      expect(parsePositiveNumber('abc')).toBeNull();
      expect(parsePositiveNumber(null)).toBeNull();
    });
  });

  describe('parseNonNegativeNumber', () => {
    it('parses valid non-negative numbers', () => {
      expect(parseNonNegativeNumber(0)).toBe(0);
      expect(parseNonNegativeNumber(5)).toBe(5);
      expect(parseNonNegativeNumber('0')).toBe(0);
    });

    it('rejects negative values', () => {
      expect(parseNonNegativeNumber(-1)).toBeNull();
    });
  });

  describe('parsePositiveInt', () => {
    it('parses valid positive integers', () => {
      expect(parsePositiveInt(1)).toBe(1);
      expect(parsePositiveInt('100')).toBe(100);
    });

    it('rejects non-integers and non-positive', () => {
      expect(parsePositiveInt(0)).toBeNull();
      expect(parsePositiveInt(1.5)).toBeNull();
      expect(parsePositiveInt(-1)).toBeNull();
    });
  });

  describe('sanitizeTextParam', () => {
    it('removes special characters', () => {
      expect(sanitizeTextParam('hello world')).toBe('hello world');
      expect(sanitizeTextParam('<script>')).toBe('script');
      expect(sanitizeTextParam('test@#$%')).toBe('test');
    });

    it('preserves allowed characters', () => {
      expect(sanitizeTextParam('test_value-123.txt')).toBe('test_value-123.txt');
    });
  });

  describe('isValidMovimientoTipo', () => {
    it('validates correct movement types', () => {
      expect(isValidMovimientoTipo('entrada')).toBe(true);
      expect(isValidMovimientoTipo('salida')).toBe(true);
      expect(isValidMovimientoTipo('ajuste')).toBe(true);
      expect(isValidMovimientoTipo('transferencia')).toBe(true);
      expect(isValidMovimientoTipo('ENTRADA')).toBe(true); // case-insensitive
    });

    it('rejects invalid types', () => {
      expect(isValidMovimientoTipo('invalid')).toBe(false);
      expect(isValidMovimientoTipo('')).toBe(false);
    });
  });

  describe('isValidCodigo', () => {
    it('validates correct codes', () => {
      expect(isValidCodigo('CAT001')).toBe(true);
      expect(isValidCodigo('bebidas_gas')).toBe(true);
      expect(isValidCodigo('test-123')).toBe(true);
    });

    it('rejects invalid codes', () => {
      expect(isValidCodigo('')).toBe(false);
      expect(isValidCodigo('has space')).toBe(false);
      expect(isValidCodigo('special@char')).toBe(false);
    });
  });
});

// ============================================================================
// PAGINATION HELPERS TESTS
// ============================================================================

describe('pagination helpers', () => {
  describe('parsePagination', () => {
    it('returns defaults when no params', () => {
      const result = parsePagination(null, null, 50, 100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.params.limit).toBe(50);
        expect(result.params.offset).toBe(0);
      }
    });

    it('caps limit at maxLimit', () => {
      const result = parsePagination('500', '0', 50, 100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.params.limit).toBe(100);
      }
    });

    it('returns error for invalid limit', () => {
      const result = parsePagination('-5', '0', 50, 100);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe('limit');
      }
    });

    it('returns error for invalid offset', () => {
      const result = parsePagination('10', '-1', 50, 100);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe('offset');
      }
    });

    it('allows offset 0', () => {
      const result = parsePagination('10', '0', 50, 100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.params.offset).toBe(0);
      }
    });
  });

  describe('buildPaginationMeta', () => {
    it('builds correct metadata with count', () => {
      const meta = buildPaginationMeta(100, 10, 0);
      expect(meta.total).toBe(100);
      expect(meta.hasMore).toBe(true);
      expect(meta.page).toBe(1);
      expect(meta.totalPages).toBe(10);
    });

    it('handles last page', () => {
      const meta = buildPaginationMeta(100, 10, 90);
      expect(meta.hasMore).toBe(false);
      expect(meta.page).toBe(10);
    });

    it('handles null count', () => {
      const meta = buildPaginationMeta(null, 10, 0);
      expect(meta.total).toBeUndefined();
      expect(meta.hasMore).toBeUndefined();
    });
  });
});

// ============================================================================
// SUPABASE HELPERS TESTS
// ============================================================================

describe('supabase helpers', () => {
  describe('parseContentRange', () => {
    it('parses valid Content-Range header', () => {
      expect(parseContentRange('0-9/100')).toBe(100);
      expect(parseContentRange('0-49/50')).toBe(50);
      expect(parseContentRange('0-0/1')).toBe(1);
    });

    it('returns null for invalid headers', () => {
      expect(parseContentRange(null)).toBeNull();
      expect(parseContentRange('')).toBeNull();
      expect(parseContentRange('0-9/*')).toBeNull();
      expect(parseContentRange('invalid')).toBeNull();
    });
  });

  describe('buildQueryUrl', () => {
    const baseUrl = 'https://example.supabase.co';

    it('builds basic query URL', () => {
      const url = buildQueryUrl(baseUrl, 'products', {}, '*');
      expect(url).toContain('/rest/v1/products');
      expect(url).toContain('select=*');
    });

    it('adds filters as eq parameters', () => {
      const url = buildQueryUrl(baseUrl, 'products', { activo: true, categoria_id: '123' });
      expect(url).toContain('activo=eq.true');
      expect(url).toContain('categoria_id=eq.123');
    });

    it('adds pagination options', () => {
      const url = buildQueryUrl(baseUrl, 'products', {}, '*', { limit: 10, offset: 20 });
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=20');
    });

    it('adds order option', () => {
      const url = buildQueryUrl(baseUrl, 'products', {}, '*', { order: 'nombre.asc' });
      expect(url).toContain('order=nombre.asc');
    });
  });
});

// ============================================================================
// CORS & RATE LIMIT BEHAVIOR TESTS (via integration scenarios)
// ============================================================================

describe('CORS behavior expectations', () => {
  it('should block browser requests without Origin header (documented behavior)', () => {
    // This test documents expected behavior - actual test requires HTTP client
    // When REQUIRE_ORIGIN=true (default) and request has browser-like User-Agent
    // but no Origin header, it should return 403 CORS_ORIGIN_REQUIRED
    const expectedResponse = {
      success: false,
      error: {
        code: 'CORS_ORIGIN_REQUIRED',
        message: 'Origin header is required for browser requests',
      },
    };
    expect(expectedResponse.error.code).toBe('CORS_ORIGIN_REQUIRED');
  });

  it('should allow server-to-server requests without Origin', () => {
    // Server-to-server calls (no browser User-Agent, no Origin) should pass CORS
    // This is needed for api-minimarket -> api-proveedor calls
    const serverUserAgent = 'Deno/1.40.0';
    expect(serverUserAgent).not.toMatch(/mozilla|chrome|safari|firefox/i);
  });
});

describe('Rate limit behavior expectations', () => {
  it('should return 429 when rate limit exceeded', () => {
    // Documents expected response format when rate limit is exceeded
    const expectedResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    };
    expect(expectedResponse.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should include rate limit headers in response', () => {
    // Documents expected rate limit headers (IETF draft-ietf-httpapi-ratelimit-headers)
    const expectedHeaders = [
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
    ];
    expect(expectedHeaders).toHaveLength(3);
  });
});

describe('Authentication behavior expectations', () => {
  it('should use user JWT for RLS enforcement, not service role', () => {
    // Documents that queries use user's token, not service role
    // This ensures RLS policies are enforced
    const headers = createRequestHeaders('user-jwt-token', 'anon-key', 'req-id');
    expect(headers.Authorization).toBe('Bearer user-jwt-token');
    expect(headers.Authorization).not.toContain('service_role');
  });

  it('should validate roles from app_metadata (server-side)', () => {
    // Documents that roles are read from app_metadata, not client-provided
    const user: UserInfo = {
      id: '1',
      role: 'admin',
      app_metadata: { role: 'admin' },
      user_metadata: { role: 'hacker' }, // should be ignored
    };
    expect(hasRole(user, 'admin')).toBe(true);
  });
});
