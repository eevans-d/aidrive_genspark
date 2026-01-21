/**
 * Tests para useProveedores hook
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProveedores } from './useProveedores';

const createWrapper = () => {
        const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        return ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
};

describe('useProveedores Hook', () => {
        it('retorna estado de carga inicial', () => {
                const { result } = renderHook(() => useProveedores(), { wrapper: createWrapper() });
                expect(result.current.isLoading).toBe(true);
        });

        it('acepta filtro por activos', () => {
                const { result } = renderHook(
                        () => useProveedores({ soloActivos: true }),
                        { wrapper: createWrapper() }
                );
                expect(result.current.isLoading).toBe(true);
        });

        it('completa la carga', async () => {
                const { result } = renderHook(() => useProveedores(), { wrapper: createWrapper() });
                await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
        });
});
