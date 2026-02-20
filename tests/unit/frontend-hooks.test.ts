
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import functions to test
import { fetchProductos } from '../../minimarket-system/src/hooks/queries/useProductos';
import { fetchKardex } from '../../minimarket-system/src/hooks/queries/useKardex';
import { fetchDashboardStats } from '../../minimarket-system/src/hooks/queries/useDashboardStats';

// Import real instance (will be mocked via spyOn)
import { supabase } from '../../minimarket-system/src/lib/supabase';

// Mock builder object
const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], count: 0, error: null }))
};

describe('Frontend Business Logic (Hooks Fetchers)', () => {

        // Spy reference
        let fromSpy: any;

        beforeEach(() => {
                vi.clearAllMocks();
                // Setup Spy
                fromSpy = vi.spyOn(supabase, 'from').mockReturnValue(mockBuilder as any);

                // Reset default mock implementation for 'then'
                mockBuilder.then.mockImplementation((resolve) => resolve({ data: [], count: 0, error: null }));
        });

        afterEach(() => {
                vi.restoreAllMocks();
        });

        describe('fetchProductos', () => {
                it('should build correct query for basic pagination', async () => {
                        // Mock response sequence
                        // 1. Productos
                        // 2. Proveedores (batch) - only if products returned
                        // 3. Historial (batch) - only if products returned

                        const mockProds = [{ id: '1', nombre: 'Test Prod', precio_actual: 100, proveedor_principal_id: 'prov1' }];

                        // Helper para mockear respuesta db
                        const mockDbResponse = (val: any) => (resolve: any) => resolve(val);

                        // We need to manage multiple calls to 'then'.
                        // fetchProductos calls: 
                        // 1. supabase.from('productos')...
                        // 2. supabase.from('proveedores')... (if needed)
                        // 3. supabase.from('precios_historicos')... (if needed)

                        mockBuilder.then
                                .mockImplementationOnce(mockDbResponse({ data: mockProds, count: 10, error: null })) // Call 1: Productos
                                .mockImplementationOnce(mockDbResponse({ data: [{ id: 'prov1', nombre: 'Proveedor 1' }], error: null })) // Call 2: Proveedores
                                .mockImplementationOnce(mockDbResponse({ data: [], error: null })); // Call 3: Historial

                        const result = await fetchProductos({ page: 1, pageSize: 10 });

                        expect(supabase.from).toHaveBeenCalledWith('productos');
                        expect(mockBuilder.range).toHaveBeenCalledWith(0, 9);
                        expect(result.productos).toHaveLength(1);
                        expect(result.total).toBe(10);
                        expect(result.productos[0].proveedor).toBeDefined();
                });

                it('should handle barcode search', async () => {
                        const mockData = [{ id: '2', nombre: 'Barcoded Prod', codigo_barras: '123' }];
                        mockBuilder.then.mockImplementationOnce((resolve) => resolve({ data: mockData, count: 1, error: null }));
                        // No subsequent calls if no providers/history logic triggered or empty

                        await fetchProductos({ page: 1, barcodeSearch: '123' });

                        expect(mockBuilder.eq).toHaveBeenCalledWith('codigo_barras', '123');
                });
        });

        describe('fetchKardex', () => {
                it('should build correct query with filters', async () => {
                        mockBuilder.then.mockImplementation((resolve) => resolve({ data: [], count: 0, error: null }));

                        await fetchKardex({
                                productoId: 'prod-1',
                                fechaDesde: '2023-01-01',
                                fechaHasta: '2023-01-31'
                        });

                        expect(supabase.from).toHaveBeenCalledWith('movimientos_deposito');
                        expect(mockBuilder.eq).toHaveBeenCalledWith('producto_id', 'prod-1');
                        expect(mockBuilder.gte).toHaveBeenCalledWith('fecha_movimiento', '2023-01-01');
                });

                it('should calculate summary correctly', async () => {
                        const mockMovs = [
                                { tipo_movimiento: 'entrada', cantidad: 10 },
                                { tipo_movimiento: 'entrada', cantidad: 5 },
                                { tipo_movimiento: 'salida', cantidad: 3 },
                                { tipo_movimiento: 'ajuste', cantidad: 1 }
                        ];

                        mockBuilder.then.mockImplementation((resolve) => resolve({ data: mockMovs, count: 4, error: null }));

                        const result = await fetchKardex({});

                        expect(result.resumen.entradas).toBe(2);
                        expect(result.resumen.salidas).toBe(1);
                        expect(result.resumen.ajustes).toBe(1);
                });
        });

        describe('fetchDashboardStats', () => {
                it('should aggregate data from multiple queries', async () => {
                        // Restore spy to implement custom logic per table
                        fromSpy.mockRestore();

                        // Track call order per table to handle multiple queries to same table
                        let tareaCallIndex = 0;

                        fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                                const builder: any = { ...mockBuilder };
                                builder.then = vi.fn();

                                builder.select = vi.fn().mockReturnValue(builder);
                                builder.eq = vi.fn().mockReturnValue(builder);
                                builder.order = vi.fn().mockReturnValue(builder);
                                builder.limit = vi.fn().mockReturnValue(builder);

                                if (table === 'tareas_pendientes') {
                                        tareaCallIndex++;
                                        if (tareaCallIndex === 1) {
                                                // Query 1: display tareas (top 5)
                                                builder.then.mockImplementation((resolve) => resolve({
                                                        data: [{ id: 1, estado: 'pendiente', prioridad: 'urgente' }],
                                                        error: null
                                                }));
                                        } else if (tareaCallIndex === 2) {
                                                // Query 2: total pendientes count
                                                builder.then.mockImplementation((resolve) => resolve({ count: 1, error: null }));
                                        } else {
                                                // Query 3: urgentes count
                                                builder.then.mockImplementation((resolve) => resolve({ count: 1, error: null }));
                                        }
                                } else if (table === 'stock_deposito') {
                                        builder.then.mockImplementation((resolve) => resolve({
                                                data: [{ cantidad_actual: 5, stock_minimo: 10 }],
                                                error: null
                                        }));
                                } else if (table === 'productos') {
                                        builder.then.mockImplementation((resolve) => resolve({ count: 50, error: null }));
                                }

                                return builder as any;
                        });

                        const stats = await fetchDashboardStats();

                        expect(stats.tareasUrgentes).toBe(1);
                        expect(stats.totalTareasPendientes).toBe(1);
                        expect(stats.stockBajo).toBe(1);
                        expect(stats.totalProductos).toBe(50);
                });
        });
});
