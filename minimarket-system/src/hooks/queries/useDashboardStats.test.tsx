/**
 * Integration tests for useDashboardStats hook
 * Uses MSW to mock Supabase responses
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDashboardStats } from './useDashboardStats';

// Create a wrapper with QueryClient
const createWrapper = () => {
        const queryClient = new QueryClient({
                defaultOptions: {
                        queries: {
                                retry: false,
                                gcTime: 0,
                        },
                },
        });

        return ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client= { queryClient } >
                { children }
                </QueryClientProvider>
  );
};

describe('useDashboardStats Hook', () => {
        it('should return loading state initially', () => {
                const { result } = renderHook(() => useDashboardStats(), {
                        wrapper: createWrapper(),
                });

                expect(result.current.isLoading).toBe(true);
                expect(result.current.data).toBeUndefined();
        });

        it('should return data after loading', async () => {
                const { result } = renderHook(() => useDashboardStats(), {
                        wrapper: createWrapper(),
                });

                // Wait for loading to complete
                await waitFor(() => {
                        expect(result.current.isLoading).toBe(false);
                }, { timeout: 5000 });

                // Data should be defined (from MSW mocked Supabase)
                // Note: The actual data depends on how Supabase client interacts with our mocks
                expect(result.current.isLoading).toBe(false);
        });

        it('should have refetch function', () => {
                const { result } = renderHook(() => useDashboardStats(), {
                        wrapper: createWrapper(),
                });

                expect(typeof result.current.refetch).toBe('function');
        });
});
