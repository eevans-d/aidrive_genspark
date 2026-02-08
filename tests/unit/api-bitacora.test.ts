/**
 * Tests unitarios para handler de Bitácora (Notas de turno).
 */

import { describe, it, expect, vi } from 'vitest';
import {
  handleCrearBitacora,
  handleListarBitacora,
} from '../../supabase/functions/api-minimarket/handlers/bitacora';

describe('Bitácora handlers', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const headers = { apikey: 'anon', Authorization: 'Bearer token', 'Content-Type': 'application/json' };
  const responseHeaders: Record<string, string> = { 'x-request-id': 'req-b1' };

  it('POST /bitacora rechaza nota vacía (400)', async () => {
    const insertTableImpl = vi.fn();
    const res = await handleCrearBitacora(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-b1',
      { nota: '   ' },
      { email: 'a@b.com', role: 'ventas' },
      { insertTableImpl },
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(insertTableImpl).not.toHaveBeenCalled();
  });

  it('POST /bitacora inserta nota y retorna 201', async () => {
    const insertTableImpl = vi.fn().mockResolvedValue([
      { id: 'n1', nota: 'ok', created_at: new Date().toISOString() },
    ]);

    const res = await handleCrearBitacora(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-b2',
      { nota: 'Se rompió la heladera', usuario_nombre: 'Empleado A' },
      { email: 'a@b.com', role: 'deposito' },
      { insertTableImpl },
    );

    expect(insertTableImpl).toHaveBeenCalledTimes(1);
    const args = insertTableImpl.mock.calls[0];
    expect(args[0]).toBe(supabaseUrl);
    expect(args[1]).toBe('bitacora_turnos');
    expect(args[3]).toMatchObject({
      nota: 'Se rompió la heladera',
      usuario_nombre: 'Empleado A',
      usuario_email: 'a@b.com',
      usuario_rol: 'deposito',
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('GET /bitacora lista notas (200)', async () => {
    const queryTableImpl = vi.fn().mockResolvedValue([{ id: 'n1', nota: 'x' }]);
    const res = await handleListarBitacora(
      supabaseUrl,
      headers,
      responseHeaders,
      'req-b3',
      { limit: 10, offset: 0 },
      { queryTableImpl },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([{ id: 'n1', nota: 'x' }]);
  });
});

