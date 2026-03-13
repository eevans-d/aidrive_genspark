/**
 * Setup file for React component testing with @testing-library
 */
import '@testing-library/jest-dom';
import { createElement, type ComponentProps } from 'react';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const ROUTER_FUTURE = {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
} as const;

vi.mock('react-router-dom', async (importActual) => {
        const actual = await importActual<typeof import('react-router-dom')>();

        return {
                ...actual,
                BrowserRouter: (props: ComponentProps<typeof actual.BrowserRouter>) =>
                        createElement(actual.BrowserRouter, {
                                ...props,
                                future: props.future ?? ROUTER_FUTURE,
                        }),
                MemoryRouter: (props: ComponentProps<typeof actual.MemoryRouter>) =>
                        createElement(actual.MemoryRouter, {
                                ...props,
                                future: props.future ?? ROUTER_FUTURE,
                        }),
        };
});

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

type MockSupabaseResult = {
        data: unknown[] | null;
        count: number | null;
        error: null;
};

function createSupabaseQueryBuilder(
        result: MockSupabaseResult = { data: [], count: 0, error: null },
) {
        const builder = {
                select: vi.fn(() => builder),
                eq: vi.fn(() => builder),
                neq: vi.fn(() => builder),
                in: vi.fn(() => builder),
                lt: vi.fn(() => builder),
                lte: vi.fn(() => builder),
                gt: vi.fn(() => builder),
                gte: vi.fn(() => builder),
                order: vi.fn(() => builder),
                limit: vi.fn(() => builder),
                range: vi.fn(() => builder),
                single: vi.fn(() => Promise.resolve({ data: result.data?.[0] ?? null, error: null })),
                maybeSingle: vi.fn(() => Promise.resolve({ data: result.data?.[0] ?? null, error: null })),
                then: <TResult1 = MockSupabaseResult, TResult2 = never>(
                        onfulfilled?: ((value: MockSupabaseResult) => TResult1 | PromiseLike<TResult1>) | null,
                        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
                ) => Promise.resolve(result).then(onfulfilled ?? undefined, onrejected ?? undefined),
                catch: <TResult = never>(
                        onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
                ) => Promise.resolve(result).catch(onrejected ?? undefined),
                finally: (onfinally?: (() => void) | null) => Promise.resolve(result).finally(onfinally ?? undefined),
        };

        return builder;
}

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Mock Supabase client
vi.mock('./lib/supabase', () => ({
        supabase: {
                from: vi.fn(() => createSupabaseQueryBuilder()),
                rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
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

// Mock ResizeObserver (must use class — arrow functions are not constructable)
global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
} as unknown as typeof ResizeObserver;

const originalGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = ((element: Element, pseudoElement?: string) =>
        originalGetComputedStyle(element, pseudoElement ? undefined : pseudoElement)) as typeof window.getComputedStyle;

window.addEventListener('error', (event) => {
        if (event.error instanceof Error && event.error.message === 'Test error') {
                event.preventDefault();
        }
});

Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value: vi.fn(() => ({
                canvas: document.createElement('canvas'),
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                getImageData: vi.fn(),
                putImageData: vi.fn(),
                createImageData: vi.fn(),
                setTransform: vi.fn(),
                drawImage: vi.fn(),
                save: vi.fn(),
                fillText: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                closePath: vi.fn(),
                stroke: vi.fn(),
                translate: vi.fn(),
                scale: vi.fn(),
                rotate: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                measureText: vi.fn(() => ({ width: 0 })),
                transform: vi.fn(),
                rect: vi.fn(),
                clip: vi.fn(),
        })),
});
