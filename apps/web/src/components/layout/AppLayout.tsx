import { useState, lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTracker } from '../../hooks/useTracker';
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
