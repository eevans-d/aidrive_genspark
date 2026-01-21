/**
 * Setup file for React component testing with @testing-library
 */
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// MSW Handlers - Mock Supabase REST API
const SUPABASE_URL = 'http://localhost';

const handlers = [
        // Dashboard stats - productos count
        http.get(`${SUPABASE_URL}/rest/v1/productos`, () => {
                return HttpResponse.json([
                        { id: '1', nombre: 'Producto 1', activo: true },
                        { id: '2', nombre: 'Producto 2', activo: true },
                ], { headers: { 'x-total-count': '2' } });
        }),

        // Tareas pendientes
        http.get(`${SUPABASE_URL}/rest/v1/tareas_pendientes`, () => {
                return HttpResponse.json([
                        { id: 't1', titulo: 'Tarea 1', prioridad: 'urgente', estado: 'pendiente' },
                ]);
        }),

        // Stock bajo
        http.get(`${SUPABASE_URL}/rest/v1/stock_deposito`, () => {
                return HttpResponse.json([
                        { producto_id: '1', cantidad_actual: 5, stock_minimo: 10 },
                ]);
        }),

        // Auth session
        http.get(`${SUPABASE_URL}/auth/v1/session`, () => {
                return HttpResponse.json({ session: null });
        }),
];

// Setup MSW server
const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Mock Supabase client
vi.mock('./lib/supabase', () => ({
        supabase: {
                from: vi.fn(() => ({
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        in: vi.fn().mockReturnThis(),
                        order: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        range: vi.fn().mockReturnThis(),
                        single: vi.fn().mockReturnThis(),
                        then: vi.fn((resolve) => resolve({ data: [], count: 0, error: null })),
                })),
                auth: {
                        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
                        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
                        signInWithPassword: vi.fn(),
                        signOut: vi.fn(),
                },
        },
}));

// Mock matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
        })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
}));
