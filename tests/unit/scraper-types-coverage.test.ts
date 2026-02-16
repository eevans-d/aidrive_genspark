/**
 * Coverage tests for scraper-maxiconsumo/types.ts
 * Covers: isValidScraperUrl, sanitizeSlug
 */
import { describe, it, expect } from 'vitest';
import {
  isValidScraperUrl,
  sanitizeSlug,
  MAXICONSUMO_BASE_URL,
  FUENTE_MAXICONSUMO,
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT,
  CACHE_MAX_SIZE,
  CACHE_DEFAULT_TTL,
} from '../../supabase/functions/scraper-maxiconsumo/types';

describe('Constants', () => {
  it('exports expected constants', () => {
    expect(MAXICONSUMO_BASE_URL).toContain('maxiconsumo.com');
    expect(FUENTE_MAXICONSUMO).toBe('Maxiconsumo Necochea');
    expect(DEFAULT_BATCH_SIZE).toBe(50);
    expect(DEFAULT_MAX_RETRIES).toBe(5);
    expect(DEFAULT_TIMEOUT).toBe(25000);
    expect(CACHE_MAX_SIZE).toBe(1000);
    expect(CACHE_DEFAULT_TTL).toBe(300000);
  });
});

describe('isValidScraperUrl', () => {
  it('accepts valid maxiconsumo HTTPS URLs', () => {
    expect(isValidScraperUrl('https://maxiconsumo.com/sucursal_necochea/')).toBe(true);
    expect(isValidScraperUrl('https://www.maxiconsumo.com/sucursal_necochea/')).toBe(true);
  });

  it('rejects HTTP (non-HTTPS) URLs', () => {
    expect(isValidScraperUrl('http://maxiconsumo.com/path')).toBe(false);
  });

  it('rejects non-maxiconsumo domains', () => {
    expect(isValidScraperUrl('https://evil.com/path')).toBe(false);
    expect(isValidScraperUrl('https://notmaxiconsumo.com/path')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isValidScraperUrl('not-a-url')).toBe(false);
    expect(isValidScraperUrl('')).toBe(false);
  });
});

describe('sanitizeSlug', () => {
  it('normalizes valid slugs', () => {
    expect(sanitizeSlug('alimentos-frescos')).toBe('alimentos-frescos');
    expect(sanitizeSlug('CATEGORIA-1')).toBe('categoria-1');
    expect(sanitizeSlug('  bebidas  ')).toBe('bebidas');
  });

  it('returns null for empty strings', () => {
    expect(sanitizeSlug('')).toBeNull();
    expect(sanitizeSlug('   ')).toBeNull();
  });

  it('returns null for slugs exceeding 64 chars', () => {
    expect(sanitizeSlug('a'.repeat(65))).toBeNull();
  });

  it('accepts max-length slug (64 chars)', () => {
    expect(sanitizeSlug('a'.repeat(64))).toBe('a'.repeat(64));
  });

  it('returns null for slugs with invalid characters', () => {
    expect(sanitizeSlug('hello world')).toBeNull();
    expect(sanitizeSlug('hello_world')).toBeNull();
    expect(sanitizeSlug('hello.world')).toBeNull();
    expect(sanitizeSlug('hëllo')).toBeNull();
  });
});
