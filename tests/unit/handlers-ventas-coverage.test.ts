/**
 * Coverage tests for handlers/ventas.ts
 * Covers: handleListarVentas, handleObtenerVenta
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Deno.env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

import {
  handleListarVentas,
  handleObtenerVenta,
} from '../../supabase/functions/api-minimarket/handlers/ventas';

const BASE_URL = 'https://x.supabase.co';
const HEADERS = { Authorization: 'Bearer tok', apikey: 'anon', 'Content-Type': 'application/json' };
const RESP_HEADERS = { 'x-request-id': 'req1' };

describe('handleListarVentas', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns list without date filters', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 'v1', monto_total: 100 }]), {
        status: 200,
        headers: { 'content-range': '0-0/1' },
      }),
    );

    const resp = await handleListarVentas(
      BASE_URL, HEADERS, RESP_HEADERS, 'req1',
      { limit: 10, offset: 0 },
    );
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.data).toEqual([{ id: 'v1', monto_total: 100 }]);
  });

  it('returns list with date filters', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 'v2' }]), {
        status: 200,
        headers: { 'content-range': '0-0/5' },
      }),
    );

    const resp = await handleListarVentas(
      BASE_URL, HEADERS, RESP_HEADERS, 'req2',
      { limit: 10, offset: 0, fecha_desde: '2026-01-01', fecha_hasta: '2026-12-31' },
    );
    expect(resp.status).toBe(200);
  });

  it('returns list with only fecha_desde', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-range': '*/0' },
      }),
    );

    const resp = await handleListarVentas(
      BASE_URL, HEADERS, RESP_HEADERS, 'req3',
      { limit: 10, offset: 0, fecha_desde: '2026-01-01' },
    );
    expect(resp.status).toBe(200);
  });

  it('throws on fetch error with dates', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('DB Error', { status: 500 }),
    );

    await expect(
      handleListarVentas(
        BASE_URL, HEADERS, RESP_HEADERS, 'req4',
        { limit: 10, offset: 0, fecha_desde: '2026-01-01' },
      ),
    ).rejects.toThrow();
  });
});

describe('handleObtenerVenta', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns venta detail for valid UUID', async () => {
    const ventaId = '123e4567-e89b-12d3-a456-426614174000';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([{ id: ventaId, monto_total: 500, venta_items: [] }]),
        { status: 200 },
      ),
    );

    const resp = await handleObtenerVenta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req5', ventaId,
    );
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.data.id).toBe(ventaId);
  });

  it('returns 400 for invalid UUID', async () => {
    const resp = await handleObtenerVenta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req6', 'not-a-uuid',
    );
    expect(resp.status).toBe(400);
  });

  it('returns 404 when venta not found', async () => {
    const ventaId = '123e4567-e89b-12d3-a456-426614174001';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const resp = await handleObtenerVenta(
      BASE_URL, HEADERS, RESP_HEADERS, 'req7', ventaId,
    );
    expect(resp.status).toBe(404);
  });

  it('throws on fetch error', async () => {
    const ventaId = '123e4567-e89b-12d3-a456-426614174002';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('DB Error'));

    await expect(
      handleObtenerVenta(BASE_URL, HEADERS, RESP_HEADERS, 'req8', ventaId),
    ).rejects.toThrow('DB Error');
  });
});
