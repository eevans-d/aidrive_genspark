import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '@/pages/Dashboard';

// Mock the query hook
const mockUseDashboardStats = vi.fn();

vi.mock('@/hooks/queries', () => ({
        useDashboardStats: () => mockUseDashboardStats()
}));

describe('Dashboard Component', () => {
        beforeEach(() => {
                vi.clearAllMocks();
        });

        it('renders loading state (Skeleton equivalent)', () => {
                mockUseDashboardStats.mockReturnValue({
                        data: null,
                        isLoading: true, // Should trigger "Cargando..."
                        isError: false,
                        error: null,
                        refetch: vi.fn(),
                        isFetching: true
                });

                render(<Dashboard />);

                expect(screen.getByText(/cargando/i)).toBeInTheDocument();
        });

        it('renders metrics when data is loaded', () => {
                mockUseDashboardStats.mockReturnValue({
                        data: {
                                tareasPendientes: [],
                                tareasUrgentes: 5,
                                stockBajo: 2,
                                totalProductos: 100
                        },
                        isLoading: false,
                        isError: false,
                        error: null,
                        refetch: vi.fn(),
                        isFetching: false
                });

                render(<Dashboard />);

                expect(screen.getByText('5')).toBeInTheDocument(); // Tareas Urgentes
                expect(screen.getByText('2')).toBeInTheDocument(); // Stock Bajo
                expect(screen.getByText('100')).toBeInTheDocument(); // Total Productos
                // Fix: There are two elements with "Tareas Pendientes", just check existence or length
                const elements = screen.getAllByText(/tareas pendientes/i);
                expect(elements.length).toBeGreaterThan(0);
        });
});
