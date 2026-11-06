import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTracker } from '../../hooks/useTracker';
import { ToastContainer } from '../common/ToastContainer';
import { ConfirmModal } from '../common/ConfirmModal';
import { AuthModal } from '../auth/AuthModal';
import { AppShell } from './AppShell';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { DashboardTab } from '../dashboard/DashboardTab';
import { AddTransactionTab } from '../transactions/AddTransactionTab';
import { TransactionsTab } from '../transactions/TransactionsTab';
import { AutopayTab } from '../autopay/AutopayTab';
import { AnalyticsTab } from '../analytics/AnalyticsTab';
import { ProfileModal } from '../profile/ProfileModal';

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
                {currentTab === 'add-transaction' && <AddTransactionTab />}
                {currentTab === 'transactions' && <TransactionsTab />}
                {currentTab === 'autopay' && <AutopayTab />}
                {currentTab === 'analytics' && <AnalyticsTab />}
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
