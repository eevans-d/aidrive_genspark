import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../supabase/functions/api-minimarket/helpers/supabase.ts', () => ({
  queryTable: vi.fn(),
  queryTableWithCount: vi.fn(),
  insertTable: vi.fn(),
  updateTable: vi.fn(),
  updateTableByFilters: vi.fn(),
  callFunction: vi.fn(),
}));

import { handleActualizarEstadoPedido } from '../../supabase/functions/api-minimarket/handlers/pedidos.ts';
import {
  queryTable,
  updateTable,
  updateTableByFilters,
} from '../../supabase/functions/api-minimarket/helpers/supabase.ts';

const SUPABASE_URL = 'https://test.supabase.co';
const REQUEST_HEADERS = { Authorization: 'Bearer test-token', apikey: 'test-key' };
const RESPONSE_HEADERS = { 'x-request-id': 'req-pedidos-estado' };
const REQUEST_ID = 'req-pedidos-estado';
const PEDIDO_ID = '550e8400-e29b-41d4-a716-446655440010';
const USER_ID = '550e8400-e29b-41d4-a716-446655440099';

describe('api-minimarket/handlers/pedidos.handleActualizarEstadoPedido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates pedidos using optimistic filters on id and current estado', async () => {
    (queryTable as any).mockResolvedValue([{ id: PEDIDO_ID, estado: 'pendiente' }]);
    (updateTableByFilters as any).mockResolvedValue([{ id: PEDIDO_ID, estado: 'preparando' }]);

    const response = await handleActualizarEstadoPedido(
      SUPABASE_URL,
      REQUEST_HEADERS,
      RESPONSE_HEADERS,
      REQUEST_ID,
      PEDIDO_ID,
      'preparando',
      USER_ID,
    );

    expect(response.status).toBe(200);
    expect(updateTableByFilters).toHaveBeenCalledWith(
      SUPABASE_URL,
      'pedidos',
      REQUEST_HEADERS,
      { id: PEDIDO_ID, estado: 'pendiente' },
      expect.objectContaining({
        estado: 'preparando',
        preparado_por_id: USER_ID,
        updated_at: expect.any(String),
      }),
    );
    expect(updateTable).not.toHaveBeenCalled();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.estado).toBe('preparando');
  });

  it('returns 409 when another operation changed the pedido before the PATCH', async () => {
    (queryTable as any).mockResolvedValue([{ id: PEDIDO_ID, estado: 'pendiente' }]);
    (updateTableByFilters as any).mockResolvedValue([]);

    const response = await handleActualizarEstadoPedido(
      SUPABASE_URL,
      REQUEST_HEADERS,
      RESPONSE_HEADERS,
      REQUEST_ID,
      PEDIDO_ID,
      'preparando',
      USER_ID,
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toContain('otra operación');
  });

  it('rejects invalid transitions before attempting the optimistic PATCH', async () => {
    (queryTable as any).mockResolvedValue([{ id: PEDIDO_ID, estado: 'listo' }]);

    const response = await handleActualizarEstadoPedido(
      SUPABASE_URL,
      REQUEST_HEADERS,
      RESPONSE_HEADERS,
      REQUEST_ID,
      PEDIDO_ID,
      'preparando',
      USER_ID,
    );

    expect(response.status).toBe(409);
    expect(updateTableByFilters).not.toHaveBeenCalled();

    const body = await response.json();
    expect(body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
});
