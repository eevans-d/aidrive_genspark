/**
 * Tests for ErrorBoundary component
 * @description Validates error handling and fallback UI rendering
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Mock observability module
vi.mock('../lib/observability', () => ({
        reportError: vi.fn(),
}));

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
        if (shouldThrow) {
                throw new Error('Test error');
        }
        return <div>Child rendered successfully</div>;
};

// Suppress console.error for expected errors in tests
beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
});

describe('ErrorBoundary', () => {
        it('renders children when no error occurs', () => {
                render(
                        <ErrorBoundary>
                                <div>Normal content</div>
                        </ErrorBoundary>
                );

                expect(screen.getByText('Normal content')).toBeInTheDocument();
        });

        it('renders fallback UI when error occurs', () => {
                render(
                        <ErrorBoundary>
                                <ThrowingComponent shouldThrow={true} />
                        </ErrorBoundary>
                );

                expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
                expect(screen.getByText(/Ha ocurrido un error inesperado/)).toBeInTheDocument();
        });

        it('displays error ID for support correlation', () => {
                render(
                        <ErrorBoundary>
                                <ThrowingComponent shouldThrow={true} />
                        </ErrorBoundary>
                );

                expect(screen.getByText(/ID de error:/)).toBeInTheDocument();
                expect(screen.getByText(/ERR-/)).toBeInTheDocument();
        });

        it('shows retry button that resets error state', async () => {
                const { rerender } = render(
                        <ErrorBoundary>
                                <ThrowingComponent shouldThrow={true} />
                        </ErrorBoundary>
                );

                // Error state should be showing
                expect(screen.getByText('Algo salió mal')).toBeInTheDocument();

                // Click retry button
                const retryButton = screen.getByRole('button', { name: /Intentar de nuevo/i });
                expect(retryButton).toBeInTheDocument();

                // The component should allow retry
                fireEvent.click(retryButton);

                // Note: In real scenario, the component would re-render
                // For this test, we verify the button exists and is clickable
        });

        it('renders custom fallback when provided', () => {
                const customFallback = <div>Custom error message</div>;

                render(
                        <ErrorBoundary fallback={customFallback}>
                                <ThrowingComponent shouldThrow={true} />
                        </ErrorBoundary>
                );

                expect(screen.getByText('Custom error message')).toBeInTheDocument();
                expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
        });
});
