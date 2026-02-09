/**
 * Tests for ErrorMessage x-request-id display
 * @description Validates that ErrorMessage shows requestId when provided
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage requestId display', () => {
  it('does not render Ref when requestId is absent', () => {
    render(<ErrorMessage message="Error generico" />);
    expect(screen.queryByText(/Ref:/)).not.toBeInTheDocument();
  });

  it('renders requestId when provided', () => {
    const rid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    render(<ErrorMessage message="Error del servidor" requestId={rid} />);

    expect(screen.getByText(/Ref:/)).toBeInTheDocument();
    expect(screen.getByText(rid)).toBeInTheDocument();
  });

  it('does not render Ref for empty string requestId', () => {
    render(<ErrorMessage message="Error" requestId="" />);
    expect(screen.queryByText(/Ref:/)).not.toBeInTheDocument();
  });
});
