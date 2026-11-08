import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthProvider } from '../context/AuthContext';
import { TrackerProvider } from '../context/TrackerContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthModal } from '../components/auth/AuthModal';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../hooks/useAuth';
import { useTracker } from '../hooks/useTracker';

// Mock matchMedia and resizeObserver for test environment
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/');
});

// Helper component that consumes auth and tracker context
function DemoModeTestApp() {
  const { user, isDemoMode } = useAuth();
  const { transactions, autopays, budgetGoal, addTransaction } = useTracker();

  if (!user) {
    return (
      <div>
        <div data-testid="unauthenticated-view">Unauthenticated</div>
        <AuthModal />
      </div>
    );
  }

  return (
    <AppShell onOpenProfile={() => {}}>
      <div data-testid="authenticated-view">
        <span data-testid="demo-status">{isDemoMode ? 'IN_DEMO_MODE' : 'AUTHENTICATED'}</span>
        <span data-testid="tx-count">{transactions.length}</span>
        <span data-testid="autopay-count">{autopays.length}</span>
        <span data-testid="budget-limit">{budgetGoal.monthlyExpenseLimit}</span>
        <button
          data-testid="add-demo-tx-btn"
          onClick={() =>
            addTransaction({
              amount: 500,
              type: 'expense',
              category: 'Food & Dining',
              description: 'Demo Coffee',
              date: '2026-11-08',
              paymentMethod: 'upi',
              source: 'manual',
              isAnomaly: false,
            })
          }
        >
          Add Demo Transaction
        </button>
      </div>
    </AppShell>
  );
}

describe('Interactive Public Demo Mode (WEB-14)', () => {
  it('renders the "Explore Demo Mode" action in AuthModal', () => {
    render(
      <AuthProvider>
        <ToastProvider>
          <AuthModal />
        </ToastProvider>
      </AuthProvider>,
    );

    const demoBtn = screen.getByText(/Explore Demo Mode/i);
    expect(demoBtn).toBeInTheDocument();
  });

  it('clicking Explore Demo Mode transitions user into interactive session with populated data', async () => {
    render(
      <AuthProvider>
        <ToastProvider>
          <TrackerProvider>
            <DemoModeTestApp />
          </TrackerProvider>
        </ToastProvider>
      </AuthProvider>,
    );

    expect(screen.getByTestId('unauthenticated-view')).toBeInTheDocument();

    const demoBtn = screen.getByText(/Explore Demo Mode/i);
    fireEvent.click(demoBtn);

    // Should mount AppShell with demo banner and populated sample data
    await waitFor(() => {
      expect(screen.getByTestId('authenticated-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('demo-status')).toHaveTextContent('IN_DEMO_MODE');
    expect(screen.getByRole('alert')).toHaveTextContent(/Interactive Demo Mode/i);

    // Verify sample transactions, autopays, and budget are pre-seeded
    await waitFor(() => {
      const txCount = parseInt(screen.getByTestId('tx-count').textContent || '0', 10);
      expect(txCount).toBeGreaterThanOrEqual(5);
    });

    const autopayCount = parseInt(screen.getByTestId('autopay-count').textContent || '0', 10);
    expect(autopayCount).toBeGreaterThanOrEqual(1);

    const budgetLimit = parseInt(screen.getByTestId('budget-limit').textContent || '0', 10);
    expect(budgetLimit).toBeGreaterThan(0);
  });

  it('adding transactions in demo mode mutates state in session memory without network errors', async () => {
    render(
      <AuthProvider>
        <ToastProvider>
          <TrackerProvider>
            <DemoModeTestApp />
          </TrackerProvider>
        </ToastProvider>
      </AuthProvider>,
    );

    const demoBtn = screen.getByText(/Explore Demo Mode/i);
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.getByTestId('add-demo-tx-btn')).toBeInTheDocument();
    });

    const initialTxCount = parseInt(screen.getByTestId('tx-count').textContent || '0', 10);

    const addBtn = screen.getByTestId('add-demo-tx-btn');
    fireEvent.click(addBtn);

    await waitFor(() => {
      const newTxCount = parseInt(screen.getByTestId('tx-count').textContent || '0', 10);
      expect(newTxCount).toBe(initialTxCount + 1);
    });
  });

  it('clicking Create Account / Exit in the demo banner exits demo mode back to unauthenticated state', async () => {
    render(
      <AuthProvider>
        <ToastProvider>
          <TrackerProvider>
            <DemoModeTestApp />
          </TrackerProvider>
        </ToastProvider>
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText(/Explore Demo Mode/i));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Account \/ Exit/i })).toBeInTheDocument();
    });

    const exitBtn = screen.getByRole('button', { name: /Create Account \/ Exit/i });
    fireEvent.click(exitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('unauthenticated-view')).toBeInTheDocument();
    });
  });
});
