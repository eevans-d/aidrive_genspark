/**
 * MSW Infrastructure Smoke Tests + Mock Data Shape Validation
 *
 * Validates that:
 * 1. MSW server boots and intercepts requests correctly
 * 2. Mock data shapes are consistent with real DB schema expectations
 * 3. Mock handlers respond with correct HTTP shapes (headers, status codes)
 *
 * This tests the mock infrastructure so frontend integration tests can rely on it.
 *
 * @module tests/contract/msw-integration
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../mocks/server';
import { mockProductos, mockProveedores, mockTareas, mockStockDeposito } from '../mocks/handlers';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// 1. Mock Data Shape Validation (against DB schema expectations)
// ============================================================================

describe('Mock data shapes match DB schema', () => {
  it('mockProductos have required DB columns', () => {
    for (const p of mockProductos) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('nombre');
      expect(p).toHaveProperty('categoria');
      expect(p).toHaveProperty('codigo_barras');
      expect(p).toHaveProperty('precio_actual');
      expect(p).toHaveProperty('precio_costo');
      expect(p).toHaveProperty('activo');
      expect(typeof p.precio_actual).toBe('number');
      expect(typeof p.precio_costo).toBe('number');
      expect(p.precio_actual).toBeGreaterThan(0);
      expect(p.margen_ganancia).toBeGreaterThan(0);
    }
  });

  it('mockProveedores have required fields', () => {
    for (const prov of mockProveedores) {
      expect(prov).toHaveProperty('id');
      expect(prov).toHaveProperty('nombre');
      expect(prov).toHaveProperty('activo');
      expect(typeof prov.nombre).toBe('string');
      expect(prov.nombre.length).toBeGreaterThan(0);
    }
  });

  it('mockTareas have required fields', () => {
    for (const t of mockTareas) {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('titulo');
      expect(t).toHaveProperty('prioridad');
      expect(t).toHaveProperty('estado');
      expect(['urgente', 'alta', 'media', 'baja']).toContain(t.prioridad);
    }
  });

  it('mockStockDeposito have required fields and valid ranges', () => {
    for (const s of mockStockDeposito) {
      expect(s).toHaveProperty('producto_id');
      expect(s).toHaveProperty('cantidad_actual');
      expect(s).toHaveProperty('stock_minimo');
      expect(s).toHaveProperty('deposito_id');
      expect(typeof s.cantidad_actual).toBe('number');
      expect(typeof s.stock_minimo).toBe('number');
      expect(s.cantidad_actual).toBeGreaterThanOrEqual(0);
      expect(s.stock_minimo).toBeGreaterThanOrEqual(0);
    }
  });

  it('mockStockDeposito correctly identifies low stock items', () => {
    const lowStock = mockStockDeposito.filter(s => s.cantidad_actual < s.stock_minimo);
    expect(lowStock.length).toBeGreaterThan(0);
    // At least one item should be below minimum
    expect(lowStock[0].cantidad_actual).toBeLessThan(lowStock[0].stock_minimo);
  });
});

// ============================================================================
// 2. MSW Server Integration (handlers respond correctly)
// ============================================================================

describe('MSW server intercepts and responds', () => {
  it('GET /productos returns array with pagination headers', async () => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/productos`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(mockProductos.length);
    expect(data[0].nombre).toBe(mockProductos[0].nombre);

    // Pagination headers
    expect(response.headers.get('Content-Range')).toBeTruthy();
    expect(response.headers.get('x-total-count')).toBeTruthy();
  });

  it('GET /proveedores returns array', async () => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/proveedores`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveLength(mockProveedores.length);
  });

  it('GET /tareas_pendientes returns array', async () => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tareas_pendientes`);
    const data = await response.json();
    expect(data).toHaveLength(mockTareas.length);
  });

  it('GET /stock_deposito returns array', async () => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_deposito`);
    const data = await response.json();
    expect(data).toHaveLength(mockStockDeposito.length);
  });

  it('health check endpoint responds', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-minimarket/status`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
});
