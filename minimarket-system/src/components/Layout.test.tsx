import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Layout from '@/components/Layout';
import { MemoryRouter } from 'react-router-dom';

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
                signOut: vi.fn()
        })
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
                expect(screen.getAllByText('Depósito').length).toBeGreaterThan(0);
                expect(screen.getAllByText('Kardex').length).toBeGreaterThan(0);
        });

        it('displays user information', () => {
                renderLayout();
                expect(screen.getByText('Admin')).toBeInTheDocument();
        });
});
