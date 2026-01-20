/**
 * Setup file for React component testing with @testing-library
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
