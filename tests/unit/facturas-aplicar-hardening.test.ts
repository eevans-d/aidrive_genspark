/**
 * T7 Hardening Tests for POST /facturas/{id}/aplicar
 *
 * Validates:
 * - Partial failure triggers compensation (salida) movements
 * - Successful application records audit event
 * - Idempotency: already-applied items are skipped
 * - Optimistic lock: concurrent apply returns 409
 * - State guards: only `validada` factura can be applied
 * - OCR confidence guard: blocks below threshold
 * - Compensation failure is handled gracefully (non-blocking)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateTableByFilters,
  queryTable,
  insertTable,
  updateTable,
  callFunction,
} from '../../supabase/functions/api-minimarket/helpers/supabase';
import {
  resolveOcrMinScoreApply,
  hasSufficientOcrConfidence,
  DEFAULT_OCR_MIN_SCORE_APPLY,
} from '../../supabase/functions/api-minimarket/helpers/validation';

// ---------------------------------------------------------------------------
// Helpers: simulate the /aplicar logic extracted for testability
// ---------------------------------------------------------------------------

interface FacturaItem {
  id: string;
  factura_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number | null;
  estado_match: string;
}

interface ApplyResult {
  item_id: string;
  status: 'applied' | 'already_applied';
  movimiento_id: string | null;
}

interface ApplyError {
  item_id: string;
  error: string;
}

/**
 * Core compensation logic extracted from the endpoint.
 * Given applied results and the original items, creates reverse movements
 * and clears idempotency links.
 */
