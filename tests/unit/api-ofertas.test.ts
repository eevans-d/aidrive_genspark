/**
 * Tests unitarios para handler de Ofertas (Anti-mermas).
 *
 * Valida: validación de input + wiring a RPCs (sin ejecutar DB real).
 */

import { describe, it, expect, vi } from 'vitest';
import { AppError } from '../../supabase/functions/_shared/errors';
import {
  handleAplicarOferta,
  handleDesactivarOferta,
  handleListarOfertasSugeridas,
} from '../../supabase/functions/api-minimarket/handlers/ofertas';

describe('Ofertas handlers', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const headers = { apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' };
  const responseHeaders: Record<string, string> = { 'x-request-id': 'req-1' };

  it('GET /ofertas/sugeridas retorna 200 con rows', async () => {
    const queryTableImpl = vi.fn().mockResolvedValue([{ stock_id: 's1' }]);
    const res = await handleListarOfertasSugeridas(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-1',
      { queryTableImpl },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([{ stock_id: 's1' }]);
    expect(queryTableImpl).toHaveBeenCalledTimes(1);
  });

  it('POST /ofertas/aplicar rechaza stock_id inválido (400)', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleAplicarOferta(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-2',
      { stock_id: 'not-a-uuid' },
      { callFunctionImpl },
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });

  it('POST /ofertas/aplicar usa 30% por defecto y llama RPC (201)', async () => {
    const callFunctionImpl = vi.fn().mockResolvedValue({ status: 'created', oferta: { id: 'o1' } });
    const stockId = '550e8400-e29b-41d4-a716-446655440000';

    const res = await handleAplicarOferta(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-3',
      { stock_id: stockId },
      { callFunctionImpl },
    );

    expect(callFunctionImpl).toHaveBeenCalledTimes(1);
    const args = callFunctionImpl.mock.calls[0];
    expect(args[0]).toBe(supabaseUrl);
    expect(args[1]).toBe('sp_aplicar_oferta_stock');
    expect(args[3]).toMatchObject({ p_stock_id: stockId, p_descuento_pct: 30 });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('POST /ofertas/aplicar mapea STOCK_NO_ENCONTRADO a 404', async () => {
    const callFunctionImpl = vi.fn().mockRejectedValue(new AppError('STOCK_NO_ENCONTRADO', 'RAISE_EXCEPTION', 400));
    const stockId = '550e8400-e29b-41d4-a716-446655440000';

    const res = await handleAplicarOferta(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-4',
      { stock_id: stockId },
      { callFunctionImpl },
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('POST /ofertas/:id/desactivar rechaza id inválido (400)', async () => {
    const callFunctionImpl = vi.fn();
    const res = await handleDesactivarOferta(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-5',
      'bad-id',
      { callFunctionImpl },
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(callFunctionImpl).not.toHaveBeenCalled();
  });
});

