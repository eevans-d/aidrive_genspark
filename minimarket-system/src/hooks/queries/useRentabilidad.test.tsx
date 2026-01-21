/**
 * Tests para useRentabilidad hook
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRentabilidad } from './useRentabilidad';

const createWrapper = () => {
        const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        return ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
};

describe('useRentabilidad Hook', () => {
        it('retorna estado de carga inicial', () => {
                const { result } = renderHook(() => useRentabilidad(), { wrapper: createWrapper() });
                expect(result.current.isLoading).toBe(true);
        });

        it('tiene función refetch', () => {
                const { result } = renderHook(() => useRentabilidad(), { wrapper: createWrapper() });
                expect(typeof result.current.refetch).toBe('function');
        });

        it('completa la carga', async () => {
                const { result } = renderHook(() => useRentabilidad(), { wrapper: createWrapper() });
                await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
        });
});
