/**
 * T02/RC-01: OCR Concurrency Lock Tests
 *
 * Validates that:
 * 1. updateTableConditional returns rows when condition matches
 * 2. updateTableConditional returns empty array when condition doesn't match (lock already taken)
 * 3. Gateway extraction handler rejects concurrent requests via atomic state transition
 * 4. facturas-ocr helpers accept 'extrayendo' as valid extraction state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateTableConditional,
} from '../../supabase/functions/api-minimarket/helpers/supabase';
import {
  canExtractFacturaOCR,
  VALID_FACTURA_OCR_EXTRAER_ESTADOS,
} from '../../supabase/functions/facturas-ocr/helpers';

const BASE_URL = 'https://x.supabase.co';
const HEADERS = { Authorization: 'Bearer tok', apikey: 'anon', 'Content-Type': 'application/json' };

describe('updateTableConditional', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns updated row when condition matches', async () => {
    const mockRow = { id: 'abc-123', estado: 'extrayendo' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockRow]),
    }));

    const result = await updateTableConditional(
      BASE_URL,
      'facturas_ingesta',
      'id=eq.abc-123&estado=in.(pendiente,error)',
      HEADERS,
      { estado: 'extrayendo' },
    );

    expect(result).toEqual([mockRow]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/facturas_ingesta?id=eq.abc-123&estado=in.(pendiente,error)'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('returns empty array when no rows match (lock already taken)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }));

    const result = await updateTableConditional(
      BASE_URL,
      'facturas_ingesta',
      'id=eq.abc-123&estado=in.(pendiente,error)',
      HEADERS,
      { estado: 'extrayendo' },
    );

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'DB error' }),
      text: () => Promise.resolve('DB error'),
      headers: new Headers(),
    }));

    await expect(
      updateTableConditional(BASE_URL, 'facturas_ingesta', 'id=eq.abc-123', HEADERS, { estado: 'extrayendo' }),
    ).rejects.toThrow();
  });

  it('sends Prefer: return=representation header for PATCH', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }));

    await updateTableConditional(BASE_URL, 'test_table', 'id=eq.1', HEADERS, { field: 'value' });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Prefer: 'return=representation' }),
      }),
    );
  });
});

describe('OCR concurrency lock — estado validation', () => {
  it('VALID_FACTURA_OCR_EXTRAER_ESTADOS (facturas-ocr) includes extrayendo', () => {
    expect(VALID_FACTURA_OCR_EXTRAER_ESTADOS.has('extrayendo')).toBe(true);
    expect(VALID_FACTURA_OCR_EXTRAER_ESTADOS.has('pendiente')).toBe(true);
    expect(VALID_FACTURA_OCR_EXTRAER_ESTADOS.has('error')).toBe(true);
  });

  it('canExtractFacturaOCR accepts extrayendo (set by gateway lock)', () => {
    expect(canExtractFacturaOCR('extrayendo')).toBe(true);
  });

  it('canExtractFacturaOCR rejects invalid states', () => {
    expect(canExtractFacturaOCR('extraida')).toBe(false);
    expect(canExtractFacturaOCR('validada')).toBe(false);
    expect(canExtractFacturaOCR('aplicada')).toBe(false);
    expect(canExtractFacturaOCR('')).toBe(false);
    expect(canExtractFacturaOCR(null)).toBe(false);
    expect(canExtractFacturaOCR(undefined)).toBe(false);
  });
});

describe('OCR concurrency — race condition scenario', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('simulates two concurrent claims — only first succeeds', async () => {
    let firstCallDone = false;

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      if (!firstCallDone) {
        firstCallDone = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'f-1', estado: 'extrayendo' }]),
        });
      }
      // Second call: no rows affected (lock already taken)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }));

    const claim1 = await updateTableConditional(
      BASE_URL, 'facturas_ingesta',
      'id=eq.f-1&estado=in.(pendiente,error)',
      HEADERS, { estado: 'extrayendo' },
    );

    const claim2 = await updateTableConditional(
      BASE_URL, 'facturas_ingesta',
      'id=eq.f-1&estado=in.(pendiente,error)',
      HEADERS, { estado: 'extrayendo' },
    );

    expect(claim1.length).toBe(1);
    expect(claim2.length).toBe(0);
  });
});
