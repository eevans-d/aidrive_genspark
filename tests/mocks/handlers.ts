/**
 * MSW Handlers - Mock Service Worker request handlers
 * @description Mocks Supabase REST API responses for integration tests without credentials
 */
import { http, HttpResponse } from 'msw';

// Base URL for mocked Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost';

// Mock data
export const mockProductos = [
        {
                id: '1',
                nombre: 'Producto Test 1',
                categoria: 'Alimentos',
                codigo_barras: '1234567890123',
                precio_actual: 100.5,
                precio_costo: 80.0,
                proveedor_principal_id: 'prov-1',
                margen_ganancia: 25.6,
                activo: true,
        },
        {
                id: '2',
                nombre: 'Producto Test 2',
                categoria: 'Bebidas',
                codigo_barras: '9876543210987',
                precio_actual: 50.0,
                precio_costo: 35.0,
                proveedor_principal_id: 'prov-2',
                margen_ganancia: 42.9,
                activo: true,
        },
];

export const mockProveedores = [
        { id: 'prov-1', nombre: 'Proveedor Uno', activo: true },
        { id: 'prov-2', nombre: 'Proveedor Dos', activo: true },
];

export const mockTareas = [
        {
                id: 't1',
                titulo: 'Revisar inventario',
                descripcion: 'Revisar el inventario del depósito',
                prioridad: 'urgente',
                estado: 'pendiente',
                asignada_a_nombre: 'Juan',
                fecha_vencimiento: '2026-01-25',
        },
];

export const mockStockDeposito = [
        { producto_id: '1', cantidad_actual: 5, stock_minimo: 10, deposito_id: 'd1' },
        { producto_id: '2', cantidad_actual: 100, stock_minimo: 20, deposito_id: 'd1' },
];

// Request handlers
export const handlers = [
        // Productos endpoint
        http.get(`${SUPABASE_URL}/rest/v1/productos`, ({ request }) => {
                const url = new URL(request.url);
                const select = url.searchParams.get('select');

                // Simulate pagination
                return HttpResponse.json(mockProductos, {
                        headers: {
                                'Content-Range': '0-1/2',
                                'x-total-count': '2',
                        },
                });
        }),

        // Proveedores endpoint
        http.get(`${SUPABASE_URL}/rest/v1/proveedores`, () => {
                return HttpResponse.json(mockProveedores);
        }),

        // Tareas pendientes endpoint
        http.get(`${SUPABASE_URL}/rest/v1/tareas_pendientes`, () => {
                return HttpResponse.json(mockTareas);
        }),

        // Stock deposito endpoint
        http.get(`${SUPABASE_URL}/rest/v1/stock_deposito`, () => {
                return HttpResponse.json(mockStockDeposito);
        }),

        // Precios historicos endpoint
        http.get(`${SUPABASE_URL}/rest/v1/precios_historicos`, () => {
                return HttpResponse.json([]);
        }),

        // Movimientos deposito (Kardex)
        http.get(`${SUPABASE_URL}/rest/v1/movimientos_deposito`, () => {
                return HttpResponse.json([
                        { id: 'm1', tipo_movimiento: 'entrada', cantidad: 10, fecha_movimiento: '2026-01-15' },
                        { id: 'm2', tipo_movimiento: 'salida', cantidad: 3, fecha_movimiento: '2026-01-16' },
                ]);
        }),

        // Auth endpoint (session check)
        http.get(`${SUPABASE_URL}/auth/v1/session`, () => {
                return HttpResponse.json({ session: null });
        }),

        // Health check for edge functions
        http.get(`${SUPABASE_URL}/functions/v1/api-minimarket/status`, () => {
                return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
        }),
];

export default handlers;
