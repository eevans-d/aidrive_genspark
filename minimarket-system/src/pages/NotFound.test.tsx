import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from '@/pages/NotFound';
import { BrowserRouter } from 'react-router-dom';

describe('NotFound Component', () => {
        const renderNotFound = () =>
                render(
                        <BrowserRouter>
                                <NotFound />
                        </BrowserRouter>
                );

        it('renders heading and description', () => {
                renderNotFound();
                expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
                expect(screen.getByText(/la ruta solicitada no existe/i)).toBeInTheDocument();
        });

        it('renders a link back to dashboard', () => {
                renderNotFound();
                const link = screen.getByRole('link', { name: /volver al dashboard/i });
                expect(link).toBeInTheDocument();
                expect(link).toHaveAttribute('href', '/');
        });
});
