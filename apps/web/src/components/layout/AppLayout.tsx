import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTracker } from '../../hooks/useTracker';
import { getTabFromRoute } from '../../lib/routes';
import { ToastContainer } from '../common/ToastContainer';
import { ConfirmModal } from '../common/ConfirmModal';
import { AuthModal } from '../auth/AuthModal';
import { AppShell } from './AppShell';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { DashboardTab } from '../dashboard/DashboardTab';
import { ProfileModal } from '../profile/ProfileModal';

// Route-level lazy loading for secondary tabs (PERF-2)
const AddTransactionTab = lazy(() =>
  import('../transactions/AddTransactionTab').then((m) => ({ default: m.AddTransactionTab }))
);
const TransactionsTab = lazy(() =>
  import('../transactions/TransactionsTab').then((m) => ({ default: m.TransactionsTab }))
);
const AutopayTab = lazy(() =>
  import('../autopay/AutopayTab').then((m) => ({ default: m.AutopayTab }))
);
const AnalyticsTab = lazy(() =>
  import('../analytics/AnalyticsTab').then((m) => ({ default: m.AnalyticsTab }))
);

function TabLoadingFallback() {
  return (
    <div
      className="w-full py-16 flex flex-col items-center justify-center gap-3 animate-pulse"
      role="status"
      aria-label="Loading view"
    >
      <div className="w-8 h-8 rounded-full border-2 border-line-strong border-t-accent animate-spin" />
      <span className="text-xs text-ink-3">Loading view...</span>
    </div>
  );
}

/**
 * AppLayout (Phase 3 App Shell)
 * Wraps all existing screens inside the AppShell component without modifying
 * individual screen content yet. Swapped ToastContainer and ConfirmModal to
 * the new Toast and ConfirmDialog primitives while preserving context APIs.
 */
export function AppLayout() {
  const { user } = useAuth();
  const { currentTab } = useTracker();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Dynamic document.title when unauthenticated (UX-13)
  useEffect(() => {
    if (!user && typeof document !== 'undefined') {
      document.title = 'Sign In — MoneyTracker';
    }
  }, [user]);

  // Protected route deep-linking: preserve intended route on sign-out and reflect redirect param (AUTH-12)
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const targetTab = getTabFromRoute(window.location.pathname, window.location.hash, window.location.search);
      if (targetTab && targetTab !== 'dashboard') {
        try {
          sessionStorage.setItem('post_login_redirect', targetTab);
        } catch {
          // ignore session quota error
        }
        const searchParams = new URLSearchParams(window.location.search);
        if (!searchParams.get('redirect')) {
          try {
            window.history.replaceState({}, '', `/?redirect=/${targetTab}`);
          } catch {
            // ignore pushState error
          }
        }
      }
    }
  }, [user]);

  return (
    <>
      <ToastContainer />
      <ConfirmModal />

      {!user ? (
        <AuthModal />
      ) : (
        <>
          <AppShell onOpenProfile={() => setIsProfileOpen(true)}>
            <div id="appContainer" className="w-full">
              <ErrorBoundary>
                {currentTab === 'dashboard' && <DashboardTab />}
                <Suspense fallback={<TabLoadingFallback />}>
                  {currentTab === 'add-transaction' && <AddTransactionTab />}
                  {currentTab === 'transactions' && <TransactionsTab />}
                  {currentTab === 'autopay' && <AutopayTab />}
                  {currentTab === 'analytics' && <AnalyticsTab />}
                </Suspense>
              </ErrorBoundary>
            </div>
          </AppShell>

          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </>
      )}
    </>
  );
}

export default AppLayout;
