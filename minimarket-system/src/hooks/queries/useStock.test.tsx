/**
 * Integration tests for useStock hook
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useStock } from './useStock';

const createWrapper = () => {
        const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        return ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
};

describe('useStock Hook', () => {
        it('should return loading state initially', () => {
                const { result } = renderHook(() => useStock(), { wrapper: createWrapper() });
                expect(result.current.isLoading).toBe(true);
        });

        it('should complete loading', async () => {
                const { result } = renderHook(() => useStock(), { wrapper: createWrapper() });
                await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
                expect(result.current.isLoading).toBe(false);
        });

        it('should have refetch function', () => {
                const { result } = renderHook(() => useStock(), { wrapper: createWrapper() });
                expect(typeof result.current.refetch).toBe('function');
        });
});
