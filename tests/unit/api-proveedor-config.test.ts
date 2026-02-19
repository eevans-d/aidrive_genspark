/**
 * Unit tests for api-proveedor config utilities.
 */

import { describe, it, expect } from 'vitest';

import {
  analyzeConfiguration,
  assessConfigHealth,
  generateOptimizationSuggestions,
  generateConfigHash,
} from '../../supabase/functions/api-proveedor/utils/config.ts';

describe('api-proveedor/utils/config', () => {
  describe('analyzeConfiguration()', () => {
    it('returns score 0 and issues for null config', () => {
      const result = analyzeConfiguration(null);
      expect(result.score).toBe(0);
      expect(result.issues).toContain('No configuration found');
      expect(result.needsUpdate).toBe(true);
      expect(result.optimizationPotential).toBe(0);
    });

    it('returns score 0 and issues for undefined config', () => {
      const result = analyzeConfiguration(undefined);
      expect(result.score).toBe(0);
      expect(result.needsUpdate).toBe(true);
    });

    it('returns full score for complete config', () => {
      const result = analyzeConfiguration({
        frecuencia_scraping: '1h',
        umbral_cambio_precio: 5,
        cache_ttl: 3600,
      });
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
      expect(result.needsUpdate).toBe(false);
    });

    it('deducts 20 for missing frecuencia_scraping', () => {
      const result = analyzeConfiguration({
        umbral_cambio_precio: 5,
        cache_ttl: 3600,
      });
      expect(result.score).toBe(80);
      expect(result.issues).toContain('Frecuencia de scraping no configurada');
      expect(result.needsUpdate).toBe(true);
    });

    it('deducts 15 for missing umbral_cambio_precio', () => {
      const result = analyzeConfiguration({
        frecuencia_scraping: '1h',
        cache_ttl: 3600,
      });
      expect(result.score).toBe(85);
      expect(result.issues).toContain('Umbral de cambio de precio no configurado');
      expect(result.optimizationPotential).toBe(10);
    });

    it('adds optimization potential for missing cache_ttl', () => {
      const result = analyzeConfiguration({
        frecuencia_scraping: '1h',
        umbral_cambio_precio: 5,
      });
      expect(result.score).toBe(100);
      expect(result.optimizationPotential).toBe(15);
    });

    it('accumulates all deductions and potential', () => {
      const result = analyzeConfiguration({});
      expect(result.score).toBe(65); // 100 - 20 - 15
      expect(result.issues).toHaveLength(2);
      expect(result.needsUpdate).toBe(true);
      expect(result.optimizationPotential).toBe(25); // 10 + 15
    });
  });

  describe('assessConfigHealth()', () => {
    it('returns "unhealthy" for null config', () => {
      expect(assessConfigHealth(null)).toBe('unhealthy');
    });

    it('returns "unhealthy" for config missing required fields', () => {
      expect(assessConfigHealth({})).toBe('unhealthy');
      expect(assessConfigHealth({ frecuencia_scraping: '1h' })).toBe('unhealthy');
    });

    it('returns "needs_update" for complete but stale config', () => {
      expect(
        assessConfigHealth({
          frecuencia_scraping: '1h',
          umbral_cambio_precio: 5,
          ultima_actualizacion: '2020-01-01T00:00:00Z',
        }),
      ).toBe('needs_update');
    });

    it('returns "healthy" for complete and recent config', () => {
      expect(
        assessConfigHealth({
          frecuencia_scraping: '1h',
          umbral_cambio_precio: 5,
          ultima_actualizacion: new Date().toISOString(),
        }),
      ).toBe('healthy');
    });
  });

  describe('generateOptimizationSuggestions()', () => {
    it('suggests cache_aggressive when missing', () => {
      const suggestions = generateOptimizationSuggestions({});
      expect(suggestions.some((s: any) => s.type === 'performance')).toBe(true);
    });

    it('suggests parallel_processing when missing', () => {
      const suggestions = generateOptimizationSuggestions({});
      expect(suggestions.some((s: any) => s.type === 'scalability')).toBe(true);
    });

    it('returns no suggestions when all features enabled', () => {
      const suggestions = generateOptimizationSuggestions({
        cache_aggressive: true,
        parallel_processing: true,
      });
      expect(suggestions).toHaveLength(0);
    });

    it('handles null config gracefully', () => {
      const suggestions = generateOptimizationSuggestions(null);
      expect(suggestions.length).toBe(2);
    });
  });

  describe('generateConfigHash()', () => {
    it('produces a hex string', () => {
      const hash = generateConfigHash({ key: 'value' });
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('produces same hash for same config', () => {
      const config = { a: 1, b: 'test' };
      expect(generateConfigHash(config)).toBe(generateConfigHash(config));
    });

    it('produces same hash regardless of key order', () => {
      const hash1 = generateConfigHash({ a: 1, b: 2 });
      const hash2 = generateConfigHash({ b: 2, a: 1 });
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different configs', () => {
      const hash1 = generateConfigHash({ a: 1 });
      const hash2 = generateConfigHash({ a: 2 });
      expect(hash1).not.toBe(hash2);
    });
  });
});
