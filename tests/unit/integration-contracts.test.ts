/**
 * INTEGRATION CONTRACTS - Contratos entre módulos verificados con código REAL
 *
 * Importa y ejecuta funciones reales para validar:
 * 1. Scraper → Storage: formato de producto vía calculateConfidenceScore y generateContentHash
 * 2. Gateway → Supabase: createRequestHeaders, parsePagination
 * 3. Shared response: ok() / fail() contractual shape
 * 4. Error pipeline: toAppError → getErrorStatus consistency
 *
 * @module tests/unit/integration-contracts
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT 1: Scraper parsing → Storage pipeline
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: Scraper → Storage product format', () => {
  let calculateConfidenceScore: any;
  let extraerMarcaDelNombre: any;
  let generarSKU: any;
  let sanitizeProductName: any;

  beforeEach(async () => {
    ({
      calculateConfidenceScore,
      extraerMarcaDelNombre,
      generarSKU,
      sanitizeProductName,
    } = await import(
      '../../supabase/functions/scraper-maxiconsumo/parsing'
    ));
  });

  it('full pipeline: sanitize → brand → SKU → score produces valid product', () => {
    const rawName = '  🔥 Coca Cola Zero 500ml Lata  ';
    const category = 'Bebidas';

    const nombre = sanitizeProductName(rawName);
    const marca = extraerMarcaDelNombre(nombre);
    const sku = generarSKU(nombre, category);

    const producto = {
      nombre,
      marca,
      sku,
      precio_unitario: 450,
      codigo_barras: '7790895000129',
      stock_disponible: 100,
    };

    const score = calculateConfidenceScore(producto);

    // Pipeline output validation
    expect(nombre.length).toBeGreaterThan(0);
    expect(nombre.length).toBeLessThanOrEqual(255);
    expect(marca).toBe('Coca Cola');
    expect(sku).toMatch(/^BEB-/);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it('pipeline rejects obviously bad products with low confidence', () => {
    const nombre = sanitizeProductName('');
    const sku = generarSKU(nombre || 'unknown', 'General');

    const score = calculateConfidenceScore({
      nombre: nombre || '',
      sku,
      precio_unitario: -1,
      codigo_barras: '',
      stock_disponible: undefined,
    });

    expect(score).toBeLessThan(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT 2: Gateway headers → Supabase compatibility
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: Gateway → Supabase request headers', () => {
  let createRequestHeaders: any;

  beforeEach(async () => {
    ({ createRequestHeaders } = await import(
      '../../supabase/functions/api-minimarket/helpers/auth'
    ));
  });

  it('includes Authorization, apikey, Content-Type, x-request-id', () => {
    const headers = createRequestHeaders('user-jwt', 'anon-key-123', 'req-456');

    expect(headers.Authorization).toBe('Bearer user-jwt');
    expect(headers.apikey).toBe('anon-key-123');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['x-request-id']).toBe('req-456');
  });

  it('uses anon key for Authorization when user token is null', () => {
    const headers = createRequestHeaders(null, 'anon-key', 'id-1');
    expect(headers.apikey).toBe('anon-key');
    expect(headers.Authorization).toBe('Bearer anon-key');
    expect(headers['x-request-id']).toBe('id-1');
  });

  it('user JWT takes priority over anon key for Authorization', () => {
    const headers = createRequestHeaders('my-jwt', 'anon-key', 'id-2');
    expect(headers.Authorization).toBe('Bearer my-jwt');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT 3: Pagination → API response meta format
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: Pagination → Response meta consistency', () => {
  let parsePagination: any;
  let buildPaginationMeta: any;

  beforeEach(async () => {
    ({ parsePagination, buildPaginationMeta } = await import(
      '../../supabase/functions/api-minimarket/helpers/pagination'
    ));
  });

  it('parsePagination output feeds buildPaginationMeta correctly', () => {
    const parsed = parsePagination('20', '40', 50, 100);
    expect(parsed.ok).toBe(true);

    const meta = buildPaginationMeta(200, parsed.params.limit, parsed.params.offset);
    expect(meta.limit).toBe(20);
    expect(meta.offset).toBe(40);
    expect(meta.total).toBe(200);
    expect(meta.hasMore).toBe(true);
    expect(meta.page).toBe(3); // offset 40 / limit 20 + 1
    expect(meta.totalPages).toBe(10);
  });

  it('edge case: last page has hasMore=false', () => {
    const parsed = parsePagination('25', '75', 25, 100);
    expect(parsed.ok).toBe(true);

    const meta = buildPaginationMeta(100, parsed.params.limit, parsed.params.offset);
    expect(meta.hasMore).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT 4: Error pipeline consistency
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: Error creation → status extraction consistency', () => {
  let toAppError: any;
  let getErrorStatus: any;
  let isAppError: (e: unknown) => boolean;
  let fail: any;

  beforeEach(async () => {
    ({ toAppError, getErrorStatus, isAppError } = await import(
      '../../supabase/functions/_shared/errors'
    ));
    ({ fail } = await import(
      '../../supabase/functions/_shared/response'
    ));
  });

  it('toAppError status matches getErrorStatus extraction', () => {
    const statuses = [400, 401, 403, 404, 422, 429, 500, 502, 503];
    for (const s of statuses) {
      const err = toAppError(new Error('test'), 'CODE', s);
      expect(getErrorStatus(err)).toBe(s);
    }
  });

  it('fail() response status matches error code convention', async () => {
    const res = fail('NOT_FOUND', 'Resource missing', 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('error pipeline: toAppError → fail response → parseable output', async () => {
    const err = toAppError(new Error('DB connection failed'), 'DB_ERROR', 503);
    const res = fail(err.code, err.message, err.status);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.error.code).toBe('DB_ERROR');
    expect(body.error.message).toBe('DB connection failed');
    expect(res.status).toBe(503);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT 5: Validation → isUuid consistency con DB expectations
// ═══════════════════════════════════════════════════════════════════════════

describe('CONTRACT: Validation → isUuid matches Supabase UUID format', () => {
  let isUuid: (v: string | null | undefined) => boolean;

  beforeEach(async () => {
    ({ isUuid } = await import(
      '../../supabase/functions/api-minimarket/helpers/validation'
    ));
  });

  it('accepts valid v4 UUID', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects short or malformed strings', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('550e8400')).toBe(false);
    expect(isUuid('')).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('accepts UUID with uppercase letters', () => {
    expect(isUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });
});
