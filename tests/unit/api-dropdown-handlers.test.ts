/**
 * Unit tests for api-minimarket dropdown handlers (utils.ts).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

// Mock the supabase helpers
vi.mock('../../supabase/functions/api-minimarket/helpers/supabase.ts', () => ({
  queryTable: vi.fn(),
  fetchWithParams: vi.fn(),
  queryTableWithCount: vi.fn(),
  insertTable: vi.fn(),
  updateTable: vi.fn(),
  callFunction: vi.fn(),
  buildQueryUrl: vi.fn(),
}));

import { getProductosDropdown, getProveedoresDropdown } from '../../supabase/functions/api-minimarket/handlers/utils.ts';
import { queryTable } from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

const SUPABASE_URL = 'https://test.supabase.co';
const mockHeaders = { Authorization: 'Bearer test-token', apikey: 'test-key' };
const originHeaders = { 'x-request-id': 'req-1' };
const requestId = 'req-1';

describe('api-minimarket/handlers/utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProductosDropdown()', () => {
    it('returns 200 with product list', async () => {
      const mockData = [
        { id: '1', nombre: 'Coca Cola', sku: 'CK001', codigo_barras: '123', precio_actual: 500 },
        { id: '2', nombre: 'Pepsi', sku: 'PP001', codigo_barras: '456', precio_actual: 450 },
      ];
      (queryTable as any).mockResolvedValue(mockData);

      const response = await getProductosDropdown(
        SUPABASE_URL,
        mockHeaders,
        originHeaders,
        requestId,
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    it('queries productos table with correct select fields', async () => {
      (queryTable as any).mockResolvedValue([]);

      await getProductosDropdown(
        SUPABASE_URL,
        mockHeaders,
        originHeaders,
        requestId,
      );

      expect(queryTable).toHaveBeenCalledWith(
        SUPABASE_URL,
        'productos',
        mockHeaders,
        { activo: true },
        'id,nombre,sku,codigo_barras,precio_actual',
        { order: 'nombre', limit: 1000 },
      );
    });

    it('returns empty array when no products exist', async () => {
      (queryTable as any).mockResolvedValue([]);

      const response = await getProductosDropdown(
        SUPABASE_URL,
        mockHeaders,
        originHeaders,
        requestId,
      );

      const body = await response.json();
      expect(body.data).toEqual([]);
    });
  });

  describe('getProveedoresDropdown()', () => {
    it('returns 200 with provider list', async () => {
      const mockData = [
        { id: '1', nombre: 'Proveedor A' },
        { id: '2', nombre: 'Proveedor B' },
      ];
      (queryTable as any).mockResolvedValue(mockData);

      const response = await getProveedoresDropdown(
        SUPABASE_URL,
        mockHeaders,
        originHeaders,
        requestId,
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    it('queries proveedores table with id,nombre select', async () => {
      (queryTable as any).mockResolvedValue([]);

      await getProveedoresDropdown(
        SUPABASE_URL,
        mockHeaders,
        originHeaders,
        requestId,
      );

      expect(queryTable).toHaveBeenCalledWith(
        SUPABASE_URL,
        'proveedores',
        mockHeaders,
        { activo: true },
        'id,nombre',
        { order: 'nombre', limit: 1000 },
      );
    });
  });
});
