/**
 * Unit tests for api-minimarket helpers: validation, pagination, supabase.
 * 
 * NOTE: Auth helpers tests moved to gateway-auth.test.ts to avoid duplication.
 * 
 * @module tests/unit/api-minimarket-gateway
 */

import { describe, it, expect } from 'vitest';

// Import helpers
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
      expect(isUuid('550e8400-e29b-41d4-a716')).toBe(false);
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
      expect(isValidMovimientoTipo('ENTRADA')).toBe(true);
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
