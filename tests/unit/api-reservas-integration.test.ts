/**
 * Extended integration tests for POST /reservas handler.
 * Covers: 409 INSUFFICIENT_STOCK, 503 RESERVA_UNAVAILABLE,
 * validation errors, default deposito, referencia trimming.
 *
 * (Complementa api-reservas-concurrencia.test.ts que valida idempotencia + concurrencia)
 */

import { describe, it, expect, vi } from 'vitest';
import { ok, fail } from '../../supabase/functions/_shared/response';
import { AppError } from '../../supabase/functions/_shared/errors';
import { handleCreateReserva } from '../../supabase/functions/api-minimarket/handlers/reservas';

function createResponders(requestId: string) {
  const responseHeaders: Record<string, string> = { 'x-request-id': requestId };

  const respondOk = <T>(data: T, status = 200, options: { message?: string; extra?: Record<string, unknown> } = {}) =>
    ok(data, status, responseHeaders, { requestId, ...options });

  const respondFail = (
    code: string,
    message: string,
    status = 400,
    options: { details?: unknown; message?: string; extra?: Record<string, unknown> } = {},
  ) => fail(code, message, status, responseHeaders, { requestId, ...options });

  return { respondOk, respondFail };
}

const baseInput = (overrides: Record<string, unknown> = {}) => ({
  supabaseUrl: 'https://test.supabase.co',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  requestId: 'req-test',
  clientIp: '127.0.0.1',
  body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 1 },
  idempotencyKeyRaw: 'idem-test-1',
  requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
  ...createResponders('req-test'),
  ...overrides,
});

describe('POST /reservas — 409 INSUFFICIENT_STOCK', () => {
  it('returns 409 when RPC raises INSUFFICIENT_STOCK', async () => {
    const callFunctionImpl = vi.fn().mockRejectedValue(
      new AppError('INSUFFICIENT_STOCK', 'RAISE_EXCEPTION', 400)
    );

    const res = await handleCreateReserva(baseInput(), { callFunctionImpl });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INSUFFICIENT_STOCK');
    expect(json.error.message).toContain('insuficiente');
  });
});

describe('POST /reservas — 503 RESERVA_UNAVAILABLE', () => {
  it('returns 503 when RPC function is missing (UNDEFINED_FUNCTION)', async () => {
    const callFunctionImpl = vi.fn().mockRejectedValue(
      new AppError('sp_reservar_stock does not exist', 'UNDEFINED_FUNCTION', 404)
    );

    const res = await handleCreateReserva(baseInput(), { callFunctionImpl });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('RESERVA_UNAVAILABLE');
  });

  it('returns 503 when PostgREST returns PGRST301 (not found)', async () => {
    const callFunctionImpl = vi.fn().mockRejectedValue(
      new AppError('Could not find the function', 'POSTGREST_NOT_FOUND', 404)
    );

    const res = await handleCreateReserva(baseInput(), { callFunctionImpl });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe('RESERVA_UNAVAILABLE');
  });
});

describe('POST /reservas — Validation errors', () => {
  it('rejects invalid producto_id (not UUID)', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleCreateReserva(
      baseInput({ body: { producto_id: 'not-a-uuid', cantidad: 1 } }),
      { callFunctionImpl }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('producto_id');
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });

  it('rejects missing producto_id', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleCreateReserva(
      baseInput({ body: { cantidad: 1 } }),
      { callFunctionImpl }
    );

    expect(res.status).toBe(400);
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });

  it('rejects cantidad <= 0', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleCreateReserva(
      baseInput({ body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 0 } }),
      { callFunctionImpl }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('cantidad');
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });

  it('rejects non-numeric cantidad', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleCreateReserva(
      baseInput({ body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 'abc' } }),
      { callFunctionImpl }
    );

    expect(res.status).toBe(400);
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });

  it('rejects fractional cantidad', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleCreateReserva(
      baseInput({ body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 1.5 } }),
      { callFunctionImpl }
    );

    expect(res.status).toBe(400);
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });

  it('rejects empty Idempotency-Key (whitespace only)', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleCreateReserva(
      baseInput({ idempotencyKeyRaw: '   ' }),
      { callFunctionImpl }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });
});

describe('POST /reservas — Defaults and trimming', () => {
  it('defaults deposito to Principal when not provided', async () => {
    const callFunctionImpl = vi.fn().mockResolvedValue({
      reserva: { id: 'res-1' },
      idempotent: false,
      stock_disponible: 5,
    });

    await handleCreateReserva(
      baseInput({ body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 1 } }),
      { callFunctionImpl }
    );

    const args = callFunctionImpl.mock.calls[0]!;
    expect(args[3].p_deposito).toBe('Principal');
  });

  it('defaults deposito to Principal when empty string', async () => {
    const callFunctionImpl = vi.fn().mockResolvedValue({
      reserva: { id: 'res-1' },
      idempotent: false,
      stock_disponible: 5,
    });

    await handleCreateReserva(
      baseInput({ body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 1, deposito: '' } }),
      { callFunctionImpl }
    );

    expect(callFunctionImpl.mock.calls[0]![3].p_deposito).toBe('Principal');
  });

  it('uses custom deposito when provided', async () => {
    const callFunctionImpl = vi.fn().mockResolvedValue({
      reserva: { id: 'res-1' },
      idempotent: false,
      stock_disponible: 5,
    });

    await handleCreateReserva(
      baseInput({ body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 1, deposito: 'Sucursal-B' } }),
      { callFunctionImpl }
    );

    expect(callFunctionImpl.mock.calls[0]![3].p_deposito).toBe('Sucursal-B');
  });

  it('uses null referencia when not provided', async () => {
    const callFunctionImpl = vi.fn().mockResolvedValue({
      reserva: { id: 'res-1' },
      idempotent: false,
      stock_disponible: 5,
    });

    await handleCreateReserva(
      baseInput({ body: { producto_id: '550e8400-e29b-41d4-a716-446655440001', cantidad: 1 } }),
      { callFunctionImpl }
    );

    expect(callFunctionImpl.mock.calls[0]![3].p_referencia).toBeNull();
  });

  it('trims idempotency key', async () => {
    const callFunctionImpl = vi.fn().mockResolvedValue({
      reserva: { id: 'res-1' },
      idempotent: false,
      stock_disponible: 5,
    });

    await handleCreateReserva(
      baseInput({ idempotencyKeyRaw: '  idem-trimmed  ' }),
      { callFunctionImpl }
    );

    expect(callFunctionImpl.mock.calls[0]![3].p_idempotency_key).toBe('idem-trimmed');
  });
});

describe('POST /reservas — Unexpected errors bubble up', () => {
  it('re-throws unexpected errors', async () => {
    const callFunctionImpl = vi.fn().mockRejectedValue(
      new Error('Unexpected DB timeout')
    );

    await expect(
      handleCreateReserva(baseInput(), { callFunctionImpl })
    ).rejects.toThrow('Unexpected DB timeout');
  });
});
