/**
 * Tests para useKardex hook
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useKardex } from './useKardex';

const createWrapper = () => {
        const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        return ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
};

describe('useKardex Hook', () => {
        it('retorna estado de carga inicial', () => {
                const { result } = renderHook(() => useKardex(), { wrapper: createWrapper() });
                expect(result.current.isLoading).toBe(true);
        });

        it('acepta filtro por producto', () => {
                const { result } = renderHook(
                        () => useKardex({ productoId: 'prod-123' }),
                        { wrapper: createWrapper() }
                );
                expect(result.current.isLoading).toBe(true);
        });

        it('completa la carga', async () => {
                const { result } = renderHook(() => useKardex(), { wrapper: createWrapper() });
                await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
        });
});
