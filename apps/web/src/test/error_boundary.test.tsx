import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

function ProblematicComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated component crash');
  }
  return <div>Component rendered cleanly</div>;
}

describe('ErrorBoundary component (UX-3)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress React boundary console.error during test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Component rendered cleanly')).toBeInTheDocument();
  });

  it('catches render error and displays empathetic fallback UI with reload button', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Fallback UI should be rendered with role="alert"
    const alertBox = screen.getByRole('alert');
    expect(alertBox).toBeInTheDocument();

    expect(screen.getByText(/Something went unexpectedly wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('calls onError callback when error is trapped', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Simulated component crash' }),
      expect.any(Object),
    );
  });

  it('allows recovery when clicking Try Again', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Something went unexpectedly wrong/i)).toBeInTheDocument();

    // Reset error state and don't throw
    rerender(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(tryAgainBtn);

    expect(screen.getByText('Component rendered cleanly')).toBeInTheDocument();
  });
});