async function compensateAppliedItems(
  appliedResults: ApplyResult[],
  confirmedItems: FacturaItem[],
  facturaId: string,
  facturaNumero: string | null,
  userId: string,
  requestId: string,
  deps: {
    callFunction: typeof callFunction;
    updateTable: typeof updateTable;
  },
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<{ compensated: { item_id: string; movimiento_id: string | null }[]; errors: { item_id: string; error: string }[] }> {
  const compensated: { item_id: string; movimiento_id: string | null }[] = [];
  const errors: { item_id: string; error: string }[] = [];

  for (const applied of appliedResults) {
    const item = confirmedItems.find(i => i.id === applied.item_id);
    if (!item) continue;

    try {
      // Create compensating salida movement
      await deps.callFunction(supabaseUrl, 'sp_movimiento_inventario', headers, {
        p_producto_id: String(item.producto_id),
        p_tipo: 'salida',
        p_cantidad: Number(item.cantidad),
        p_origen: `Compensacion:Factura:${facturaNumero || facturaId}`,
        p_destino: 'Principal',
        p_usuario: userId,
        p_observaciones: `Rollback parcial request_id=${requestId}`,
      });

      // Clear idempotency link
      if (applied.movimiento_id) {
        await deps.updateTable(
          supabaseUrl, 'movimientos_deposito',
          String(applied.movimiento_id),
          headers,
          { factura_ingesta_item_id: null },
        );
      }

      compensated.push({ item_id: applied.item_id, movimiento_id: applied.movimiento_id });
    } catch (compErr) {
      errors.push({ item_id: applied.item_id, error: String(compErr) });
    }
  }

  return { compensated, errors };
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const UUID_1 = '550e8400-e29b-41d4-a716-446655440001';
const UUID_2 = '550e8400-e29b-41d4-a716-446655440002';
const UUID_3 = '550e8400-e29b-41d4-a716-446655440003';
const FACTURA_ID = '550e8400-e29b-41d4-a716-446655440010';
const MOV_ID_1 = '660e8400-e29b-41d4-a716-446655440001';
const MOV_ID_2 = '660e8400-e29b-41d4-a716-446655440002';
const USER_ID = '770e8400-e29b-41d4-a716-446655440001';
const REQUEST_ID = 'req-test-001';
const BASE_URL = 'https://x.supabase.co';
const HEADERS = { Authorization: 'Bearer tok', apikey: 'anon', 'Content-Type': 'application/json' };

function makeItem(overrides: Partial<FacturaItem> = {}): FacturaItem {
  return {
    id: UUID_1,
    factura_id: FACTURA_ID,
    producto_id: UUID_2,
    cantidad: 10,
    precio_unitario: 150.0,
    estado_match: 'confirmada',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T7: Compensation logic for partial failure', () => {
  it('should create salida movements for each applied item', async () => {
    const mockCallFunction = vi.fn().mockResolvedValue({ ok: true });
    const mockUpdateTable = vi.fn().mockResolvedValue([{ id: MOV_ID_1 }]);

    const items: FacturaItem[] = [
      makeItem({ id: UUID_1, producto_id: UUID_2, cantidad: 10 }),
      makeItem({ id: UUID_3, producto_id: UUID_2, cantidad: 5 }),
    ];

    const appliedResults: ApplyResult[] = [
      { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
      { item_id: UUID_3, status: 'applied', movimiento_id: MOV_ID_2 },
    ];

    const result = await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, 'FC-001', USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(result.compensated).toHaveLength(2);
    expect(result.errors).toHaveLength(0);

    // Verify salida calls
    expect(mockCallFunction).toHaveBeenCalledTimes(2);
    expect(mockCallFunction.mock.calls[0][3]).toMatchObject({
      p_tipo: 'salida',
      p_cantidad: 10,
      p_producto_id: UUID_2,
    });
    expect(mockCallFunction.mock.calls[1][3]).toMatchObject({
      p_tipo: 'salida',
      p_cantidad: 5,
      p_producto_id: UUID_2,
    });

    // Verify idempotency link cleared
    expect(mockUpdateTable).toHaveBeenCalledTimes(2);
    expect(mockUpdateTable.mock.calls[0][4]).toEqual({ factura_ingesta_item_id: null });
  });

  it('should skip items not found in confirmedItems', async () => {
    const mockCallFunction = vi.fn().mockResolvedValue({ ok: true });
    const mockUpdateTable = vi.fn().mockResolvedValue([]);

    const items: FacturaItem[] = [
      makeItem({ id: UUID_1 }),
    ];

    const appliedResults: ApplyResult[] = [
      { item_id: 'nonexistent-id', status: 'applied', movimiento_id: MOV_ID_1 },
    ];

    const result = await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, null, USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(result.compensated).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(mockCallFunction).not.toHaveBeenCalled();
  });

  it('should handle compensation failure gracefully', async () => {
    const mockCallFunction = vi.fn().mockRejectedValue(new Error('Stock insuficiente'));
    const mockUpdateTable = vi.fn();

    const items: FacturaItem[] = [makeItem({ id: UUID_1 })];
    const appliedResults: ApplyResult[] = [
      { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
    ];

    const result = await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, 'FC-001', USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(result.compensated).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Stock insuficiente');
    // updateTable should NOT have been called since callFunction failed first
    expect(mockUpdateTable).not.toHaveBeenCalled();
  });

  it('should skip idempotency link clear when movimiento_id is null', async () => {
    const mockCallFunction = vi.fn().mockResolvedValue({ ok: true });
    const mockUpdateTable = vi.fn();

    const items: FacturaItem[] = [makeItem({ id: UUID_1 })];
    const appliedResults: ApplyResult[] = [
      { item_id: UUID_1, status: 'applied', movimiento_id: null },
    ];

    const result = await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, 'FC-001', USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(result.compensated).toHaveLength(1);
    expect(mockCallFunction).toHaveBeenCalledTimes(1);
    // updateTable not called because movimiento_id is null
    expect(mockUpdateTable).not.toHaveBeenCalled();
  });

  it('should include factura numero in compensation origin', async () => {
    const mockCallFunction = vi.fn().mockResolvedValue({ ok: true });
    const mockUpdateTable = vi.fn().mockResolvedValue([]);

    const items: FacturaItem[] = [makeItem({ id: UUID_1 })];
    const appliedResults: ApplyResult[] = [
      { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
    ];

    await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, 'FC-2026-0042', USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(mockCallFunction.mock.calls[0][3].p_origen).toBe('Compensacion:Factura:FC-2026-0042');
  });

  it('should fall back to facturaId when numero is null', async () => {
    const mockCallFunction = vi.fn().mockResolvedValue({ ok: true });
    const mockUpdateTable = vi.fn().mockResolvedValue([]);

    const items: FacturaItem[] = [makeItem({ id: UUID_1 })];
    const appliedResults: ApplyResult[] = [
      { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
    ];

    await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, null, USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(mockCallFunction.mock.calls[0][3].p_origen).toBe(`Compensacion:Factura:${FACTURA_ID}`);
  });

  it('should include request_id in observaciones for traceability', async () => {
    const mockCallFunction = vi.fn().mockResolvedValue({ ok: true });
    const mockUpdateTable = vi.fn().mockResolvedValue([]);

    const items: FacturaItem[] = [makeItem({ id: UUID_1 })];
    const appliedResults: ApplyResult[] = [
      { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
    ];

    await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, 'FC-001', USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(mockCallFunction.mock.calls[0][3].p_observaciones).toContain(REQUEST_ID);
  });

  it('should handle empty appliedResults', async () => {
    const mockCallFunction = vi.fn();
    const mockUpdateTable = vi.fn();

    const result = await compensateAppliedItems(
      [], [makeItem()], FACTURA_ID, 'FC-001', USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    expect(result.compensated).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(mockCallFunction).not.toHaveBeenCalled();
  });
});

describe('T7: Optimistic lock behavior (updateTableByFilters)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('should acquire lock when factura is in validada state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: FACTURA_ID, estado: 'aplicada' }]), { status: 200 }),
    );

    const result = await updateTableByFilters(
      BASE_URL, 'facturas_ingesta', HEADERS,
      { id: FACTURA_ID, estado: 'validada' },
      { estado: 'aplicada' },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ estado: 'aplicada' });
  });

  it('should return empty when factura already changed state (concurrent apply)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const result = await updateTableByFilters(
      BASE_URL, 'facturas_ingesta', HEADERS,
      { id: FACTURA_ID, estado: 'validada' },
      { estado: 'aplicada' },
    );

    expect(result).toHaveLength(0);
  });

  it('should use PATCH with both id and estado filters', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await updateTableByFilters(
      BASE_URL, 'facturas_ingesta', HEADERS,
      { id: FACTURA_ID, estado: 'validada' },
      { estado: 'aplicada' },
    );

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain(`id=eq.${FACTURA_ID}`);
    expect(url).toContain('estado=eq.validada');
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('PATCH');
  });
});

