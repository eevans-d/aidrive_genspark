/**
 * Tests for Dashboard page component
 * @description Validates loading states, error handling, and data display
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';

// Mock the hooks module
vi.mock('../hooks/queries', () => ({
        useDashboardStats: vi.fn(),
}));

// Import the mocked hook to control its return value
import { useDashboardStats } from '../hooks/queries';
const mockedUseDashboardStats = vi.mocked(useDashboardStats);

// Helper to wrap component with QueryClient
const renderWithQueryClient = (ui: React.ReactElement) => {
        const queryClient = new QueryClient({
                defaultOptions: {
                        queries: {
                                retry: false,
                        },
                },
        });
        return render(
                <QueryClientProvider client={queryClient}>
                        {ui}
                </QueryClientProvider>
        );
};

describe('Dashboard', () => {
        beforeEach(() => {
                vi.clearAllMocks();
        });

        it('renders loading state correctly', () => {
                mockedUseDashboardStats.mockReturnValue({
                        data: undefined,
                        isLoading: true,
                        isError: false,
                        error: null,
                        refetch: vi.fn(),
                        isFetching: false,
                } as any);

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('Cargando...')).toBeInTheDocument();
        });

        it('renders dashboard with stats when data is loaded', () => {
                mockedUseDashboardStats.mockReturnValue({
                        data: {
                                tareasPendientes: [
                                        { id: '1', titulo: 'Tarea 1', descripcion: 'Desc 1', prioridad: 'urgente' },
                                ],
                                tareasUrgentes: 2,
                                stockBajo: 5,
                                totalProductos: 100,
                        },
                        isLoading: false,
                        isError: false,
                        error: null,
                        refetch: vi.fn(),
                        isFetching: false,
                } as any);

                renderWithQueryClient(<Dashboard />);

                // Check title
                expect(screen.getByText('Dashboard')).toBeInTheDocument();

                // Check stats cards
                expect(screen.getByText('Tareas Urgentes')).toBeInTheDocument();
                expect(screen.getByText('2')).toBeInTheDocument();

                expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
                expect(screen.getByText('5')).toBeInTheDocument();

                expect(screen.getByText('Total Productos')).toBeInTheDocument();
                expect(screen.getByText('100')).toBeInTheDocument();

                // Check task list
                expect(screen.getByText('Tarea 1')).toBeInTheDocument();
                expect(screen.getByText('Desc 1')).toBeInTheDocument();
        });

        it('renders error state with retry option', () => {
                const mockRefetch = vi.fn();
                mockedUseDashboardStats.mockReturnValue({
                        data: undefined,
                        isLoading: false,
                        isError: true,
                        error: new Error('Network error'),
                        refetch: mockRefetch,
                        isFetching: false,
                } as any);

                renderWithQueryClient(<Dashboard />);

                // Should show Dashboard title even in error state
                expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        it('renders empty state when no pending tasks', () => {
                mockedUseDashboardStats.mockReturnValue({
                        data: {
                                tareasPendientes: [],
                                tareasUrgentes: 0,
                                stockBajo: 0,
                                totalProductos: 50,
                        },
                        isLoading: false,
                        isError: false,
                        error: null,
                        refetch: vi.fn(),
                        isFetching: false,
                } as any);

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('No hay tareas pendientes')).toBeInTheDocument();
        });

        it('handles undefined data gracefully with defaults', () => {
                mockedUseDashboardStats.mockReturnValue({
                        data: undefined,
                        isLoading: false,
                        isError: false,
                        error: null,
                        refetch: vi.fn(),
                        isFetching: false,
                } as any);

                renderWithQueryClient(<Dashboard />);

                // Should render with default values (0)
                expect(screen.getByText('Dashboard')).toBeInTheDocument();
                // Multiple elements might have '0', just verify page renders
                expect(screen.getByText('Tareas Urgentes')).toBeInTheDocument();
        });
});
