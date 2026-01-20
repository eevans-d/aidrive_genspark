import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Layout from '@/components/Layout';
import { MemoryRouter } from 'react-router-dom';

// Mock hooks
const mockSignOut = vi.fn();
const mockUseUserRole = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
                user: { email: 'admin@example.com', user_metadata: { nombre: 'Admin' } },
                signOut: mockSignOut
        })
}));

vi.mock('@/hooks/useUserRole', () => ({
        useUserRole: () => mockUseUserRole()
}));

describe('Layout Component (Sidebar)', () => {
        beforeEach(() => {
                vi.clearAllMocks();
                // Default to admin
                mockUseUserRole.mockReturnValue({
                        role: 'admin',
                        canAccess: () => true
                });
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
                expect(screen.getByText('Dashboard')).toBeInTheDocument();
                expect(screen.getByText('Depósito')).toBeInTheDocument();
                expect(screen.getByText('Kardex')).toBeInTheDocument();
        });

        it('hides restricted items for restricted role', () => {
                // Override mock for this test
                mockUseUserRole.mockReturnValue({
                        role: 'user',
                        canAccess: (path: string) => path === '/' || path === '/stock' || path === '/tareas'
                });

                renderLayout();
                expect(screen.getByText('Dashboard')).toBeInTheDocument();
                expect(screen.queryByText('Depósito')).not.toBeInTheDocument();
                expect(screen.queryByText('Rentabilidad')).not.toBeInTheDocument();
        });
});
