/**
 * Unit tests for api-proveedor format utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  formatTiempoTranscurrido,
  formatUptime,
  getMemoryUsage,
  formatPrecio,
  generateSlug,
  generateSearchTags,
  calculateCompetitivenessScore,
  calculateRelevanceScore,
} from '../../supabase/functions/api-proveedor/utils/format.ts';

describe('api-proveedor/utils/format', () => {
  describe('formatTiempoTranscurrido()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "hace unos segundos" for very recent timestamps', () => {
      expect(formatTiempoTranscurrido('2026-02-19T12:00:00Z')).toBe('hace unos segundos');
    });

    it('returns minutes (singular) for 1 minute ago', () => {
      expect(formatTiempoTranscurrido('2026-02-19T11:59:00Z')).toBe('hace 1 minuto');
    });

    it('returns minutes (plural) for multiple minutes ago', () => {
      expect(formatTiempoTranscurrido('2026-02-19T11:45:00Z')).toBe('hace 15 minutos');
    });

    it('returns hours (singular) for 1 hour ago', () => {
      expect(formatTiempoTranscurrido('2026-02-19T11:00:00Z')).toBe('hace 1 hora');
    });

    it('returns hours (plural) for multiple hours ago', () => {
      expect(formatTiempoTranscurrido('2026-02-19T06:00:00Z')).toBe('hace 6 horas');
    });

    it('returns days (singular) for 1 day ago', () => {
      expect(formatTiempoTranscurrido('2026-02-18T12:00:00Z')).toBe('hace 1 día');
    });

    it('returns days (plural) for multiple days ago', () => {
      expect(formatTiempoTranscurrido('2026-02-16T12:00:00Z')).toBe('hace 3 días');
    });
  });

  describe('formatUptime()', () => {
    it('formats seconds only', () => {
      expect(formatUptime(45)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatUptime(125)).toBe('2m 5s');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatUptime(3661)).toBe('1h 1m 1s');
    });

    it('handles zero', () => {
      expect(formatUptime(0)).toBe('0s');
    });

    it('formats large values', () => {
      expect(formatUptime(86400)).toBe('24h 0m 0s');
    });
  });

  describe('getMemoryUsage()', () => {
    it('returns zeroes when performance.memory is unavailable', () => {
      const result = getMemoryUsage();
      expect(result).toEqual({ used: 0, total: 0, limit: 0 });
    });

    it('returns MB values when performance.memory is available', () => {
      const original = (globalThis as any).performance?.memory;
      (globalThis as any).performance = {
        ...(globalThis as any).performance,
        memory: {
          usedJSHeapSize: 10 * 1024 * 1024,
          totalJSHeapSize: 50 * 1024 * 1024,
          jsHeapSizeLimit: 100 * 1024 * 1024,
        },
      };

      const result = getMemoryUsage();
      expect(result).toEqual({ used: 10, total: 50, limit: 100 });

      if (original) {
        (globalThis as any).performance.memory = original;
      } else {
        delete (globalThis as any).performance.memory;
      }
    });
  });

  describe('formatPrecio()', () => {
    it('formats a price in ARS currency', () => {
      const result = formatPrecio(1234.56);
      // Intl.NumberFormat with es-AR locale
      expect(result).toContain('1.234,56');
    });

    it('formats zero', () => {
      const result = formatPrecio(0);
      expect(result).toContain('0,00');
    });

    it('formats negative prices', () => {
      const result = formatPrecio(-500);
      expect(result).toContain('500,00');
    });
  });

  describe('generateSlug()', () => {
    it('converts text to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(generateSlug('Café & Más!')).toBe('caf-ms');
    });

    it('collapses multiple hyphens', () => {
      expect(generateSlug('one---two')).toBe('one-two');
    });

    it('handles empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('converts spaces to hyphens including leading/trailing', () => {
      // trim() runs after \s+ -> '-' replacement, so leading/trailing spaces become hyphens
      expect(generateSlug('  spaced  ')).toBe('-spaced-');
    });
  });

  describe('generateSearchTags()', () => {
    it('generates tags from name and brand', () => {
      const tags = generateSearchTags('Harina de Trigo 1kg', 'Pureza');
      expect(tags).toContain('harina');
      expect(tags).toContain('pureza');
    });

    it('deduplicates tags', () => {
      const tags = generateSearchTags('Coca Cola', 'coca');
      const uniqueTags = new Set(tags);
      expect(tags.length).toBe(uniqueTags.size);
    });

    it('limits to 10 tags maximum', () => {
      const tags = generateSearchTags(
        'one two three four five six seven eight nine ten eleven',
        'brand',
      );
      expect(tags.length).toBeLessThanOrEqual(10);
    });

    it('handles empty inputs', () => {
      const tags = generateSearchTags('', '');
      expect(tags).toEqual([]);
    });

    it('takes first 5 words from name', () => {
      const tags = generateSearchTags('a b c d e f g', '');
      expect(tags).toContain('a');
      expect(tags).toContain('e');
      expect(tags).not.toContain('f');
    });
  });

  describe('calculateCompetitivenessScore()', () => {
    it('returns 100 for fully competitive product', () => {
      const score = calculateCompetitivenessScore({
        stock_disponible: 10,
        precio_actual: 500,
        nombre: 'Test',
        marca: 'Brand',
      });
      expect(score).toBe(100);
    });

    it('returns 0 for product with no data', () => {
      const score = calculateCompetitivenessScore({
        stock_disponible: 0,
        precio_actual: 0,
        nombre: null,
        marca: null,
      });
      expect(score).toBe(0);
    });

    it('returns partial score for mixed data', () => {
      const score = calculateCompetitivenessScore({
        stock_disponible: 5,
        precio_actual: 0,
        nombre: 'Test',
        marca: 'Brand',
      });
      expect(score).toBe(67);
    });
  });

  describe('calculateRelevanceScore()', () => {
    it('returns 100 when all products match by name', () => {
      const score = calculateRelevanceScore(
        [
          { nombre: 'Coca Cola', marca: 'Coca' },
          { nombre: 'Coca Zero', marca: 'Coca' },
        ],
        'coca',
      );
      expect(score).toBe(100);
    });

    it('returns 0 for empty product list', () => {
      const score = calculateRelevanceScore([], 'test');
      expect(score).toBe(0);
    });

    it('returns 100 when searchTerm is empty', () => {
      const score = calculateRelevanceScore([{ nombre: 'Test', marca: 'B' }], '');
      expect(score).toBe(100);
    });

    it('returns partial score when only some fields match', () => {
      const score = calculateRelevanceScore(
        [{ nombre: 'Pepsi', marca: 'Coca' }],
        'coca',
      );
      // nameMatch=0, brandMatch=1 -> (0 + 1) / 2 = 0.5 -> 50
      expect(score).toBe(50);
    });
  });
});
