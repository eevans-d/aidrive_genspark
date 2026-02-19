/**
 * Unit tests for api-proveedor params (sanitizeSearchInput).
 */

import { describe, it, expect } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => 'https://test.supabase.co' } };
}

import { sanitizeSearchInput } from '../../supabase/functions/api-proveedor/utils/params.ts';

describe('api-proveedor/utils/params — sanitizeSearchInput', () => {
  it('returns empty string for null/undefined input', () => {
    expect(sanitizeSearchInput(null as any)).toBe('');
    expect(sanitizeSearchInput(undefined as any)).toBe('');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeSearchInput(123 as any)).toBe('');
    expect(sanitizeSearchInput({} as any)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeSearchInput('')).toBe('');
  });

  it('passes through clean alphanumeric input', () => {
    expect(sanitizeSearchInput('harina')).toBe('harina');
    expect(sanitizeSearchInput('producto 123')).toBe('producto 123');
  });

  it('strips HTML angle brackets', () => {
    // Only <> are stripped, / remains
    expect(sanitizeSearchInput('test<b>bold</b>')).toBe('testbbold/b');
  });

  it('strips script tags completely', () => {
    expect(sanitizeSearchInput('<script>alert(1)</script>')).toBe('alert(1)');
    expect(sanitizeSearchInput('<SCRIPT SRC="x.js"></SCRIPT>')).toBe('');
  });

  it('strips quotes and special characters', () => {
    // Only quotes are stripped, = remains
    expect(sanitizeSearchInput("test'OR'1'='1")).toBe('testOR1=1');
    expect(sanitizeSearchInput('test"value"')).toBe('testvalue');
    expect(sanitizeSearchInput('test&amp;')).toBe('testamp');
  });

  it('strips backticks', () => {
    expect(sanitizeSearchInput('test`command`')).toBe('testcommand');
  });

  it('strips semicolons', () => {
    expect(sanitizeSearchInput('test; DROP TABLE users')).toBe('test DROP TABLE users');
  });

  it('strips control characters', () => {
    expect(sanitizeSearchInput('test\x00\x01\x1Fvalue')).toBe('testvalue');
  });

  it('trims whitespace', () => {
    expect(sanitizeSearchInput('  hello  ')).toBe('hello');
  });

  it('truncates input to 100 characters', () => {
    const longInput = 'a'.repeat(200);
    expect(sanitizeSearchInput(longInput).length).toBe(100);
  });

  it('preserves unicode letters', () => {
    expect(sanitizeSearchInput('café')).toBe('café');
    expect(sanitizeSearchInput('ñandú')).toBe('ñandú');
    expect(sanitizeSearchInput('日本語')).toBe('日本語');
  });

  it('handles combined XSS payloads', () => {
    const payload = '<script>document.cookie</script><img onerror="alert(1)">';
    const result = sanitizeSearchInput(payload);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });
});
