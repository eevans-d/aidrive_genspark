/**
 * Tests para useProductos hook
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProductos } from './useProductos';

const createWrapper = () => {
        const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        return ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
};

describe('useProductos Hook', () => {
        it('acepta parámetro de página', () => {
                const { result } = renderHook(() => useProductos({ page: 1 }), { wrapper: createWrapper() });
                expect(result.current.isLoading).toBe(true);
        });

        it('acepta parámetro de búsqueda por código de barras', () => {
                const { result } = renderHook(
                        () => useProductos({ page: 1, barcodeSearch: '123456789' }),
                        { wrapper: createWrapper() }
                );
                expect(result.current.isLoading).toBe(true);
        });

        it('completa la carga', async () => {
                const { result } = renderHook(() => useProductos({ page: 1 }), { wrapper: createWrapper() });
                await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
        });
});
