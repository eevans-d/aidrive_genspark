/**
 * Unit tests for api-minimarket insights handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

// Mock supabase helpers
vi.mock('../../supabase/functions/api-minimarket/helpers/supabase.ts', () => ({
  fetchWithParams: vi.fn(),
  queryTable: vi.fn(),
  queryTableWithCount: vi.fn(),
  insertTable: vi.fn(),
  updateTable: vi.fn(),
  callFunction: vi.fn(),
  buildQueryUrl: vi.fn(),
}));

import {
  handleInsightsArbitraje,
  handleInsightsCompras,
  handleInsightsProducto,
} from '../../supabase/functions/api-minimarket/handlers/insights.ts';
import { fetchWithParams } from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

const SUPABASE_URL = 'https://test.supabase.co';
const mockHeaders = { Authorization: 'Bearer test-token', apikey: 'test-key' };
const responseHeaders = { 'x-request-id': 'req-1' };
const requestId = 'req-1';

describe('api-minimarket/handlers/insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleInsightsArbitraje()', () => {
    it('returns arbitrage data with count', async () => {
      const mockRows = [
        { producto_id: '1', riesgo_perdida: true, margen_bajo: false, margen_vs_reposicion: -5 },
        { producto_id: '2', riesgo_perdida: false, margen_bajo: true, margen_vs_reposicion: 3 },
      ];
      (fetchWithParams as any).mockResolvedValue({ data: mockRows });

      const response = await handleInsightsArbitraje(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.count).toBe(2);
    });

    it('queries vista_arbitraje_producto with correct filters', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [] });

      await handleInsightsArbitraje(SUPABASE_URL, mockHeaders, responseHeaders, requestId);

      const callArgs = (fetchWithParams as any).mock.calls[0];
      expect(callArgs[1]).toBe('vista_arbitraje_producto');
      const params = callArgs[2] as URLSearchParams;
      expect(params.get('or')).toBe('(riesgo_perdida.eq.true,margen_bajo.eq.true)');
      expect(params.get('limit')).toBe('50');
    });

    it('propagates errors', async () => {
      (fetchWithParams as any).mockRejectedValue(new Error('DB_ERROR'));

      await expect(
        handleInsightsArbitraje(SUPABASE_URL, mockHeaders, responseHeaders, requestId),
      ).rejects.toThrow('DB_ERROR');
    });
  });

  describe('handleInsightsCompras()', () => {
    it('returns purchase opportunities', async () => {
      const mockRows = [
        { producto_id: '1', nivel_stock: 'bajo', delta_costo_pct: -15 },
      ];
      (fetchWithParams as any).mockResolvedValue({ data: mockRows });

      const response = await handleInsightsCompras(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('queries vista_oportunidades_compra', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [] });

      await handleInsightsCompras(SUPABASE_URL, mockHeaders, responseHeaders, requestId);

      const callArgs = (fetchWithParams as any).mock.calls[0];
      expect(callArgs[1]).toBe('vista_oportunidades_compra');
    });

    it('propagates errors', async () => {
      (fetchWithParams as any).mockRejectedValue(new Error('FETCH_FAIL'));

      await expect(
        handleInsightsCompras(SUPABASE_URL, mockHeaders, responseHeaders, requestId),
      ).rejects.toThrow('FETCH_FAIL');
    });
  });

  describe('handleInsightsProducto()', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 400 for invalid UUID', async () => {
      const response = await handleInsightsProducto(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        'not-a-uuid',
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when product not found', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [] });

      const response = await handleInsightsProducto(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        validId,
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns product arbitrage data on success', async () => {
      const mockRow = {
        producto_id: validId,
        nombre_producto: 'Test',
        riesgo_perdida: false,
        margen_bajo: true,
      };
      (fetchWithParams as any).mockResolvedValue({ data: [mockRow] });

      const response = await handleInsightsProducto(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        validId,
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.producto_id).toBe(validId);
    });

    it('queries with producto_id filter and limit 1', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [] });

      await handleInsightsProducto(SUPABASE_URL, mockHeaders, responseHeaders, requestId, validId);

      const callArgs = (fetchWithParams as any).mock.calls[0];
      const params = callArgs[2] as URLSearchParams;
      expect(params.get('producto_id')).toBe(`eq.${validId}`);
      expect(params.get('limit')).toBe('1');
    });

    it('propagates errors', async () => {
      (fetchWithParams as any).mockRejectedValue(new Error('DB_ERROR'));

      await expect(
        handleInsightsProducto(SUPABASE_URL, mockHeaders, responseHeaders, requestId, validId),
      ).rejects.toThrow('DB_ERROR');
    });
  });
});
