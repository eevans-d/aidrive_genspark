import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Layout from '@/components/Layout';
import { MemoryRouter } from 'react-router-dom';

const { signOutMock, bitacoraCreateMock } = vi.hoisted(() => ({
        signOutMock: vi.fn(),
        bitacoraCreateMock: vi.fn().mockResolvedValue({ id: 'n1' }),
}));

// Mock useVerifiedRole first (dependency of useUserRole)
vi.mock('@/hooks/useVerifiedRole', () => ({
        useVerifiedRole: () => ({
                role: 'admin',
                loading: false,
                error: null,
                refetch: vi.fn()
        })
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
                user: { email: 'admin@example.com', user_metadata: { nombre: 'Admin' } },
                signOut: signOutMock
        })
}));

// Mock bitacoraApi to avoid hitting gateway in component tests
vi.mock('@/lib/apiClient', async (importOriginal) => {
        const actual = await importOriginal<typeof import('@/lib/apiClient')>();
        return {
                ...actual,
                bitacoraApi: {
                        create: bitacoraCreateMock,
                        list: vi.fn(),
                },
        };
});

// Mock useAlertas
vi.mock('@/hooks/useAlertas', () => ({
        useAlertas: () => ({
                stockBajo: [],
                vencimientos: [],
                alertasPrecios: [],
                tareasVencidas: [],
                riesgoPerdida: [],
                margenBajo: [],
                oportunidadesCompra: [],
                ofertasSugeridas: [],
                totalAlertas: 3,
                isLoading: false
        })
}));

// Mock useScanListener
vi.mock('@/hooks/useScanListener', () => ({
        useScanListener: vi.fn()
}));

// Mock GlobalSearch
vi.mock('@/components/GlobalSearch', () => ({
        default: ({ isOpen }: { isOpen: boolean }) =>
                isOpen ? <div data-testid="global-search">GlobalSearch</div> : null
}));

// Mock AlertsDrawer
vi.mock('@/components/AlertsDrawer', () => ({
        default: ({ isOpen }: { isOpen: boolean }) =>
                isOpen ? <div data-testid="alerts-drawer">AlertsDrawer</div> : null
}));

describe('Layout Component (Sidebar)', () => {
        beforeEach(() => {
                vi.clearAllMocks();
        });

        const renderLayout = () => {
                return render(
                        <MemoryRouter>
                                <Layout>
                                        <div>Child Content</div>
                                </Layout>
                        </MemoryRouter>
                );
        };

        it('renders children content', () => {
                renderLayout();
                expect(screen.getByText('Child Content')).toBeInTheDocument();
        });

        it('renders navigation items for admin', () => {
                renderLayout();
                // Navigation items appear in both desktop sidebar and mobile bottom nav
                expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
                expect(screen.getAllByText('Stock').length).toBeGreaterThan(0);
                expect(screen.getAllByText('Tareas').length).toBeGreaterThan(0);
        });

        it('displays user information', () => {
                renderLayout();
                expect(screen.getByText('Admin')).toBeInTheDocument();
        });

        it('shows alerts badge with count', () => {
                renderLayout();
                expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('shows search button with Ctrl+K hint', () => {
                renderLayout();
                expect(screen.getByTitle('Buscar (Ctrl+K)')).toBeInTheDocument();
        });

        it('opens logout modal and allows exit without note', async () => {
                const user = userEvent.setup();
                renderLayout();

                await user.click(screen.getByTitle('Cerrar Sesión'));
                expect(screen.getByText('¿Algo que reportar?')).toBeInTheDocument();

                await user.click(screen.getByText('Salir sin nota'));
                expect(signOutMock).toHaveBeenCalledTimes(1);
        });

        it('saves bitacora note before signing out', async () => {
                const user = userEvent.setup();
                renderLayout();

                await user.click(screen.getByTitle('Cerrar Sesión'));
                const textarea = screen.getByRole('textbox');
                await user.type(textarea, 'Se rompió la heladera');

                await user.click(screen.getByText('Guardar y salir'));

                expect(bitacoraCreateMock).toHaveBeenCalledWith({
                        nota: 'Se rompió la heladera',
                        usuario_nombre: 'Admin',
                });
                expect(signOutMock).toHaveBeenCalledTimes(1);
        });
});
