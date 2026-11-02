import { useState, useEffect } from 'react';
import { AuthContext, type AuthContextValue } from '../../context/authContextDef';
import { TrackerContext, type TrackerContextValue } from '../../context/trackerContextDef';
import { ToastContext } from '../../context/toastContextDef';
import { ConfirmContext } from '../../context/confirmContextDef';
import { AppShell } from '../layout/AppShell';
import { DashboardTab } from '../dashboard/DashboardTab';
import { TransactionsTab } from '../transactions/TransactionsTab';
import { AutopayTab } from '../autopay/AutopayTab';
import { AnalyticsTab } from '../analytics/AnalyticsTab';
import { AuthModal } from '../auth/AuthModal';
import { ProfileModal } from '../profile/ProfileModal';
import type { UserProfile, Transaction, AutopayPlan, BudgetGoal } from '../../types';

export type AuditScreen = 'dashboard' | 'transactions' | 'autopay' | 'analytics' | 'auth' | 'profile';
export type AuditState = 'loading' | 'empty' | 'error' | 'populated';

const mockUser: UserProfile = {
  uid: 'usr_audit_123',
  email: 'dhruv@example.com',
  displayName: 'Dhruv B',
  authMethod: 'password',
  createdAt: '2026-01-15T10:00:00.000Z',
  lastSignIn: '2026-11-02T18:00:00.000Z',
  hasPassword: true,
};

const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    type: 'income',
    amount: 125000,
    category: 'Salary',
    paymentMethod: 'bank_transfer',
    description: 'Monthly Engineering Salary',
    date: '2026-11-01',
  },
  {
    id: 'tx_2',
    type: 'expense',
    amount: 12450,
    category: 'Groceries',
    paymentMethod: 'upi',
    description: 'Organic Harvest & Supermarket',
    date: '2026-11-02',
  },
  {
    id: 'tx_3',
    type: 'expense',
    amount: 3200,
    category: 'Food & Dining',
    paymentMethod: 'credit_card',
    description: 'Weekend Bistro with Friends',
    date: '2026-11-02',
  },
  {
    id: 'tx_4',
    type: 'expense',
    amount: 1999,
    category: 'Utilities',
    paymentMethod: 'upi',
    description: 'Fibre Broadband Monthly',
    date: '2026-10-30',
  },
  {
    id: 'tx_5',
    type: 'expense',
    amount: 8500,
    category: 'Shopping',
    paymentMethod: 'credit_card',
    description: 'Mechanical Keyboard & Accessories',
    date: '2026-10-28',
  },
];

const mockAutopays: AutopayPlan[] = [
  {
    id: 'ap_1',
    name: 'Broadband Internet',
    amount: 1999,
    type: 'expense',
    category: 'Utilities',
    day: 5,
    active: true,
    description: 'High-speed gigabit fiber connection',
  },
  {
    id: 'ap_2',
    name: 'Netflix 4K Premium',
    amount: 649,
    type: 'expense',
    category: 'Entertainment',
    day: 15,
    active: true,
  },
  {
    id: 'ap_3',
    name: 'Health Club Gym Membership',
    amount: 3500,
    type: 'expense',
    category: 'Health',
    day: 1,
    active: false,
    description: 'Monthly gym subscription',
  },
];

const mockBudget: BudgetGoal = {
  monthlyExpenseLimit: 50000,
  thresholdPercent: 80,
};

