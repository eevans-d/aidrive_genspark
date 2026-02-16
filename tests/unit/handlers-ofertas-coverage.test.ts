/**
 * Coverage tests for handlers/ofertas.ts
 * Covers: handleListarOfertasSugeridas, handleAplicarOferta, handleDesactivarOferta
 * Focus on branch coverage (error paths, validation branches)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

import {
  handleListarOfertasSugeridas,
  handleAplicarOferta,
  handleDesactivarOferta,
} from '../../supabase/functions/api-minimarket/handlers/ofertas';
import { AppError } from '../../supabase/functions/_shared/errors';

const BASE_URL = 'https://x.supabase.co';
const HEADERS = { Authorization: 'Bearer tok', apikey: 'anon', 'Content-Type': 'application/json' };
const RESP_HEADERS = { 'x-request-id': 'req1' };
const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('handleListarOfertasSugeridas', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns rows on success', async () => {
    const mockQuery = vi.fn().mockResolvedValue([{ id: 1 }]);
    const resp = await handleListarOfertasSugeridas(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { queryTableImpl: mockQuery },
    );
    expect(resp.status).toBe(200);
  });

  it('throws on query error', async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error('DB error'));
    await expect(
      handleListarOfertasSugeridas(BASE_URL, HEADERS, RESP_HEADERS, 'req1', { queryTableImpl: mockQuery }),
    ).rejects.toThrow('DB error');
  });
});

describe('handleAplicarOferta', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('applies oferta successfully', async () => {
    const mockCall = vi.fn().mockResolvedValue({ ok: true });
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: 25 },
      { callFunctionImpl: mockCall },
    );
    expect(resp.status).toBe(201);
  });

  it('uses default descuento when not provided', async () => {
    const mockCall = vi.fn().mockResolvedValue({ ok: true });
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID },
      { callFunctionImpl: mockCall },
    );
    expect(resp.status).toBe(201);
    expect(mockCall.mock.calls[0][3].p_descuento_pct).toBe(30);
  });

  it('uses default descuento when null', async () => {
    const mockCall = vi.fn().mockResolvedValue({ ok: true });
    await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: null },
      { callFunctionImpl: mockCall },
    );
    expect(mockCall.mock.calls[0][3].p_descuento_pct).toBe(30);
  });

  it('uses default descuento when empty string', async () => {
    const mockCall = vi.fn().mockResolvedValue({ ok: true });
    await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: '' },
      { callFunctionImpl: mockCall },
    );
    expect(mockCall.mock.calls[0][3].p_descuento_pct).toBe(30);
  });

  it('returns 400 for invalid stock_id', async () => {
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: 'bad' },
    );
    expect(resp.status).toBe(400);
  });

  it('returns 400 for missing stock_id', async () => {
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      {},
    );
    expect(resp.status).toBe(400);
  });

  it('returns 400 for descuento = 0', async () => {
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: 0 },
    );
    expect(resp.status).toBe(400);
  });

  it('returns 400 for descuento >= 100', async () => {
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: 100 },
    );
    expect(resp.status).toBe(400);
  });

  it('returns 400 for negative descuento', async () => {
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: -5 },
    );
    expect(resp.status).toBe(400);
  });

  it('handles STOCK_NO_ENCONTRADO error', async () => {
    const mockCall = vi.fn().mockRejectedValue(
      new AppError('STOCK_NO_ENCONTRADO', 'RAISE_EXCEPTION', 500),
    );
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: 20 },
      { callFunctionImpl: mockCall },
    );
    expect(resp.status).toBe(404);
  });

  it('handles PRECIO_BASE_INVALIDO error', async () => {
    const mockCall = vi.fn().mockRejectedValue(
      new AppError('PRECIO_BASE_INVALIDO', 'RAISE_EXCEPTION', 500),
    );
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: 20 },
      { callFunctionImpl: mockCall },
    );
    expect(resp.status).toBe(409);
  });

  it('handles DESCUENTO_INVALIDO error', async () => {
    const mockCall = vi.fn().mockRejectedValue(
      new AppError('DESCUENTO_INVALIDO', 'RAISE_EXCEPTION', 500),
    );
    const resp = await handleAplicarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { stock_id: VALID_UUID, descuento_pct: 20 },
      { callFunctionImpl: mockCall },
    );
    expect(resp.status).toBe(400);
  });

  it('re-throws non-RAISE_EXCEPTION errors', async () => {
    const mockCall = vi.fn().mockRejectedValue(new Error('Unexpected'));
    await expect(
      handleAplicarOferta(
        BASE_URL, HEADERS, RESP_HEADERS, 'req1',
        { stock_id: VALID_UUID, descuento_pct: 20 },
        { callFunctionImpl: mockCall },
      ),
    ).rejects.toThrow('Unexpected');
  });
});

describe('handleDesactivarOferta', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('deactivates oferta successfully', async () => {
    const mockCall = vi.fn().mockResolvedValue({ ok: true });
    const resp = await handleDesactivarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1', VALID_UUID,
      { callFunctionImpl: mockCall },
    );
    expect(resp.status).toBe(200);
  });

  it('returns 400 for invalid oferta ID', async () => {
    const resp = await handleDesactivarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1', 'not-uuid',
    );
    expect(resp.status).toBe(400);
  });

  it('handles NOT_FOUND error', async () => {
    const mockCall = vi.fn().mockRejectedValue(
      new AppError('NOT_FOUND', 'RAISE_EXCEPTION', 500),
    );
    const resp = await handleDesactivarOferta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1', VALID_UUID,
      { callFunctionImpl: mockCall },
    );
    expect(resp.status).toBe(404);
  });

  it('re-throws other errors', async () => {
    const mockCall = vi.fn().mockRejectedValue(new Error('DB Error'));
    await expect(
      handleDesactivarOferta(
        BASE_URL, HEADERS, RESP_HEADERS, 'req1', VALID_UUID,
        { callFunctionImpl: mockCall },
      ),
    ).rejects.toThrow('DB Error');
  });
});
