import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '@/pages/Login';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock the hook module BEFORE import
const mockSignIn = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
                signIn: mockSignIn,
                user: null,
                loading: false
        })
}));

describe('Login Component', () => {
        // Clear mocks
        beforeEach(() => {
                vi.clearAllMocks();
        });

        const renderLogin = () => {
                return render(
                        <BrowserRouter>
                                <Login />
                        </BrowserRouter>
                );
        };

        it('renders login form correctly', () => {
                renderLogin();
                expect(screen.getByText('Mini Market System')).toBeInTheDocument();
                expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
        });

        it('handles input changes', () => {
                renderLogin();
                const emailInput = screen.getByLabelText(/email/i);
                const passwordInput = screen.getByLabelText(/contraseña/i);

                fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
                fireEvent.change(passwordInput, { target: { value: 'password123' } });

                expect(emailInput).toHaveValue('test@example.com');
                expect(passwordInput).toHaveValue('password123');
        });

        it('handles form submission', async () => {
                mockSignIn.mockResolvedValue({}); // Success

                renderLogin();

                const emailInput = screen.getByLabelText(/email/i);
                const passwordInput = screen.getByLabelText(/contraseña/i);
                const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

                fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
                fireEvent.change(passwordInput, { target: { value: 'password123' } });

                fireEvent.click(submitButton);

                await waitFor(() => {
                        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
                });
        });
});
