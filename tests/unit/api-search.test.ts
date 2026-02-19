/**
 * Unit tests for api-minimarket search handler.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

// Mock the supabase helpers
vi.mock('../../supabase/functions/api-minimarket/helpers/supabase.ts', () => ({
  fetchWithParams: vi.fn(),
  queryTable: vi.fn(),
  queryTableWithCount: vi.fn(),
  insertTable: vi.fn(),
  updateTable: vi.fn(),
  callFunction: vi.fn(),
  buildQueryUrl: vi.fn(),
}));

import { handleGlobalSearch } from '../../supabase/functions/api-minimarket/handlers/search.ts';
import { fetchWithParams } from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

const SUPABASE_URL = 'https://test.supabase.co';
const mockHeaders: Record<string, string> = { Authorization: 'Bearer test-token', apikey: 'test-key' };
const responseHeaders: Record<string, string> = { 'x-request-id': 'test-req-id' };
const requestId = 'test-req-id';

describe('api-minimarket/handlers/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleGlobalSearch()', () => {
    it('rejects queries shorter than 2 characters', async () => {
      const response = await handleGlobalSearch(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        'a',
        10,
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects empty query string', async () => {
      const response = await handleGlobalSearch(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        '',
        10,
      );
      expect(response.status).toBe(400);
    });

    it('searches across all 5 entities in parallel', async () => {
      const mockFetch = fetchWithParams as unknown as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({ data: [], count: 0 });

      const response = await handleGlobalSearch(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        'coca',
        10,
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('productos');
      expect(body.data).toHaveProperty('proveedores');
      expect(body.data).toHaveProperty('tareas');
      expect(body.data).toHaveProperty('pedidos');
      expect(body.data).toHaveProperty('clientes');

      // 5 parallel calls, one per entity
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('caps limit to 10 per entity', async () => {
      const mockFetch = fetchWithParams as unknown as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({ data: [] });

      await handleGlobalSearch(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        'test',
        50, // large limit
      );

      // Verify each call uses limit=10 (the cap)
      for (const call of mockFetch.mock.calls) {
        const params = call[2] as URLSearchParams;
        expect(Number(params.get('limit'))).toBeLessThanOrEqual(10);
      }
    });

    it('returns data from all entity searches', async () => {
      const mockFetch = fetchWithParams as unknown as ReturnType<typeof vi.fn>;
      const mockProduct = { id: '1', nombre: 'Coca Cola', sku: 'CK001' };
      const mockProveedor = { id: '2', nombre: 'Coca SA' };

      // Return different data for each entity call
      mockFetch
        .mockResolvedValueOnce({ data: [mockProduct] }) // productos
        .mockResolvedValueOnce({ data: [mockProveedor] }) // proveedores
        .mockResolvedValueOnce({ data: [] }) // tareas
        .mockResolvedValueOnce({ data: [] }) // pedidos
        .mockResolvedValueOnce({ data: [] }); // clientes

      const response = await handleGlobalSearch(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        'coca',
        10,
      );

      const body = await response.json();
      expect(body.data.productos).toHaveLength(1);
      expect(body.data.proveedores).toHaveLength(1);
      expect(body.data.tareas).toHaveLength(0);
    });

    it('propagates fetch errors', async () => {
      const mockFetch = fetchWithParams as unknown as ReturnType<typeof vi.fn>;
      mockFetch.mockRejectedValue(new Error('DB_ERROR'));

      await expect(
        handleGlobalSearch(
          SUPABASE_URL,
          mockHeaders,
          responseHeaders,
          requestId,
          'test',
          10,
        ),
      ).rejects.toThrow('DB_ERROR');
    });
  });
});