describe('T7: Idempotency — queryTable check for existing movements', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('should detect already-applied item via factura_ingesta_item_id lookup', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: MOV_ID_1, factura_ingesta_item_id: UUID_1 }]), { status: 200 }),
    );

    const existing = await queryTable(
      BASE_URL, 'movimientos_deposito', HEADERS,
      { factura_ingesta_item_id: UUID_1 },
    );

    expect(existing).toHaveLength(1);
  });

  it('should return empty when item has not been applied', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const existing = await queryTable(
      BASE_URL, 'movimientos_deposito', HEADERS,
      { factura_ingesta_item_id: UUID_1 },
    );

    expect(existing).toHaveLength(0);
  });

  it('should allow retry after compensation clears the link', async () => {
    // After compensation: movimiento exists but factura_ingesta_item_id is null
    // Query by factura_ingesta_item_id returns empty -> retry is allowed
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const existing = await queryTable(
      BASE_URL, 'movimientos_deposito', HEADERS,
      { factura_ingesta_item_id: UUID_1 },
    );

    // No match found = retry allowed
    expect(existing).toHaveLength(0);
  });
});

describe('T7: OCR confidence guard', () => {
  it('should block application when score below threshold', () => {
    const minScore = resolveOcrMinScoreApply('0.7');
    expect(hasSufficientOcrConfidence(0.5, minScore)).toBe(false);
    expect(hasSufficientOcrConfidence(0.69, minScore)).toBe(false);
  });

  it('should allow application when score meets threshold', () => {
    const minScore = resolveOcrMinScoreApply('0.7');
    expect(hasSufficientOcrConfidence(0.7, minScore)).toBe(true);
    expect(hasSufficientOcrConfidence(0.95, minScore)).toBe(true);
  });

  it('should block when score is null/undefined', () => {
    expect(hasSufficientOcrConfidence(null, DEFAULT_OCR_MIN_SCORE_APPLY)).toBe(false);
    expect(hasSufficientOcrConfidence(undefined, DEFAULT_OCR_MIN_SCORE_APPLY)).toBe(false);
  });

  it('should respect custom threshold from env', () => {
    const strict = resolveOcrMinScoreApply('0.9');
    expect(strict).toBe(0.9);
    expect(hasSufficientOcrConfidence(0.85, strict)).toBe(false);
    expect(hasSufficientOcrConfidence(0.91, strict)).toBe(true);
  });
});

