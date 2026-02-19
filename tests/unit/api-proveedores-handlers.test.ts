/**
 * Unit tests for api-minimarket proveedores handler.
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
  handleCrearProveedor,
  handleActualizarProveedor,
} from '../../supabase/functions/api-minimarket/handlers/proveedores.ts';
import {
  insertTable,
  updateTable,
} from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

const SUPABASE_URL = 'https://test.supabase.co';
const mockHeaders = { Authorization: 'Bearer test-token', apikey: 'test-key' };
const responseHeaders = { 'x-request-id': 'req-1' };
const requestId = 'req-1';

describe('api-minimarket/handlers/proveedores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleCrearProveedor()', () => {
    it('returns 400 when nombre is missing', async () => {
      const response = await handleCrearProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: '' },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('nombre');
    });

    it('creates proveedor successfully', async () => {
      const provData = { id: '1', nombre: 'Proveedor Test' };
      (insertTable as any).mockResolvedValue([provData]);

      const response = await handleCrearProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Proveedor Test', contacto: 'Juan', telefono: '123456' },
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.nombre).toBe('Proveedor Test');
    });

    it('validates activo must be boolean', async () => {
      const response = await handleCrearProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Test', activo: 'yes' as any },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain('boolean');
    });

    it('handles productos_ofrecidos array', async () => {
      (insertTable as any).mockResolvedValue([{ id: '1', nombre: 'Test' }]);

      await handleCrearProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Test', productos_ofrecidos: ['Prod A', '', 'Prod B', 123 as any] },
      );

      const callArgs = (insertTable as any).mock.calls[0];
      const payload = callArgs[3];
      // Should filter out empty strings and non-strings
      expect(payload.productos_ofrecidos).toEqual(['Prod A', 'Prod B']);
    });

    it('converts empty string fields to null', async () => {
      (insertTable as any).mockResolvedValue([{ id: '1', nombre: 'Test' }]);

      await handleCrearProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Test', email: '  ', telefono: ' 123 ' },
      );

      const callArgs = (insertTable as any).mock.calls[0];
      const payload = callArgs[3];
      expect(payload.email).toBeNull();
      expect(payload.telefono).toBe('123');
    });

    it('propagates DB errors', async () => {
      (insertTable as any).mockRejectedValue(new Error('DB_INSERT_FAIL'));

      await expect(
        handleCrearProveedor(
          SUPABASE_URL,
          mockHeaders,
          responseHeaders,
          requestId,
          { nombre: 'Test' },
        ),
      ).rejects.toThrow('DB_INSERT_FAIL');
    });
  });

  describe('handleActualizarProveedor()', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 400 for invalid UUID', async () => {
      const response = await handleActualizarProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        'not-a-uuid',
        { nombre: 'Updated' },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when no fields to update', async () => {
      const response = await handleActualizarProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        validId,
        {},
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain('No hay campos');
    });

    it('returns 400 when nombre is set to empty', async () => {
      const response = await handleActualizarProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        validId,
        { nombre: '   ' },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain('nombre');
    });

    it('returns 404 when proveedor not found', async () => {
      (updateTable as any).mockResolvedValue([]);

      const response = await handleActualizarProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        validId,
        { nombre: 'Updated' },
      );

      expect(response.status).toBe(404);
    });

    it('updates proveedor successfully', async () => {
      const updatedData = { id: validId, nombre: 'Updated Name' };
      (updateTable as any).mockResolvedValue([updatedData]);

      const response = await handleActualizarProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        validId,
        { nombre: 'Updated Name', cuit: '27-12345678-9' },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.nombre).toBe('Updated Name');
    });

    it('sets productos_ofrecidos to null when all items are empty/invalid', async () => {
      (updateTable as any).mockResolvedValue([{ id: validId }]);

      await handleActualizarProveedor(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        validId,
        { productos_ofrecidos: ['', '  ', 42 as any] },
      );

      const callArgs = (updateTable as any).mock.calls[0];
      const payload = callArgs[4];
      expect(payload.productos_ofrecidos).toBeNull();
    });
  });
});
