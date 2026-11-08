import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext, type AuthContextValue } from '../../context/authContextDef';
import { TrackerContext, type TrackerContextValue } from '../../context/trackerContextDef';
import { ToastContext } from '../../context/toastContextDef';
import { ConfirmContext, type ConfirmState, type ConfirmOptions } from '../../context/confirmContextDef';
import { ConfirmModal } from '../common/ConfirmModal';
import { ToastContainer } from '../common/ToastContainer';
import { AppShell } from '../layout/AppShell';
import { DashboardTab } from '../dashboard/DashboardTab';
import { TransactionsTab } from '../transactions/TransactionsTab';
import { AutopayTab } from '../autopay/AutopayTab';
import { AnalyticsTab } from '../analytics/AnalyticsTab';
import { AddTransactionTab } from '../transactions/AddTransactionTab';
import { AuthModal } from '../auth/AuthModal';
import { ProfileModal } from '../profile/ProfileModal';
import type { UserProfile, Transaction, AutopayPlan, BudgetGoal, ToastItem } from '../../types';

export type AuditScreen = 'dashboard' | 'transactions' | 'autopay' | 'analytics' | 'add-transaction' | 'auth' | 'profile';
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
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed'>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('sidebar=collapsed')) {
      return 'collapsed';
    }
    return 'expanded';
  });
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
      const sb = params.get('sidebar');
      if (s) setScreen(s);
      if (st) setState(st);
      if (sb === 'collapsed') setSidebarMode('collapsed');
      else if (sb === 'expanded') setSidebarMode('expanded');
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
    resendVerificationEmail: async () => {},
    reloadUser: async () => null,
    reauthenticate: async () => {},
  };

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: any = 'info', duration = 3000, action?: any) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration, action }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastValue = {
    toasts,
    showToast,
    dismissToast,
  };

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: 'Confirm',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
  });
  const confirmResolverRef = useRef<((val: boolean) => void) | null>(null);

  const showConfirm = useCallback((message: string, options?: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        isOpen: true,
        message,
        title: options?.title || 'Confirm',
        confirmText: options?.confirmText || 'Confirm',
        cancelText: options?.cancelText || 'Cancel',
        variant: options?.variant || 'warning',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    confirmResolverRef.current?.(true);
    confirmResolverRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    confirmResolverRef.current?.(false);
    confirmResolverRef.current = null;
  }, []);

  const confirmValue = {
    confirmState,
    showConfirm,
    handleConfirm,
    handleCancel,
  };

  const trackerValue: TrackerContextValue = {
    currentTab: screen === 'auth' || screen === 'profile' ? 'dashboard' : (screen as any),
    setCurrentTab: (tab: any) => {
      if (['dashboard', 'transactions', 'autopay', 'analytics'].includes(tab)) {
        setScreen(tab);
        window.location.hash = `#audit?screen=${tab}&state=${state}&sidebar=${sidebarMode}`;
      }
    },
    transactions: state === 'empty' ? [] : mockTransactions,
    categories: {
      income: ['Salary', 'Investments', 'Freelance'],
      expense: ['Groceries', 'Food & Dining', 'Utilities', 'Shopping', 'Entertainment', 'Transport'],
    },
    approvedAnomalies: [],
    autopays: state === 'empty' ? [] : mockAutopays,
    budgetGoal: mockBudget,
    isOnline: state !== 'error',
    isLoading: state === 'loading',
    pendingSyncCount: 0,
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
  };

  const screens: AuditScreen[] = ['dashboard', 'transactions', 'autopay', 'analytics', 'add-transaction', 'auth', 'profile'];
  const states: AuditState[] = ['populated', 'loading', 'empty', 'error'];

  return (
    <AuthContext.Provider value={authValue}>
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            <ToastContainer />
            <ConfirmModal />
            <div
              className="min-h-screen bg-bg text-ink flex flex-col"
              style={{ '--shell-top-offset': '37px' } as React.CSSProperties}
            >
              {/* Dev Toolbar */}
              <div
                id="auditToolbar"
                className="sticky top-0 z-50 bg-surface border-b border-line px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs max-w-full overflow-hidden"
              >
                <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-0.5 min-w-0 w-full sm:w-auto">
                  <span className="font-semibold text-accent uppercase tracking-wider shrink-0">State Audit:</span>
                  <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-btn shrink-0">
                    {screens.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setScreen(s);
                          window.location.hash = `#audit?screen=${s}&state=${state}&sidebar=${sidebarMode}`;
                        }}
                        className={`px-2.5 py-1 rounded-chip font-medium capitalize transition-colors shrink-0 ${
                          screen === s ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 max-w-full overflow-x-auto">
                  <span className="text-ink-3 shrink-0">State:</span>
                  <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-btn shrink-0">
                    {states.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setState(st);
                          window.location.hash = `#audit?screen=${screen}&state=${st}&sidebar=${sidebarMode}`;
                        }}
                        className={`px-2.5 py-1 rounded-chip font-medium capitalize transition-colors shrink-0 ${
                          state === st ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Sidebar Expand / Collapse Toggle in Toolbar */}
                  <span className="text-ink-3 shrink-0 ml-1">Sidebar:</span>
                  <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-btn shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSidebarMode('expanded');
                        window.location.hash = `#audit?screen=${screen}&state=${state}&sidebar=expanded`;
                      }}
                      className={`px-2.5 py-1 rounded-chip font-medium capitalize transition-colors shrink-0 ${
                        sidebarMode === 'expanded' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSidebarMode('collapsed');
                        window.location.hash = `#audit?screen=${screen}&state=${state}&sidebar=collapsed`;
                      }}
                      className={`px-2.5 py-1 rounded-chip font-medium capitalize transition-colors shrink-0 ${
                        sidebarMode === 'collapsed' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      Closed
                    </button>
                  </div>

                  <a
                    href="#design"
                    className="ml-auto sm:ml-2 text-accent hover:underline font-medium shrink-0"
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
                    <AppShell
                      onOpenProfile={() => setIsProfileOpen(true)}
                      defaultSidebarCollapsed={sidebarMode === 'collapsed'}
                    >
                      <div id="auditContentContainer" className="w-full">
                        {screen === 'dashboard' && <DashboardTab />}
                        {screen === 'transactions' && <TransactionsTab />}
                        {screen === 'autopay' && <AutopayTab />}
                        {screen === 'analytics' && <AnalyticsTab />}
                        {screen === 'add-transaction' && <AddTransactionTab />}
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
