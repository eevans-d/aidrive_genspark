/**
 * Unit tests for api-minimarket cuentas_corrientes handlers.
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
  handleResumenCC,
  handleListarSaldosCC,
  handleRegistrarPagoCC,
} from '../../supabase/functions/api-minimarket/handlers/cuentas_corrientes.ts';
import {
  queryTable,
  fetchWithParams,
  callFunction,
} from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

// Import AppError for error simulation
import { AppError } from '../../supabase/functions/_shared/errors.ts';

const SUPABASE_URL = 'https://test.supabase.co';
const mockHeaders = { Authorization: 'Bearer test-token', apikey: 'test-key' };
const responseHeaders = { 'x-request-id': 'req-1' };
const requestId = 'req-1';

describe('api-minimarket/handlers/cuentas_corrientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleResumenCC()', () => {
    it('returns resumen data from vista_cc_resumen', async () => {
      const mockResumen = { total_clientes: 10, total_deuda: 5000, total_pagos: 3000 };
      (queryTable as any).mockResolvedValue([mockResumen]);

      const response = await handleResumenCC(SUPABASE_URL, mockHeaders, responseHeaders, requestId);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.total_clientes).toBe(10);
    });

    it('returns empty object when no data', async () => {
      (queryTable as any).mockResolvedValue([]);

      const response = await handleResumenCC(SUPABASE_URL, mockHeaders, responseHeaders, requestId);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual({});
    });

    it('queries vista_cc_resumen with limit 1', async () => {
      (queryTable as any).mockResolvedValue([{}]);

      await handleResumenCC(SUPABASE_URL, mockHeaders, responseHeaders, requestId);

      const callArgs = (queryTable as any).mock.calls[0];
      expect(callArgs[1]).toBe('vista_cc_resumen');
      expect(callArgs[4]).toBe('*');
      expect(callArgs[5]).toEqual({ limit: 1, offset: 0 });
    });

    it('propagates errors', async () => {
      (queryTable as any).mockRejectedValue(new Error('DB_ERROR'));

      await expect(
        handleResumenCC(SUPABASE_URL, mockHeaders, responseHeaders, requestId),
      ).rejects.toThrow('DB_ERROR');
    });
  });

  describe('handleListarSaldosCC()', () => {
    it('returns saldos list', async () => {
      const mockSaldos = [
        { cliente_id: '1', nombre: 'Cliente A', saldo: 500 },
        { cliente_id: '2', nombre: 'Cliente B', saldo: 1000 },
      ];
      (fetchWithParams as any).mockResolvedValue({ data: mockSaldos, count: 2 });

      const response = await handleListarSaldosCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { limit: 20, offset: 0 },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.count).toBe(2);
    });

    it('applies search filter when q >= 2 chars', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [], count: 0 });

      await handleListarSaldosCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { q: 'Juan', limit: 20, offset: 0 },
      );

      const callArgs = (fetchWithParams as any).mock.calls[0];
      const params = callArgs[2] as URLSearchParams;
      expect(params.get('or')).toContain('Juan');
    });

    it('ignores query shorter than 2 chars', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [], count: 0 });

      await handleListarSaldosCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { q: 'J', limit: 20, offset: 0 },
      );

      const callArgs = (fetchWithParams as any).mock.calls[0];
      const params = callArgs[2] as URLSearchParams;
      expect(params.has('or')).toBe(false);
    });

    it('adds solo_deuda filter', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [], count: 0 });

      await handleListarSaldosCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { solo_deuda: true, limit: 20, offset: 0 },
      );

      const callArgs = (fetchWithParams as any).mock.calls[0];
      const params = callArgs[2] as URLSearchParams;
      expect(params.get('saldo')).toBe('gt.0');
    });

    it('handles null query parameter', async () => {
      (fetchWithParams as any).mockResolvedValue({ data: [], count: 0 });

      const response = await handleListarSaldosCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { q: null, limit: 10, offset: 0 },
      );

      expect(response.status).toBe(200);
    });

    it('propagates errors', async () => {
      (fetchWithParams as any).mockRejectedValue(new Error('FETCH_ERROR'));

      await expect(
        handleListarSaldosCC(SUPABASE_URL, mockHeaders, responseHeaders, requestId, {
          limit: 20,
          offset: 0,
        }),
      ).rejects.toThrow('FETCH_ERROR');
    });
  });

  describe('handleRegistrarPagoCC()', () => {
    const validClienteId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 400 for invalid cliente_id', async () => {
      const response = await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: 'not-uuid', monto: 100 },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('cliente_id');
    });

    it('returns 400 for non-string cliente_id', async () => {
      const response = await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: 123, monto: 100 },
      );

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid monto', async () => {
      const response = await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: -50 },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain('monto');
    });

    it('returns 400 for zero monto', async () => {
      const response = await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: 0 },
      );

      expect(response.status).toBe(400);
    });

    it('registers payment successfully', async () => {
      const mockResult = { success: true, nuevo_saldo: 400 };
      (callFunction as any).mockResolvedValue(mockResult);

      const response = await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: 100, descripcion: 'Pago parcial' },
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('calls sp_registrar_pago_cc with correct payload', async () => {
      (callFunction as any).mockResolvedValue({});

      await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: 250.50, descripcion: 'Test pago' },
      );

      const callArgs = (callFunction as any).mock.calls[0];
      expect(callArgs[1]).toBe('sp_registrar_pago_cc');
      expect(callArgs[3].payload.cliente_id).toBe(validClienteId);
      expect(callArgs[3].payload.monto).toBe(250.50);
      expect(callArgs[3].payload.descripcion).toBe('Test pago');
    });

    it('sets descripcion to null when empty', async () => {
      (callFunction as any).mockResolvedValue({});

      await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: 100, descripcion: '  ' },
      );

      const callArgs = (callFunction as any).mock.calls[0];
      expect(callArgs[3].payload.descripcion).toBeNull();
    });

    it('sets descripcion to null when not provided', async () => {
      (callFunction as any).mockResolvedValue({});

      await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: 100 },
      );

      const callArgs = (callFunction as any).mock.calls[0];
      expect(callArgs[3].payload.descripcion).toBeNull();
    });

    it('returns 404 when SP raises CLIENTE_NO_ENCONTRADO', async () => {
      const error = new AppError('CLIENTE_NO_ENCONTRADO', 'RAISE_EXCEPTION', 400);
      (callFunction as any).mockRejectedValue(error);

      const response = await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: 100 },
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 when SP raises MONTO_INVALIDO', async () => {
      const error = new AppError('MONTO_INVALIDO', 'RAISE_EXCEPTION', 400);
      (callFunction as any).mockRejectedValue(error);

      const response = await handleRegistrarPagoCC(
        SUPABASE_URL,
        mockHeaders,
        responseHeaders,
        requestId,
        { cliente_id: validClienteId, monto: 100 },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('propagates unknown errors', async () => {
      (callFunction as any).mockRejectedValue(new Error('UNKNOWN_ERROR'));

      await expect(
        handleRegistrarPagoCC(
          SUPABASE_URL,
          mockHeaders,
          responseHeaders,
          requestId,
          { cliente_id: validClienteId, monto: 100 },
        ),
      ).rejects.toThrow('UNKNOWN_ERROR');
    });
  });
});