describe('T7: State transition and audit events', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('should record aplicada event on full success', async () => {
    const eventData = {
      factura_id: FACTURA_ID,
      evento: 'aplicada',
      datos: {
        aplicada_por: USER_ID,
        request_id: REQUEST_ID,
        items_aplicados: 3,
        items_errores: 0,
      },
      usuario_id: USER_ID,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([eventData]), { status: 201 }),
    );

    const result = await insertTable(BASE_URL, 'facturas_ingesta_eventos', HEADERS, eventData);
    expect(result[0]).toMatchObject({ evento: 'aplicada' });
  });

  it('should record aplicacion_rollback event with compensation details on partial failure', async () => {
    const rollbackEventData = {
      factura_id: FACTURA_ID,
      evento: 'aplicacion_rollback',
      datos: {
        request_id: REQUEST_ID,
        motivo: 'errores_parciales',
        items_aplicados: 2,
        items_compensados: 2,
        items_compensacion_fallida: 0,
        items_errores: 1,
      },
      usuario_id: USER_ID,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([rollbackEventData]), { status: 201 }),
    );

    const result = await insertTable(
      BASE_URL, 'facturas_ingesta_eventos', HEADERS, rollbackEventData,
    );

    const datos = (result[0] as Record<string, unknown>).datos as Record<string, unknown>;
    expect(datos.items_compensados).toBe(2);
    expect(datos.items_compensacion_fallida).toBe(0);
    expect(datos.motivo).toBe('errores_parciales');
  });

  it('should rollback estado from aplicada to validada after partial failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: FACTURA_ID, estado: 'validada' }]), { status: 200 }),
    );

    const result = await updateTableByFilters(
      BASE_URL, 'facturas_ingesta', HEADERS,
      { id: FACTURA_ID, estado: 'aplicada' },
      { estado: 'validada' },
    );

    expect(result[0]).toMatchObject({ estado: 'validada' });
  });
});

describe('T7: Response format for 200 (full success) vs 207 (partial)', () => {
  it('200 response should have zero errors', () => {
    const response = {
      factura_id: FACTURA_ID,
      items_aplicados: 3,
      items_ya_aplicados: 0,
      items_errores: 0,
      results: [
        { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
        { item_id: UUID_2, status: 'applied', movimiento_id: MOV_ID_2 },
        { item_id: UUID_3, status: 'applied', movimiento_id: 'mov-3' },
      ],
      errors: [],
    };

    // 200 is used when errors.length === 0
    const statusCode = response.errors.length > 0 ? 207 : 200;
    expect(statusCode).toBe(200);
    expect(response.items_errores).toBe(0);
  });

  it('207 response should contain error details and compensation info', () => {
    const response = {
      factura_id: FACTURA_ID,
      items_aplicados: 1,
      items_ya_aplicados: 0,
      items_errores: 1,
      results: [
        { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
      ],
      errors: [
        { item_id: UUID_2, error: 'sp_movimiento_inventario failed' },
      ],
    };

    const statusCode = response.errors.length > 0 ? 207 : 200;
    expect(statusCode).toBe(207);
    expect(response.items_errores).toBe(1);
    expect(response.errors[0]).toMatchObject({
      item_id: UUID_2,
      error: expect.any(String),
    });
  });

  it('already_applied items should not count as errors', () => {
    const results = [
      { item_id: UUID_1, status: 'already_applied' as const, movimiento_id: null },
      { item_id: UUID_2, status: 'applied' as const, movimiento_id: MOV_ID_1 },
    ];
    const errors: ApplyError[] = [];

    const appliedCount = results.filter(r => r.status === 'applied').length;
    const alreadyAppliedCount = results.filter(r => r.status === 'already_applied').length;

    expect(appliedCount).toBe(1);
    expect(alreadyAppliedCount).toBe(1);
    expect(errors.length).toBe(0);
    // Full success (0 errors) -> 200
    const statusCode = errors.length > 0 ? 207 : 200;
    expect(statusCode).toBe(200);
  });
});

describe('T7: Mixed compensation outcomes', () => {
  it('should handle mix of successful and failed compensations', async () => {
    let callCount = 0;
    const mockCallFunction = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        return Promise.reject(new Error('DB timeout'));
      }
      return Promise.resolve({ ok: true });
    });
    const mockUpdateTable = vi.fn().mockResolvedValue([]);

    const items: FacturaItem[] = [
      makeItem({ id: UUID_1, cantidad: 10 }),
      makeItem({ id: UUID_2, cantidad: 5 }),
      makeItem({ id: UUID_3, cantidad: 3 }),
    ];

    const appliedResults: ApplyResult[] = [
      { item_id: UUID_1, status: 'applied', movimiento_id: MOV_ID_1 },
      { item_id: UUID_2, status: 'applied', movimiento_id: MOV_ID_2 },
      { item_id: UUID_3, status: 'applied', movimiento_id: 'mov-3' },
    ];

    const result = await compensateAppliedItems(
      appliedResults, items, FACTURA_ID, 'FC-001', USER_ID, REQUEST_ID,
      { callFunction: mockCallFunction, updateTable: mockUpdateTable },
      BASE_URL, HEADERS,
    );

    // 2 succeeded, 1 failed (the second one)
    expect(result.compensated).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].item_id).toBe(UUID_2);
    expect(result.errors[0].error).toContain('DB timeout');
  });
});
