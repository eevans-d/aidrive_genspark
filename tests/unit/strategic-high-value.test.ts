/**
 * STRATEGIC HIGH-VALUE TESTS
 *
 * Tests that import and execute REAL project code to validate:
 * - Auth error handling and resilience (extractBearerToken, requireRole, hasRole, hasAnyRole)
 * - Validation logic (sanitizeTextParam, parseBooleanParam, parseISODate, validateAllowedFields)
 * - Pagination real behavior (parsePagination, buildPaginationMeta)
 * - Response builders (ok, fail) under edge conditions
 * - Scraper parsing with adversarial inputs
 *
 * @category PRIORITY: CRITICAL
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// PRIORIDAD CRÍTICA #1: Auth — Extraer tokens y verificar roles
// ═══════════════════════════════════════════════════════════════════════════

describe('Auth — extractBearerToken (real import)', () => {
  let extractBearerToken: (h: string | null) => string | null;

  beforeEach(async () => {
    ({ extractBearerToken } = await import(
      '../../supabase/functions/api-minimarket/helpers/auth'
    ));
  });

  it('returns token from standard Bearer header', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
  });

  it('is case-insensitive on "bearer" prefix', () => {
    expect(extractBearerToken('bearer TOKEN')).toBe('TOKEN');
    expect(extractBearerToken('BEARER TOKEN')).toBe('TOKEN');
    expect(extractBearerToken('BeArEr TOKEN')).toBe('TOKEN');
  });

  it('returns null for null or empty header', () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
  });

  it('returns null when prefix is present but token is empty', () => {
    expect(extractBearerToken('Bearer ')).toBeNull();
    expect(extractBearerToken('Bearer   ')).toBeNull();
  });

  it('returns null for non-Bearer schemes', () => {
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
    expect(extractBearerToken('Digest realm="test"')).toBeNull();
  });

  it('handles whitespace padding around header', () => {
    expect(extractBearerToken('  Bearer tok  ')).toBe('tok');
  });

  it('handles JWT-formatted tokens correctly', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc_signature';
    expect(extractBearerToken('Bearer ' + jwt)).toBe(jwt);
  });
});

describe('Auth — requireRole (real import)', () => {
  let requireRole: (
    user: { id: string; role: string | null } | null,
    roles: readonly string[],
  ) => void;

  beforeEach(async () => {
    ({ requireRole } = await import(
      '../../supabase/functions/api-minimarket/helpers/auth'
    ));
  });

  it('does not throw for user with matching role', () => {
    expect(() =>
      requireRole({ id: '1', role: 'admin' }, ['admin', 'ventas']),
    ).not.toThrow();
  });

  it('throws 401 for null user', () => {
    try {
      requireRole(null, ['admin']);
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });

  it('throws 403 for user with wrong role', () => {
    try {
      requireRole({ id: '1', role: 'ventas' }, ['admin']);
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(403);
    }
  });

  it('throws 403 for user with null role', () => {
    try {
      requireRole({ id: '1', role: null }, ['admin']);
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(403);
    }
  });

  it('performs case-insensitive role matching', () => {
    expect(() =>
      requireRole({ id: '1', role: 'admin' }, ['ADMIN']),
    ).not.toThrow();
  });
});

describe('Auth — hasRole & hasAnyRole (real import)', () => {
  let hasRole: (user: any, role: string) => boolean;
  let hasAnyRole: (user: any, roles: readonly string[]) => boolean;

  beforeEach(async () => {
    ({ hasRole, hasAnyRole } = await import(
      '../../supabase/functions/api-minimarket/helpers/auth'
    ));
  });

  it('hasRole returns true for exact role match', () => {
    expect(hasRole({ id: '1', role: 'admin' }, 'admin')).toBe(true);
  });

  it('hasRole returns false for wrong role', () => {
    expect(hasRole({ id: '1', role: 'ventas' }, 'admin')).toBe(false);
  });

  it('hasRole returns false for null user or null role', () => {
    expect(hasRole(null, 'admin')).toBe(false);
    expect(hasRole({ id: '1', role: null }, 'admin')).toBe(false);
  });

  it('hasAnyRole returns true when user role matches any in list', () => {
    expect(
      hasAnyRole({ id: '1', role: 'deposito' }, ['admin', 'deposito']),
    ).toBe(true);
  });

  it('hasAnyRole returns false when no roles match', () => {
    expect(
      hasAnyRole({ id: '1', role: 'ventas' }, ['admin', 'deposito']),
    ).toBe(false);
  });

  it('hasRole is case-insensitive on the role parameter', () => {
    expect(hasRole({ id: '1', role: 'admin' }, 'ADMIN')).toBe(true);
    expect(hasRole({ id: '1', role: 'deposito' }, 'Deposito')).toBe(true);
  });

  it('hasAnyRole is case-insensitive on role parameters', () => {
    expect(
      hasAnyRole({ id: '1', role: 'deposito' }, ['ADMIN', 'DEPOSITO']),
    ).toBe(true);
    expect(
      hasAnyRole({ id: '1', role: 'ventas' }, ['ADMIN', 'VENTAS']),
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRIORIDAD CRÍTICA #2: Pagination — parsePagination & buildPaginationMeta
// ═══════════════════════════════════════════════════════════════════════════

describe('Pagination — parsePagination (real import)', () => {
  let parsePagination: any;

  beforeEach(async () => {
    ({ parsePagination } = await import(
      '../../supabase/functions/api-minimarket/helpers/pagination'
    ));
  });

  it('returns defaults when both params are null', () => {
    const r = parsePagination(null, null, 20, 100);
    expect(r.ok).toBe(true);
    expect(r.params.limit).toBe(20);
    expect(r.params.offset).toBe(0);
  });

  it('caps limit at maxLimit', () => {
    const r = parsePagination('500', '0', 20, 100);
    expect(r.ok).toBe(true);
    expect(r.params.limit).toBe(100);
  });

  it('rejects non-integer limit', () => {
    const r = parsePagination('abc', '0', 20, 100);
    expect(r.ok).toBe(false);
    expect(r.error.field).toBe('limit');
  });

  it('rejects negative offset', () => {
    const r = parsePagination('10', '-5', 20, 100);
    expect(r.ok).toBe(false);
    expect(r.error.field).toBe('offset');
  });

  it('rejects zero limit', () => {
    const r = parsePagination('0', '0', 20, 100);
    expect(r.ok).toBe(false);
  });

  it('accepts valid limit and offset', () => {
    const r = parsePagination('50', '100', 20, 200);
    expect(r.ok).toBe(true);
    expect(r.params.limit).toBe(50);
    expect(r.params.offset).toBe(100);
  });

  it('handles empty strings like null', () => {
    const r = parsePagination('', '', 25, 100);
    expect(r.ok).toBe(true);
    expect(r.params.limit).toBe(25);
    expect(r.params.offset).toBe(0);
  });

  it('rejects float values for limit', () => {
    const r = parsePagination('10.5', '0', 20, 100);
    expect(r.ok).toBe(false);
  });
});

describe('Pagination — buildPaginationMeta (real import)', () => {
  let buildPaginationMeta: any;

  beforeEach(async () => {
    ({ buildPaginationMeta } = await import(
      '../../supabase/functions/api-minimarket/helpers/pagination'
    ));
  });

  it('computes hasMore, page, totalPages correctly', () => {
    const meta = buildPaginationMeta(100, 20, 0);
    expect(meta.total).toBe(100);
    expect(meta.hasMore).toBe(true);
    expect(meta.page).toBe(1);
    expect(meta.totalPages).toBe(5);
  });

  it('returns hasMore=false on last page', () => {
    const meta = buildPaginationMeta(100, 20, 80);
    expect(meta.hasMore).toBe(false);
    expect(meta.page).toBe(5);
  });

  it('omits total/hasMore when totalCount is null', () => {
    const meta = buildPaginationMeta(null, 20, 0);
    expect(meta.limit).toBe(20);
    expect(meta.offset).toBe(0);
    expect(meta).not.toHaveProperty('total');
    expect(meta).not.toHaveProperty('hasMore');
  });

  it('handles zero total correctly', () => {
    const meta = buildPaginationMeta(0, 20, 0);
    expect(meta.total).toBe(0);
    expect(meta.hasMore).toBe(false);
    expect(meta.totalPages).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRIORIDAD ALTA #3: Validation — funciones puras de validación
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation — sanitizeTextParam (real import)', () => {
  let sanitizeTextParam: (v: string) => string;

  beforeEach(async () => {
    ({ sanitizeTextParam } = await import(
      '../../supabase/functions/api-minimarket/helpers/validation'
    ));
  });

  it('removes HTML tags for XSS prevention', () => {
    expect(sanitizeTextParam('<script>alert(1)</script>')).not.toContain('<');
    expect(sanitizeTextParam('<img src=x onerror=alert(1)>')).not.toContain('<');
  });

  it('removes SQL injection characters', () => {
    const result = sanitizeTextParam("'; DROP TABLE users--");
    expect(result).not.toContain("'");
    expect(result).not.toContain(';');
  });

  it('allows alphanumeric, spaces, dots, underscores, hyphens', () => {
    expect(sanitizeTextParam('Coca Cola 500ml')).toBe('Coca Cola 500ml');
    expect(sanitizeTextParam('item_1-b.txt')).toBe('item_1-b.txt');
  });

  it('trims whitespace', () => {
    expect(sanitizeTextParam('  hello  ')).toBe('hello');
  });
});

describe('Validation — parseBooleanParam (real import)', () => {
  let parseBooleanParam: (v: string | null) => boolean | null;

  beforeEach(async () => {
    ({ parseBooleanParam } = await import(
      '../../supabase/functions/api-minimarket/helpers/validation'
    ));
  });

  it('parses "true" and "false" correctly', () => {
    expect(parseBooleanParam('true')).toBe(true);
    expect(parseBooleanParam('false')).toBe(false);
  });

  it('returns null for null input', () => {
    expect(parseBooleanParam(null)).toBeNull();
  });

  it('returns null for non-standard truthy values', () => {
    expect(parseBooleanParam('yes')).toBeNull();
    expect(parseBooleanParam('1')).toBeNull();
    expect(parseBooleanParam('TRUE')).toBeNull();
  });
});

describe('Validation — parseISODate (real import)', () => {
  let parseISODate: (v: string | null) => Date | null;

  beforeEach(async () => {
    ({ parseISODate } = await import(
      '../../supabase/functions/api-minimarket/helpers/validation'
    ));
  });

  it('parses valid ISO 8601 string', () => {
    const d = parseISODate('2026-01-15T10:30:00Z');
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
  });

  it('returns null for invalid/empty date strings', () => {
    expect(parseISODate('not-a-date')).toBeNull();
    expect(parseISODate('')).toBeNull();
    expect(parseISODate(null)).toBeNull();
  });
});

describe('Validation — validateAllowedFields (real import)', () => {
  let validateAllowedFields: any;
  let PRODUCTO_UPDATE_FIELDS: Set<string>;

  beforeEach(async () => {
    ({ validateAllowedFields, PRODUCTO_UPDATE_FIELDS } = await import(
      '../../supabase/functions/api-minimarket/helpers/validation'
    ));
  });

  it('accepts object with only allowed fields', () => {
    const r = validateAllowedFields(
      { nombre: 'X', precio_actual: 100 },
      PRODUCTO_UPDATE_FIELDS,
    );
    expect(r.valid).toBe(true);
    expect(r.unknownFields).toHaveLength(0);
  });

  it('rejects object with unknown/dangerous fields', () => {
    const r = validateAllowedFields(
      { nombre: 'X', password: 'hack', is_admin: true },
      PRODUCTO_UPDATE_FIELDS,
    );
    expect(r.valid).toBe(false);
    expect(r.unknownFields).toContain('password');
    expect(r.unknownFields).toContain('is_admin');
  });

  it('returns valid for empty object', () => {
    const r = validateAllowedFields({}, PRODUCTO_UPDATE_FIELDS);
    expect(r.valid).toBe(true);
  });
});

describe('Validation — isValidCodigo (real import)', () => {
  let isValidCodigo: (v: string) => boolean;

  beforeEach(async () => {
    ({ isValidCodigo } = await import(
      '../../supabase/functions/api-minimarket/helpers/validation'
    ));
  });

  it('accepts alphanumeric codes with dashes and underscores', () => {
    expect(isValidCodigo('ABC-123')).toBe(true);
    expect(isValidCodigo('sku_item_01')).toBe(true);
  });

  it('rejects codes with special characters or spaces', () => {
    expect(isValidCodigo('abc 123')).toBe(false);
    expect(isValidCodigo('ab@c')).toBe(false);
    expect(isValidCodigo('')).toBe(false);
    expect(isValidCodigo("'; DROP--")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRIORIDAD ALTA #4: Scraper parsing — adversarial inputs
// ═══════════════════════════════════════════════════════════════════════════

describe('Scraper parsing — adversarial inputs (real import)', () => {
  let calculateConfidenceScore: (p: any) => number;
  let sanitizeProductName: (n: string) => string;
  let extraerMarcaDelNombre: (n: string) => string;
  let generarSKU: (n: string, c: string) => string;

  beforeEach(async () => {
    ({
      calculateConfidenceScore,
      sanitizeProductName,
      extraerMarcaDelNombre,
      generarSKU,
    } = await import(
      '../../supabase/functions/scraper-maxiconsumo/parsing'
    ));
  });

  it('confidenceScore clamps between 0-100 for good product', () => {
    const good = calculateConfidenceScore({
      nombre: 'Coca Cola 500ml lata',
      precio_unitario: 450,
      sku: 'BEB-COCA-ABC123',
      codigo_barras: '7790895000129',
      stock_disponible: 50,
    });
    expect(good).toBeGreaterThanOrEqual(80);
    expect(good).toBeLessThanOrEqual(100);
  });

  it('confidenceScore remains low for bad product', () => {
    const bad = calculateConfidenceScore({
      nombre: 'X',
      precio_unitario: -500,
      sku: '',
      codigo_barras: '',
      stock_disponible: undefined,
    });
    expect(bad).toBeGreaterThanOrEqual(0);
    expect(bad).toBeLessThanOrEqual(50);
  });

  it('confidenceScore penalizes extremely long product names', () => {
    const score = calculateConfidenceScore({
      nombre: 'A'.repeat(250),
      precio_unitario: 100,
      sku: 'X',
      codigo_barras: '123',
      stock_disponible: 10,
    });
    expect(score).toBeLessThan(100);
  });

  it('confidenceScore handles NaN/Infinity price', () => {
    for (const price of [NaN, Infinity, -Infinity]) {
      const score = calculateConfidenceScore({
        nombre: 'Test Product Name',
        precio_unitario: price,
        sku: 'SKU1',
        codigo_barras: '123',
        stock_disponible: 0,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('sanitizeProductName removes emojis and special chars', () => {
    const cleaned = sanitizeProductName('🔥 ¡Oferta! Coca-Cola 500ml™');
    expect(cleaned).not.toContain('🔥');
    expect(cleaned).not.toContain('™');
  });

  it('sanitizeProductName truncates at 255 chars', () => {
    expect(sanitizeProductName('A'.repeat(500)).length).toBeLessThanOrEqual(255);
  });

  it('sanitizeProductName collapses multiple spaces', () => {
    expect(sanitizeProductName('Coca   Cola    500ml')).toBe('Coca Cola 500ml');
  });

  it('extraerMarcaDelNombre finds known brands', () => {
    expect(extraerMarcaDelNombre('Coca Cola Zero 500ml')).toBe('Coca Cola');
    expect(extraerMarcaDelNombre('Galletitas ARCOR 200g')).toBe('Arcor');
    expect(extraerMarcaDelNombre('Pepsi lata 354ml')).toBe('Pepsi');
  });

  it('extraerMarcaDelNombre falls back to first word for unknowns', () => {
    const result = extraerMarcaDelNombre('MarcaDesconocida producto test');
    expect(result).toBe('MarcaDesconocida');
  });

  it('generarSKU produces string with category prefix', () => {
    const sku = generarSKU('Coca Cola 500ml', 'Bebidas');
    expect(sku.length).toBeGreaterThan(0);
    expect(sku).toMatch(/^BEB-/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRIORIDAD ALTA #5: Response builders — ok/fail real behavior
// ═══════════════════════════════════════════════════════════════════════════

describe('Response builders — ok/fail real behavior', () => {
  let ok: any;
  let fail: any;

  beforeEach(async () => {
    ({ ok, fail } = await import(
      '../../supabase/functions/_shared/response'
    ));
  });

  it('ok() returns status 200 with success: true', async () => {
    const res = ok({ items: [1, 2, 3] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toEqual([1, 2, 3]);
  });

  it('ok() with custom status and requestId', async () => {
    const res = ok({ id: 1 }, 201, {}, { requestId: 'req-42' });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.requestId).toBe('req-42');
  });

  it('ok() sets Content-Type: application/json', () => {
    const res = ok(null);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('fail() returns error shape with code and message', async () => {
    const res = fail('VALIDATION_ERROR', 'Invalid input', 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Invalid input');
  });

  it('fail() defaults to status 400', async () => {
    const res = fail('INTERNAL_ERROR', 'Something broke');
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRIORIDAD ALTA #6: Error types — real error classification
// ═══════════════════════════════════════════════════════════════════════════

describe('Error classification — toAppError real behavior', () => {
  let toAppError: any;
  let isAppError: (err: unknown) => boolean;
  let getErrorStatus: (err: unknown) => number;

  beforeEach(async () => {
    ({ toAppError, isAppError, getErrorStatus } = await import(
      '../../supabase/functions/_shared/errors'
    ));
  });

  it('wraps plain Error into AppError with code and status', () => {
    const appErr = toAppError(new Error('test'), 'TEST_ERR', 422);
    expect(isAppError(appErr)).toBe(true);
    expect(appErr.code).toBe('TEST_ERR');
    expect(appErr.status).toBe(422);
    expect(appErr.message).toBe('test');
  });

  it('wraps non-Error values (string, null, undefined)', () => {
    expect(isAppError(toAppError('oops'))).toBe(true);
    expect(isAppError(toAppError(null))).toBe(true);
    expect(isAppError(toAppError(undefined))).toBe(true);
  });

  it('getErrorStatus returns the status from AppError', () => {
    expect(getErrorStatus(toAppError(new Error('x'), 'X', 404))).toBe(404);
  });

  it('getErrorStatus defaults to 500 for plain Error', () => {
    expect(getErrorStatus(new Error('random'))).toBe(500);
  });

  it('getErrorStatus infers status from plain Error message keywords', () => {
    expect(getErrorStatus(new Error('no autorizado'))).toBe(401);
    expect(getErrorStatus(new Error('unauthorized'))).toBe(401);
    expect(getErrorStatus(new Error('acceso denegado'))).toBe(403);
    expect(getErrorStatus(new Error('not found'))).toBe(404);
    expect(getErrorStatus(new Error('ya existe'))).toBe(409);
  });
});
