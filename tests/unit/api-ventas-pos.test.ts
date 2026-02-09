/**
 * Tests para POST /ventas (POS) handler.
 *
 * Nota: valida lógica del handler (validación, idempotency header, mapping de errores).
 * La atomicidad y consistencia se garantizan en DB vía `sp_procesar_venta_pos`.
 */

import { describe, it, expect, vi } from 'vitest';
import { ok, fail } from '../../supabase/functions/_shared/response';
import { handleCreateVentaPos } from '../../supabase/functions/api-minimarket/handlers/ventas';
import { AppError } from '../../supabase/functions/_shared/errors';

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

describe('POST /ventas handler (POS)', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const productoId = '550e8400-e29b-41d4-a716-446655440001';

  it('rechaza request sin Idempotency-Key', async () => {
    const { respondOk, respondFail } = createResponders('req-v1');
    const callFunctionImpl = vi.fn();

    const res = await handleCreateVentaPos(
      {
        supabaseUrl,
        userId,
        requestId: 'req-v1',
        clientIp: '127.0.0.1',
        body: { metodo_pago: 'efectivo', items: [{ producto_id: productoId, cantidad: 1 }] },
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

  it('propaga Idempotency-Key a sp_procesar_venta_pos y retorna 201 cuando crea', async () => {
    const { respondOk, respondFail } = createResponders('req-v2');

    const callFunctionImpl = vi.fn().mockResolvedValue({
      id: 'venta-1',
      idempotency_key: 'idem-1',
      metodo_pago: 'efectivo',
      cliente_id: null,
      monto_total: 100,
      created_at: new Date().toISOString(),
      status: 'created',
      items: [],
    });

    const res = await handleCreateVentaPos(
      {
        supabaseUrl,
        userId,
        requestId: 'req-v2',
        clientIp: '127.0.0.1',
        body: { metodo_pago: 'efectivo', items: [{ producto_id: productoId, cantidad: 2 }] },
        idempotencyKeyRaw: ' idem-1 ',
        requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
        respondOk,
        respondFail,
      },
      { callFunctionImpl },
    );

    expect(callFunctionImpl).toHaveBeenCalledTimes(1);
    const args = callFunctionImpl.mock.calls[0];
    expect(args[0]).toBe(supabaseUrl);
    expect(args[1]).toBe('sp_procesar_venta_pos');
    expect(args[3]).toMatchObject({
      payload: {
        idempotency_key: 'idem-1',
        metodo_pago: 'efectivo',
        cliente_id: null,
        confirmar_riesgo: false,
        items: [{ producto_id: productoId, cantidad: 2 }],
      },
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toMatchObject({ id: 'venta-1', status: 'created' });
    expect(json.idempotent).toBe(false);
  });

  it('retorna 200 cuando la venta es idempotente (status=existing)', async () => {
    const { respondOk, respondFail } = createResponders('req-v3');

    const callFunctionImpl = vi.fn().mockResolvedValue({
      id: 'venta-1',
      idempotency_key: 'idem-1',
      metodo_pago: 'efectivo',
      cliente_id: null,
      monto_total: 100,
      created_at: new Date().toISOString(),
      status: 'existing',
      items: [],
    });

    const res = await handleCreateVentaPos(
      {
        supabaseUrl,
        userId,
        requestId: 'req-v3',
        clientIp: '127.0.0.1',
        body: { metodo_pago: 'efectivo', items: [{ producto_id: productoId, cantidad: 1 }] },
        idempotencyKeyRaw: 'idem-1',
        requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
        respondOk,
        respondFail,
      },
      { callFunctionImpl },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.idempotent).toBe(true);
  });

  it('mapea LOSS_RISK_CONFIRM_REQUIRED a 409', async () => {
    const { respondOk, respondFail } = createResponders('req-v4');

    const callFunctionImpl = vi.fn().mockRejectedValue(
      new AppError('LOSS_RISK_CONFIRM_REQUIRED', 'RAISE_EXCEPTION', 400),
    );

    const res = await handleCreateVentaPos(
      {
        supabaseUrl,
        userId,
        requestId: 'req-v4',
        clientIp: '127.0.0.1',
        body: { metodo_pago: 'efectivo', items: [{ producto_id: productoId, cantidad: 1 }] },
        idempotencyKeyRaw: 'idem-2',
        requestHeaders: () => ({ apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' }),
        respondOk,
        respondFail,
      },
      { callFunctionImpl },
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('LOSS_RISK_CONFIRM_REQUIRED');
  });
});

