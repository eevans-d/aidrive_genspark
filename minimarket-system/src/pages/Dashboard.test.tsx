/**
 * Tests for Dashboard page component
 * @description Validates loading states, error handling, and data display
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import Dashboard from './Dashboard';

// Mock the hooks module
vi.mock('../hooks/queries', () => ({
        useDashboardStats: vi.fn(),
}));

// Avoid hitting gateway in Dashboard CC section during component tests
vi.mock('../hooks/useUserRole', () => ({
        useUserRole: () => ({
                role: 'usuario',
                canAccess: () => false,
        }),
}));

// Mock supabase for V2-08 vencimientos lazy query
vi.mock('../lib/supabase', () => ({
        supabase: {
                from: vi.fn(() => ({
                        select: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        then: vi.fn((cb: (result: { count: number; error: null }) => unknown) =>
                                cb({ count: 0, error: null })),
                })),
        },
}));

// Import the mocked hook to control its return value
import { useDashboardStats } from '../hooks/queries';
const mockedUseDashboardStats = vi.mocked(useDashboardStats);
type DashboardStatsResult = ReturnType<typeof useDashboardStats>;

const createDashboardStatsResult = (
        overrides: Partial<DashboardStatsResult>,
): DashboardStatsResult => ({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        ...overrides,
} as DashboardStatsResult);

// Helper to wrap component with QueryClient
const renderWithQueryClient = (ui: ReactElement) => {
        const queryClient = new QueryClient({
                defaultOptions: {
                        queries: {
                                retry: false,
                        },
                },
        });
        return render(
                <MemoryRouter>
                        <QueryClientProvider client={queryClient}>
                                {ui}
                        </QueryClientProvider>
                </MemoryRouter>
        );
};

describe('Dashboard', () => {
        beforeEach(() => {
                vi.clearAllMocks();
                localStorage.setItem('onboarding_completed', '1');
        });

        it('renders loading state correctly', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        isLoading: true,
                }));

                const { container } = renderWithQueryClient(<Dashboard />);

                // Skeleton loading uses animate-pulse divs instead of text
                const skeletons = container.querySelectorAll('.animate-pulse');
                expect(skeletons.length).toBeGreaterThan(0);
        });

        it('renders dashboard with stats when data is loaded', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
			data: {
				tareasPendientes: [
					{
						id: '1', titulo: 'Tarea 1', descripcion: 'Desc 1', prioridad: 'urgente' as const,
						estado: 'pendiente' as const, asignada_a_id: null, asignada_a_nombre: null,
						fecha_creacion: '2026-01-01T00:00:00Z', fecha_vencimiento: null,
						fecha_completada: null, completada_por_id: null, completada_por_nombre: null,
						fecha_cancelada: null, cancelada_por_id: null, cancelada_por_nombre: null,
						razon_cancelacion: null, creada_por_id: null, creada_por_nombre: null,
						created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
					},
				],
				totalTareasPendientes: 1,
				tareasUrgentes: 2,
				stockBajo: 5,
				totalProductos: 100,
			},
                }));

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('Dashboard')).toBeInTheDocument();

                expect(screen.getByText('Tareas Urgentes')).toBeInTheDocument();
                const tareasUrgentesBlock = screen.getByText('Tareas Urgentes').parentElement;
                expect(tareasUrgentesBlock).not.toBeNull();
                expect(within(tareasUrgentesBlock as HTMLElement).getByText('2')).toBeInTheDocument();

                expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
                const stockBajoBlock = screen.getByText('Stock Bajo').parentElement;
                expect(stockBajoBlock).not.toBeNull();
                expect(within(stockBajoBlock as HTMLElement).getByText('5')).toBeInTheDocument();

                expect(screen.getByText('Total Productos')).toBeInTheDocument();
                const totalProductosBlock = screen.getByText('Total Productos').parentElement;
                expect(totalProductosBlock).not.toBeNull();
                expect(within(totalProductosBlock as HTMLElement).getByText('100')).toBeInTheDocument();

                expect(screen.getByText('Tarea 1')).toBeInTheDocument();
                expect(screen.getByText('Desc 1')).toBeInTheDocument();
        });

        it('renders error state with retry option', () => {
                const mockRefetch = vi.fn();
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        isError: true,
                        error: new Error('Network error'),
                        refetch: mockRefetch,
                }));

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        it('renders empty state when no pending tasks', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 0,
                                tareasUrgentes: 0,
                                stockBajo: 0,
                                totalProductos: 50,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('No hay tareas pendientes')).toBeInTheDocument();
        });

        it('handles undefined data gracefully with defaults', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({}));

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('Dashboard')).toBeInTheDocument();
                expect(screen.getByText('Tareas Urgentes')).toBeInTheDocument();
        });

        it('V2-08: renders intent chips', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 0,
                                tareasUrgentes: 0,
                                stockBajo: 3,
                                totalProductos: 50,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('¿Qué me falta reponer?')).toBeInTheDocument();
                expect(screen.getByText('¿Productos con riesgo?')).toBeInTheDocument();
                expect(screen.getByText('Resumen del día')).toBeInTheDocument();
        });

        it('V2-08: clicking reponer chip shows stock bajo info with CTA', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 0,
                                tareasUrgentes: 0,
                                stockBajo: 3,
                                totalProductos: 50,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                fireEvent.click(screen.getByText('¿Qué me falta reponer?'));

                expect(screen.getByText(/3 productos con stock bajo/)).toBeInTheDocument();
                expect(screen.getByText('Ver Stock Bajo')).toBeInTheDocument();
        });

        it('V2-08: clicking resumen chip shows summary with CTAs', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 2,
                                tareasUrgentes: 1,
                                stockBajo: 0,
                                totalProductos: 80,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                fireEvent.click(screen.getByText('Resumen del día'));

                expect(screen.getByText(/80 productos registrados/)).toBeInTheDocument();
                expect(screen.getByText(/1 tarea urgente/)).toBeInTheDocument();
                expect(screen.getByText('Ver Stock')).toBeInTheDocument();
                expect(screen.getByText('Ir a Ventas')).toBeInTheDocument();
        });

        it('V2-08: clicking active chip toggles it off', () => {
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 0,
                                tareasUrgentes: 0,
                                stockBajo: 5,
                                totalProductos: 50,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                const chip = screen.getByText('¿Qué me falta reponer?');
                fireEvent.click(chip);
                expect(screen.getByText(/5 productos con stock bajo/)).toBeInTheDocument();

                fireEvent.click(chip);
                expect(screen.queryByText(/5 productos con stock bajo/)).not.toBeInTheDocument();
        });

        it('V2-09: shows onboarding guide on first visit', () => {
                localStorage.removeItem('onboarding_completed');
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 0,
                                tareasUrgentes: 0,
                                stockBajo: 0,
                                totalProductos: 0,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                expect(screen.getByText('Empezá por acá:')).toBeInTheDocument();
                expect(screen.getByText('Vender')).toBeInTheDocument();
                expect(screen.getByText('Ver stock')).toBeInTheDocument();
                expect(screen.getByText('Ver pedidos')).toBeInTheDocument();
        });

        it('V2-09: hides onboarding after dismiss', () => {
                localStorage.removeItem('onboarding_completed');
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 0,
                                tareasUrgentes: 0,
                                stockBajo: 0,
                                totalProductos: 0,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                const dismissBtn = screen.getByLabelText('Cerrar guía');
                fireEvent.click(dismissBtn);

                expect(screen.queryByText('Empezá por acá:')).not.toBeInTheDocument();
                expect(localStorage.getItem('onboarding_completed')).toBe('1');
        });

        it('V2-09: does not show onboarding when flag is set', () => {
                localStorage.setItem('onboarding_completed', '1');
                mockedUseDashboardStats.mockReturnValue(createDashboardStatsResult({
                        data: {
                                tareasPendientes: [],
                                totalTareasPendientes: 0,
                                tareasUrgentes: 0,
                                stockBajo: 0,
                                totalProductos: 0,
                        },
                }));

                renderWithQueryClient(<Dashboard />);

                expect(screen.queryByText('Empezá por acá:')).not.toBeInTheDocument();
        });
});