export function StateAuditDevPage() {
  const [screen, setScreen] = useState<AuditScreen>('dashboard');
  const [state, setState] = useState<AuditState>('populated');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sync state from URL hash or query params
  useEffect(() => {
    const parseUrl = () => {
      const hash = window.location.hash || '';
      const queryIdx = hash.indexOf('?');
      let params = new URLSearchParams(window.location.search);
      if (queryIdx !== -1) {
        params = new URLSearchParams(hash.substring(queryIdx));
      }
      const s = params.get('screen') as AuditScreen | null;
      const st = params.get('state') as AuditState | null;
      if (s) setScreen(s);
      if (st) setState(st);
    };

    parseUrl();
    window.addEventListener('hashchange', parseUrl);
    return () => window.removeEventListener('hashchange', parseUrl);
  }, []);

  const authValue: AuthContextValue = {
    user: screen === 'auth' ? null : mockUser,
    loading: screen === 'auth' && state === 'loading',
    signInWithEmail: async () => {},
    signInWithGoogle: async () => {},
    signUpWithEmail: async () => {},
    signOut: async () => {},
    sendPasswordReset: async () => {},
    updateDisplayName: async () => {},
    updatePassword: async () => {},
    deleteAccount: async () => {},
  };

  const toastValue = {
    toasts: [],
    showToast: () => {},
    dismissToast: () => {},
  };

  const confirmValue = {
    confirmState: {
      isOpen: false,
      title: 'Confirm',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'warning' as const,
    },
    showConfirm: async () => true,
    handleConfirm: () => {},
    handleCancel: () => {},
  };

  const trackerValue: TrackerContextValue = {
    currentTab: screen === 'auth' || screen === 'profile' ? 'dashboard' : screen,
    setCurrentTab: (tab) => {
      if (tab !== 'add-transaction') setScreen(tab as AuditScreen);
    },
    transactions:
      state === 'empty' || state === 'loading'
        ? []
        : mockTransactions,
    categories: {
      income: ['Salary', 'Investments', 'Freelance'],
      expense: ['Groceries', 'Food & Dining', 'Utilities', 'Shopping', 'Entertainment', 'Health'],
    },
    approvedAnomalies: [],
    autopays: state === 'empty' || state === 'loading' ? [] : mockAutopays,
    budgetGoal: mockBudget,
    isOnline: true,
    isLoading: state === 'loading',
    loadError:
      state === 'error'
        ? `Failed to load ${screen} data from server. Please retry.`
        : null,
    addTransaction: async () => true,
    deleteTransaction: async () => true,
    importTransactions: async () => true,
    addCustomCategory: async () => true,
    approveAnomaly: async () => true,
    dismissAnomaly: async () => true,
    addAutopay: async () => true,
    deleteAutopay: async () => true,
    toggleAutopay: async () => true,
    updateBudgetGoal: async () => true,
    refreshData: async () => {},
  };

  const screens: AuditScreen[] = ['dashboard', 'transactions', 'autopay', 'analytics', 'auth', 'profile'];
  const states: AuditState[] = ['populated', 'loading', 'empty', 'error'];

  return (
    <AuthContext.Provider value={authValue}>
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            <div className="min-h-screen bg-bg text-ink flex flex-col">
              {/* Dev Toolbar */}
              <div
                id="auditToolbar"
                className="sticky top-0 z-50 bg-surface border-b border-line px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-accent uppercase tracking-wider">State Audit:</span>
                  <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-btn">
                    {screens.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setScreen(s);
                          window.location.hash = `#audit?screen=${s}&state=${state}`;
                        }}
                        className={`px-2.5 py-1 rounded-chip font-medium capitalize transition-colors ${
                          screen === s ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-ink-3">State:</span>
                  <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-btn">
                    {states.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setState(st);
                          window.location.hash = `#audit?screen=${screen}&state=${st}`;
                        }}
                        className={`px-2.5 py-1 rounded-chip font-medium capitalize transition-colors ${
                          state === st ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <a
                    href="#design"
                    className="ml-2 text-accent hover:underline font-medium"
                  >
                    Tokens &rarr;
                  </a>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 w-full">
                {screen === 'auth' ? (
                  <AuthModal />
                ) : (
                  <>
                    <AppShell onOpenProfile={() => setIsProfileOpen(true)}>
                      <div id="auditContentContainer" className="w-full">
                        {screen === 'dashboard' && <DashboardTab />}
                        {screen === 'transactions' && <TransactionsTab />}
                        {screen === 'autopay' && <AutopayTab />}
                        {screen === 'analytics' && <AnalyticsTab />}
                      </div>
                    </AppShell>

                    <ProfileModal
                      isOpen={screen === 'profile' || isProfileOpen}
                      onClose={() => {
                        setIsProfileOpen(false);
                        if (screen === 'profile') setScreen('dashboard');
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

export default StateAuditDevPage;
