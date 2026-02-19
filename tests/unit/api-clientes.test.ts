/**
 * Unit tests for api-minimarket clientes handler.
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
  handleListarClientes,
  handleCrearCliente,
  handleActualizarCliente,
  handleResumenCuentaCorriente,
} from '../../supabase/functions/api-minimarket/handlers/clientes.ts';
import {
  fetchWithParams,
  insertTable,
  updateTable,
  queryTableWithCount,
} from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

const SUPABASE_URL = 'https://test.supabase.co';
const mockHeaders = { Authorization: 'Bearer test-token', apikey: 'test-key' };
const responseHeaders = { 'x-request-id': 'req-1' };
const requestId = 'req-1';

describe('api-minimarket/handlers/clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleListarClientes()', () => {
    it('returns 200 with client list', async () => {
      (fetchWithParams as any).mockResolvedValue({
        data: [{ cliente_id: '1', nombre: 'Juan' }],
        count: 1,
      });

      const response = await handleListarClientes(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { q: null, limit: 20, offset: 0 },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('applies search filter when q has 2+ chars', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [], count: 0 });

      await handleListarClientes(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { q: 'juan', limit: 20, offset: 0 },
      );

      const callArgs = (fetchWithParams as any).mock.calls[0];
      const params = callArgs[2] as URLSearchParams;
      expect(params.get('or')).toContain('juan');
    });

    it('does not apply search filter for short queries', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [], count: 0 });

      await handleListarClientes(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { q: 'j', limit: 20, offset: 0 },
      );

      const callArgs = (fetchWithParams as any).mock.calls[0];
      const params = callArgs[2] as URLSearchParams;
      expect(params.has('or')).toBe(false);
    });

    it('propagates errors', async () => {
      (fetchWithParams as any).mockRejectedValue(new Error('DB_FAIL'));

      await expect(
        handleListarClientes(
          SUPABASE_URL,
          mockHeaders,
          responseHeaders,
          requestId,
          { q: null, limit: 20, offset: 0 },
        ),
      ).rejects.toThrow('DB_FAIL');
    });
  });

  describe('handleCrearCliente()', () => {
    it('returns 400 when nombre is missing', async () => {
      const response = await handleCrearCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: '' },
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 201 when creating a valid client', async () => {
      const clienteData = { id: '1', nombre: 'Juan Perez' };
      (insertTable as any).mockResolvedValue([clienteData]);

      const response = await handleCrearCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Juan Perez', telefono: '123456' },
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('returns 403 when non-admin tries to set limite_credito', async () => {
      const response = await handleCrearCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Juan', limite_credito: 5000 },
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to set limite_credito', async () => {
      (insertTable as any).mockResolvedValue([{ id: '1', nombre: 'Juan', limite_credito: 5000 }]);

      const response = await handleCrearCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Juan', limite_credito: 5000 },
        { allowLimiteCredito: true },
      );

      expect(response.status).toBe(201);
    });

    it('validates activo must be boolean', async () => {
      const response = await handleCrearCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Juan', activo: 'yes' as any },
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain('boolean');
    });

    it('validates limite_credito must be a non-negative number', async () => {
      const response = await handleCrearCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { nombre: 'Juan', limite_credito: 'abc' as any },
        { allowLimiteCredito: true },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain('limite_credito');
    });
  });

  describe('handleActualizarCliente()', () => {
    it('returns 400 for invalid UUID', async () => {
      const response = await handleActualizarCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        'not-a-uuid',
        { nombre: 'Updated' },
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when no fields to update', async () => {
      const response = await handleActualizarCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        '550e8400-e29b-41d4-a716-446655440000',
        {},
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain('No hay campos');
    });

    it('returns 404 when client not found', async () => {
      (updateTable as any).mockResolvedValue([]);

      const response = await handleActualizarCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        '550e8400-e29b-41d4-a716-446655440000',
        { nombre: 'Updated' },
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(404);
    });

    it('returns 200 on successful update', async () => {
      const updatedData = { id: '550e8400-e29b-41d4-a716-446655440000', nombre: 'Juan Updated' };
      (updateTable as any).mockResolvedValue([updatedData]);

      const response = await handleActualizarCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        '550e8400-e29b-41d4-a716-446655440000',
        { nombre: 'Juan Updated' },
        { allowLimiteCredito: false },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('allows setting limite_credito to null', async () => {
      const updatedData = { id: '550e8400-e29b-41d4-a716-446655440000', nombre: 'Juan', limite_credito: null };
      (updateTable as any).mockResolvedValue([updatedData]);

      const response = await handleActualizarCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        '550e8400-e29b-41d4-a716-446655440000',
        { limite_credito: null },
        { allowLimiteCredito: true },
      );

      expect(response.status).toBe(200);
    });

    it('trims string fields and converts empty to null', async () => {
      (updateTable as any).mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }]);

      await handleActualizarCliente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        '550e8400-e29b-41d4-a716-446655440000',
        { telefono: '  ', email: '  test@test.com  ' },
        { allowLimiteCredito: false },
      );

      const callArgs = (updateTable as any).mock.calls[0];
      const patch = callArgs[4];
      expect(patch.telefono).toBeNull(); // empty after trim -> null
      expect(patch.email).toBe('test@test.com'); // trimmed
    });
  });

  describe('handleResumenCuentaCorriente()', () => {
    it('returns 200 with summary data', async () => {
      const summaryData = { total_deuda: 50000, clientes_con_deuda: 5 };
      (queryTableWithCount as any).mockResolvedValue({
        data: [summaryData],
        count: 1,
      });

      const response = await handleResumenCuentaCorriente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('returns empty object when no data', async () => {
      (queryTableWithCount as any).mockResolvedValue({ data: [], count: 0 });

      const response = await handleResumenCuentaCorriente(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
      );

      const body = await response.json();
      expect(body.data).toEqual({});
    });
  });
});
