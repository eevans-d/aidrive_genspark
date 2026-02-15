/**
 * Integration Tests using MSW (Mock Service Worker)
 * @description Tests API interactions without real credentials
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../mocks/server';
import { mockProductos, mockProveedores, mockTareas } from '../mocks/handlers';

// Environment setup
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost';

// Start MSW server before tests
beforeAll(() => {
        server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
        server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
        server.close();
});

describe('MSW Integration Tests', () => {
        describe('Productos API', () => {
                it('should return mocked productos list', async () => {
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/productos`);
                        const data = await response.json();

                        expect(response.ok).toBe(true);
                        expect(data).toHaveLength(2);
                        expect(data[0].nombre).toBe('Producto Test 1');
                        expect(data[1].nombre).toBe('Producto Test 2');
                });

                it('should include pagination headers', async () => {
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/productos`);

                        expect(response.headers.get('Content-Range')).toBe('0-1/2');
                        expect(response.headers.get('x-total-count')).toBe('2');
                });
        });

        describe('Proveedores API', () => {
                it('should return mocked proveedores list', async () => {
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/proveedores`);
                        const data = await response.json();

                        expect(response.ok).toBe(true);
                        expect(data).toHaveLength(2);
                        expect(data[0].nombre).toBe('Proveedor Uno');
                });
        });

        describe('Tareas API', () => {
                it('should return mocked tareas pendientes', async () => {
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/tareas_pendientes`);
                        const data = await response.json();

                        expect(response.ok).toBe(true);
                        expect(data).toHaveLength(1);
                        expect(data[0].prioridad).toBe('urgente');
                });
        });

        describe('Stock API', () => {
                it('should return mocked stock data', async () => {
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_deposito`);
                        const data = await response.json();

                        expect(response.ok).toBe(true);
                        expect(data).toHaveLength(2);
                        expect(data[0].cantidad_actual).toBe(5);
                });

                it('should identify low stock items', async () => {
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_deposito`);
                        const data = await response.json();

                        // Item with cantidad_actual < stock_minimo
                        const lowStockItems = data.filter(
                                (item: { cantidad_actual: number; stock_minimo: number }) =>
                                        item.cantidad_actual < item.stock_minimo
                        );

                        expect(lowStockItems).toHaveLength(1);
                        expect(lowStockItems[0].producto_id).toBe('1');
                });
        });

        describe('Health Check API', () => {
                it('should return ok status from edge function', async () => {
                        const response = await fetch(`${SUPABASE_URL}/functions/v1/api-minimarket/status`);
                        const data = await response.json();

                        expect(response.ok).toBe(true);
                        expect(data.status).toBe('ok');
                        expect(data.timestamp).toBeDefined();
                });
        });
});
