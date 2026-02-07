/**
 * Tests de concurrencia e idempotencia para POST /reservas.
 *
 * Nota: este suite valida la lógica del handler (request -> RPC -> response).
 * La concurrencia real y no-stock-negativo se garantiza en DB vía `sp_reservar_stock`.
 */

import { describe, it, expect, vi } from 'vitest';
import { ok, fail } from '../../supabase/functions/_shared/response';
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

describe('POST /reservas handler (idempotency + concurrency)', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const productoId = '550e8400-e29b-41d4-a716-446655440001';

  it('rechaza request sin Idempotency-Key', async () => {
    const { respondOk, respondFail } = createResponders('req-1');

    const callFunctionImpl = vi.fn();

    const res = await handleCreateReserva(
      {
        supabaseUrl,
        userId,
        requestId: 'req-1',
        clientIp: '127.0.0.1',
        body: { producto_id: productoId, cantidad: 2, deposito: 'Principal' },
        idempotencyKeyRaw: null,
        requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
        respondOk,
        respondFail,
      },
      { callFunctionImpl },
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });

  it('propaga Idempotency-Key a sp_reservar_stock y retorna 201 cuando no es idempotente', async () => {
    const { respondOk, respondFail } = createResponders('req-2');

    const callFunctionImpl = vi.fn().mockResolvedValue({
      reserva: { id: 'res-1' },
      idempotent: false,
      stock_disponible: 10,
    });

    const res = await handleCreateReserva(
      {
        supabaseUrl,
        userId,
        requestId: 'req-2',
        clientIp: '127.0.0.1',
        body: { producto_id: productoId, cantidad: 3, referencia: 'ticket-123', deposito: 'Principal' },
        idempotencyKeyRaw: ' idem-123 ',
        requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
        respondOk,
        respondFail,
      },
      { callFunctionImpl },
    );

    expect(callFunctionImpl).toHaveBeenCalledTimes(1);
    const args = callFunctionImpl.mock.calls[0];
    expect(args[0]).toBe(supabaseUrl);
    expect(args[1]).toBe('sp_reservar_stock');
    expect(args[3]).toMatchObject({
      p_producto_id: productoId,
      p_cantidad: 3,
      p_usuario: userId,
      p_referencia: 'ticket-123',
      p_deposito: 'Principal',
      p_idempotency_key: 'idem-123',
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toMatchObject({ id: 'res-1' });
    expect(json.idempotent).toBe(false);
    expect(json.stock_disponible).toBe(10);
  });

  it('retorna 200 cuando la reserva es idempotente', async () => {
    const { respondOk, respondFail } = createResponders('req-3');

    const callFunctionImpl = vi.fn().mockResolvedValue({
      reserva: { id: 'res-1' },
      idempotent: true,
      stock_disponible: 7,
    });

    const res = await handleCreateReserva(
      {
        supabaseUrl,
        userId,
        requestId: 'req-3',
        clientIp: '127.0.0.1',
        body: { producto_id: productoId, cantidad: 1 },
        idempotencyKeyRaw: 'idem-123',
        requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
        respondOk,
        respondFail,
      },
      { callFunctionImpl },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('idempotente');
    expect(json.idempotent).toBe(true);
    expect(json.stock_disponible).toBe(7);
  });

  it('dos requests concurrentes con la misma key producen una 201 y una 200 (según respuesta RPC)', async () => {
    const { respondOk, respondFail } = createResponders('req-4');

    let callIndex = 0;
    const callFunctionImpl = vi.fn().mockImplementation(async () => {
      callIndex += 1;
      if (callIndex === 1) {
        // Simula carrera: primera request tarda y crea.
        await new Promise((r) => setTimeout(r, 10));
        return { reserva: { id: 'res-1' }, idempotent: false, stock_disponible: 10 };
      }
      // Segunda request recibe respuesta idempotente.
      return { reserva: { id: 'res-1' }, idempotent: true, stock_disponible: 10 };
    });

    const commonInput = {
      supabaseUrl,
      userId,
      requestId: 'req-4',
      clientIp: '127.0.0.1',
      body: { producto_id: productoId, cantidad: 2 },
      idempotencyKeyRaw: 'idem-xyz',
      requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
      respondOk,
      respondFail,
    };

    const p1 = handleCreateReserva(commonInput, { callFunctionImpl });
    const p2 = handleCreateReserva(commonInput, { callFunctionImpl });
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(callFunctionImpl).toHaveBeenCalledTimes(2);
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(200);
  });
});
