import { useState, useEffect, useCallback } from 'react';
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
import { WalletIcon, UserIcon, LogOutIcon } from '../common/icons';
import { DesignSystemDevPage } from '../dev/DesignSystemDevPage';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { currentTab, setCurrentTab } = useTracker();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showDevDesignSystem, setShowDevDesignSystem] = useState(false);
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  const handleOpenAdd = useCallback(() => {
    if (window.innerWidth < 768) {
      setCurrentTab('add-transaction');
    } else {
      setIsSlideoverOpen(true);
    }
  }, [setCurrentTab]);

  // Global Keyboard Shortcut: 'N' to open Add Transaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        handleOpenAdd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenAdd]);

  // Dev preview toggle via URL hash #design
  useEffect(() => {
    const handleHash = () => {
      setShowDevDesignSystem(window.location.hash === '#design');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (!user) {
    return (
      <>
        <ToastContainer />
        <ConfirmModal />
        <AuthModal />
      </>
    );
  }

  if (showDevDesignSystem) {
    return (
      <>
        <ToastContainer />
        <ConfirmModal />
        <DesignSystemDevPage
          onBack={() => {
            window.location.hash = '';
            setShowDevDesignSystem(false);
          }}
        />
      </>
    );
  }

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Overview';
      case 'transactions':
        return 'Transactions Feed';
      case 'autopay':
        return 'Autopay & Recurring';
      case 'analytics':
        return 'Analytics & Insights';
      case 'add-transaction':
        return 'New Transaction';
      default:
        return 'Personal Finance';
    }
  };

  return (
    <div id="appContainer" className="min-h-screen bg-bg text-ink flex flex-col md:flex-row">
      <ToastContainer />
      <ConfirmModal />

      {/* Responsive Left Rail (232px on desktop, contents on mobile) */}
      <aside
        className="contents md:flex md:flex-col md:justify-between md:w-[232px] md:fixed md:inset-y-0 md:left-0 md:bg-surface md:border-r md:border-line md:z-40"
        aria-label="Sidebar Navigation"
      >
        <div>
          {/* Brand header */}
          <div className="hidden md:flex items-center gap-3 h-14 px-5 border-b border-line">
            <div className="flex items-center justify-center w-8 h-8 rounded-btn bg-accent text-white shadow-warm-1">
              <WalletIcon size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-body-sm font-semibold text-ink leading-tight">
                MoneyTracker
              </span>
              <span className="text-[11px] text-ink-3 leading-tight">Personal Finance</span>
            </div>
          </div>

          {/* Unified Navigation Tabs (rail on desktop, bottom bar on mobile) */}
          <div className="contents md:block md:pt-2">
            <NavigationTabs onAddTransaction={handleOpenAdd} />
          </div>
        </div>

        {/* Bottom Profile Rail Section (desktop only) */}
        <div className="hidden md:block p-3 border-t border-line bg-surface-2/40 space-y-2">
          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 p-2 rounded-btn hover:bg-surface transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center font-semibold text-caption border border-accent/20 shrink-0">
              {user.displayName ? (
                user.displayName.charAt(0).toUpperCase()
              ) : user.email ? (
                user.email.charAt(0).toUpperCase()
              ) : (
                <UserIcon size={15} />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-body-sm font-medium text-ink truncate">
                {user.displayName || 'Account Settings'}
              </span>
              <span className="text-[11px] text-ink-3 truncate">Preferences &amp; Security</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-caption text-ink-3">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#design';
                setShowDevDesignSystem(true);
              }}
              className="hover:text-accent transition-colors text-[11px]"
            >
              Tokens &amp; Specs
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="hover:text-danger flex items-center gap-1 transition-colors text-[11px]"
              title="Sign Out"
            >
              <LogOutIcon size={12} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 md:pl-[232px] flex flex-col min-h-screen">
        <Header
          title={getTabTitle()}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAdd={handleOpenAdd}
        />

        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8 pb-24 md:pb-12 transition-opacity duration-160">
          {currentTab === 'dashboard' && <DashboardTab />}
          {currentTab === 'add-transaction' && <AddTransactionTab />}
          {currentTab === 'transactions' && <TransactionsTab />}
          {currentTab === 'autopay' && <AutopayTab />}
          {currentTab === 'analytics' && <AnalyticsTab />}
        </main>
      </div>

      {/* Slide-over panel for Add Transaction on desktop */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-base"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-surface border-l border-line shadow-warm-3 h-full overflow-y-auto p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
              <h2 className="font-display text-section-title font-semibold text-ink">
                New Transaction
              </h2>
              <button
                type="button"
                onClick={() => setIsSlideoverOpen(false)}
                className="p-1.5 rounded-btn hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>
            <AddTransactionTab onSuccess={() => setIsSlideoverOpen(false)} />
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
