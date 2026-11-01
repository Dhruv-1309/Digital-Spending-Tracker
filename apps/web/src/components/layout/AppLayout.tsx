import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTracker } from '../../hooks/useTracker';
import { ToastContainer } from '../common/ToastContainer';
import { ConfirmModal } from '../common/ConfirmModal';
import { AuthModal } from '../auth/AuthModal';
import { Header } from './Header';
import { NavigationTabs } from './NavigationTabs';
import { DashboardTab } from '../dashboard/DashboardTab';
import { AddTransactionTab } from '../transactions/AddTransactionTab';
import { TransactionsTab } from '../transactions/TransactionsTab';
import { AutopayTab } from '../autopay/AutopayTab';
import { AnalyticsTab } from '../analytics/AnalyticsTab';
import { ProfileModal } from '../profile/ProfileModal';

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
          <div id="appContainer" className="container">
            <Header onOpenProfile={() => setIsProfileOpen(true)} />
            <NavigationTabs />

            {currentTab === 'dashboard' && <DashboardTab />}
            {currentTab === 'add-transaction' && <AddTransactionTab />}
            {currentTab === 'transactions' && <TransactionsTab />}
            {currentTab === 'autopay' && <AutopayTab />}
            {currentTab === 'analytics' && <AnalyticsTab />}
          </div>

          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </>
      )}
    </>
  );
}
