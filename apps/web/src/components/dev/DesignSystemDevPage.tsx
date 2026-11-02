import { useState, useEffect } from 'react';
import {
  WalletIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  SearchIcon,
  FilterIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
  LockIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon,
  WifiIcon,
  WifiOffIcon,
  LayoutDashboardIcon,
  ArrowLeftRightIcon,
  CreditCardIcon,
  ClockIcon,
  BarChart2Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  MoreHorizontalIcon,
  GoogleIcon,
} from '../common/icons';
import { Button } from '../common/Button';
import { TextInput, AmountInput } from '../common/Input';
import { SegmentedControl } from '../common/SegmentedControl';
import { Badge, CategoryBadge } from '../common/Badge';
import { Card, MetricCard } from '../common/Card';
import { SkeletonCard, SkeletonTableRow } from '../common/Skeleton';
import { ProgressBar } from '../common/ProgressBar';
import { CustomSelect } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { AutopayDayPicker } from '../common/AutopayDayPicker';
import { Header } from '../layout/Header';
import { DashboardTab } from '../dashboard/DashboardTab';
import { TransactionsTab } from '../transactions/TransactionsTab';
import { AutopayTab } from '../autopay/AutopayTab';
import { AnalyticsTab } from '../analytics/AnalyticsTab';
import { AddTransactionTab } from '../transactions/AddTransactionTab';
import { ProfileModal } from '../profile/ProfileModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ToastContainer } from '../common/ToastContainer';
import { AuthContext } from '../../context/authContextDef';
import { TrackerContext, type TrackerContextValue } from '../../context/trackerContextDef';
import { ToastContext } from '../../context/toastContextDef';
import { ConfirmContext } from '../../context/confirmContextDef';
import type { UserProfile, Transaction, AutopayPlan, ToastItem, NavTab, ToastType, ToastAction } from '../../types';

const mockUser: UserProfile = {
  uid: 'demo_user_123',
  email: 'dhruv@moneytracker.app',
  displayName: 'Dhruv B',
  authMethod: 'Email/Password',
  createdAt: '2026-01-01',
  lastSignIn: '2026-11-02',
  hasPassword: true,
};

const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    amount: 1450,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'upi',
    description: 'Dinner with colleagues',
    date: '2026-11-02',
  },
  {
    id: 'tx_2',
    amount: 649,
    type: 'expense',
    category: 'Subscriptions',
    paymentMethod: 'card',
    description: 'Netflix Premium Plan',
    date: '2026-11-01',
    source: 'autopay',
  },
  {
    id: 'tx_3',
    amount: 85000,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'bank_transfer',
    description: 'Monthly Salary Credit',
    date: '2026-11-01',
  },
  {
    id: 'tx_4',
    amount: 3200,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'card',
    description: 'Winter Jacket',
    date: '2026-10-29',
  },
  {
    id: 'tx_5',
    amount: 450,
    type: 'expense',
    category: 'Transportation',
    paymentMethod: 'cash',
    description: 'Metro pass recharge',
    date: '2026-10-28',
  },
  {
    id: 'tx_6',
    amount: 12000,
    type: 'income',
    category: 'Investments',
    paymentMethod: 'bank_transfer',
    description: 'Quarterly Dividend',
    date: '2026-10-25',
  },
  {
    id: 'tx_7',
    amount: 2100,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'upi',
    description: 'Electricity Bill',
    date: '2026-10-20',
  },
];

const mockAutopays: AutopayPlan[] = [
  {
    id: 'auto_1',
    name: 'Netflix Premium',
    amount: 649,
    type: 'expense',
    category: 'Subscriptions',
    day: 1,
    active: true,
  },
  {
    id: 'auto_2',
    name: 'Apartment Rent',
    amount: 22000,
    type: 'expense',
    category: 'Rent',
    day: 5,
    active: true,
  },
  {
    id: 'auto_3',
    name: 'Monthly Retainer',
    amount: 35000,
    type: 'income',
    category: 'Salary',
    day: 1,
    active: true,
  },
  {
    id: 'auto_4',
    name: 'Gym Membership',
    amount: 1800,
    type: 'expense',
    category: 'Healthcare',
    day: 15,
    active: false,
  },
];

export function DesignSystemDevPage({ onBack }: { onBack?: () => void }) {
  const [currentView, setCurrentView] = useState<string>('tokens');

  // Interactive controls for primitives showcase
  const [segmentVal, setSegmentVal] = useState<'income' | 'expense'>('expense');
  const [selectVal, setSelectVal] = useState('food');
  const [dateVal, setDateVal] = useState('2026-11-02');
  const [dayVal, setDayVal] = useState<number | string>(5);
  const [amountVal, setAmountVal] = useState<number | string>(125000);
  const [textVal, setTextVal] = useState('');

  // Sample Toasts
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([
    {
      id: 'toast_1',
      message: 'Transaction saved successfully.',
      type: 'success',
      duration: 5000,
    },
    {
      id: 'toast_2',
      message: 'Deleted Grocery Store expense.',
      type: 'info',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {},
      },
    },
  ]);

  // Sync view with URL hash
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash;
      if (hash === '#design/dashboard') setCurrentView('dashboard');
      else if (hash === '#design/transactions') setCurrentView('transactions');
      else if (hash === '#design/add-transaction') setCurrentView('add-transaction');
      else if (hash === '#design/autopay') setCurrentView('autopay');
      else if (hash === '#design/analytics') setCurrentView('analytics');
      else if (hash === '#design/profile') setCurrentView('profile');
      else if (hash === '#design/confirm') setCurrentView('confirm');
      else if (hash === '#design/toast') setCurrentView('toast');
      else setCurrentView('tokens');
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const navigateTo = (view: string) => {
    setCurrentView(view);
  };

  const colorTokens = [
    { name: '--bg', hex: '#FAF7F2', varName: 'bg-bg text-ink' },
    { name: '--surface', hex: '#FFFFFF', varName: 'bg-surface text-ink border border-line' },
    { name: '--surface-2', hex: '#F3EEE6', varName: 'bg-surface-2 text-ink' },
    { name: '--line', hex: '#E6DFD3', varName: 'bg-line text-ink' },
    { name: '--line-strong', hex: '#D3C9B9', varName: 'bg-line-strong text-ink' },
    { name: '--ink', hex: '#1F1B16', varName: 'bg-ink text-white' },
    { name: '--ink-2', hex: '#5C554B', varName: 'bg-ink-2 text-white' },
    { name: '--ink-3', hex: '#766E62', varName: 'bg-ink-3 text-white' },
    { name: '--accent', hex: '#2A4FD6', varName: 'bg-accent text-white' },
    { name: '--accent-tint', hex: '#E6EBFB', varName: 'bg-accent-tint text-accent' },
    { name: '--income', hex: '#2E7D5B', varName: 'bg-income text-white' },
    { name: '--income-tint', hex: '#E4F2EA', varName: 'bg-income-tint text-income' },
    { name: '--warning', hex: '#9A6700', varName: 'bg-warning text-white' },
    { name: '--warning-tint', hex: '#F6E8C8', varName: 'bg-warning-tint text-warning' },
    { name: '--danger', hex: '#B3261E', varName: 'bg-danger text-white' },
    { name: '--danger-tint', hex: '#F8E1DE', varName: 'bg-danger-tint text-danger' },
  ];

  const categoryTokens = [
    'Food & Dining',
    'Shopping',
    'Utilities',
    'Entertainment',
    'Salary',
    'Investments',
    'Healthcare',
    'Transportation',
  ];

  const icons = [
    { name: 'Wallet', Component: WalletIcon },
    { name: 'ArrowDown', Component: ArrowDownIcon },
    { name: 'ArrowUp', Component: ArrowUpIcon },
    { name: 'Plus', Component: PlusIcon },
    { name: 'Trash', Component: TrashIcon },
    { name: 'Edit', Component: EditIcon },
    { name: 'Check', Component: CheckIcon },
    { name: 'X', Component: XIcon },
    { name: 'ChevronDown', Component: ChevronDownIcon },
    { name: 'ChevronUp', Component: ChevronUpIcon },
    { name: 'ChevronLeft', Component: ChevronLeftIcon },
    { name: 'ChevronRight', Component: ChevronRightIcon },
    { name: 'Calendar', Component: CalendarIcon },
    { name: 'Search', Component: SearchIcon },
    { name: 'Filter', Component: FilterIcon },
    { name: 'Settings', Component: SettingsIcon },
    { name: 'User', Component: UserIcon },
    { name: 'LogOut', Component: LogOutIcon },
    { name: 'Eye', Component: EyeIcon },
    { name: 'EyeOff', Component: EyeOffIcon },
    { name: 'Shield', Component: ShieldIcon },
    { name: 'Lock', Component: LockIcon },
    { name: 'AlertTriangle', Component: AlertTriangleIcon },
    { name: 'AlertCircle', Component: AlertCircleIcon },
    { name: 'CheckCircle', Component: CheckCircleIcon },
    { name: 'Sparkles', Component: SparklesIcon },
    { name: 'Download', Component: DownloadIcon },
    { name: 'Upload', Component: UploadIcon },
    { name: 'RefreshCw', Component: RefreshCwIcon },
    { name: 'Wifi', Component: WifiIcon },
    { name: 'WifiOff', Component: WifiOffIcon },
    { name: 'Dashboard', Component: LayoutDashboardIcon },
    { name: 'Transactions', Component: ArrowLeftRightIcon },
    { name: 'CreditCard', Component: CreditCardIcon },
    { name: 'Clock', Component: ClockIcon },
    { name: 'BarChart2', Component: BarChart2Icon },
    { name: 'TrendingUp', Component: TrendingUpIcon },
    { name: 'TrendingDown', Component: TrendingDownIcon },
    { name: 'MoreHorizontal', Component: MoreHorizontalIcon },
    { name: 'Google', Component: GoogleIcon },
  ];

  // Mock Providers for Full Screens
  const mockTrackerValue: TrackerContextValue = {
    currentTab: (['dashboard', 'transactions', 'add-transaction', 'autopay', 'analytics'].includes(currentView)
      ? currentView
      : 'dashboard') as NavTab,
    setCurrentTab: (tab) => navigateTo(tab),
    transactions: mockTransactions,
    categories: {
      income: ['Salary', 'Investments', 'Freelance'],
      expense: ['Food & Dining', 'Subscriptions', 'Utilities', 'Shopping', 'Transportation', 'Healthcare', 'Rent'],
    },
    approvedAnomalies: [],
    autopays: mockAutopays,
    budgetGoal: {
      monthlyExpenseLimit: 30000,
      thresholdPercent: 80,
    },
    isOnline: true,
    isLoading: false,
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

  const mockAuthValue = {
    user: mockUser,
    loading: false,
    signInWithEmail: async () => {},
    signUpWithEmail: async () => {},
    signInWithGoogle: async () => {},
    sendPasswordReset: async () => {},
    signOut: async () => {},
    updateDisplayName: async () => {},
    updatePassword: async () => {},
    deleteAccount: async () => {},
  };

  const mockToastValue = {
    toasts: activeToasts,
    showToast: (
      message: string,
      type: ToastType = 'info',
      duration: number = 4000,
      action?: ToastAction,
    ) => {
      setActiveToasts((prev) => [
        ...prev,
        { id: `t_${Date.now()}`, message, type, duration, action },
      ]);
    },
    dismissToast: (id: string) => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== id));
    },
  };

  const mockConfirmValue = {
    confirmState: {
      isOpen: currentView === 'confirm',
      message: 'Are you sure you want to delete this recurring plan? This action cannot be undone.',
      title: 'Delete Recurring Plan',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger' as const,
    },
    showConfirm: async () => true,
    handleConfirm: () => navigateTo('tokens'),
    handleCancel: () => navigateTo('tokens'),
  };

  return (
    <AuthContext.Provider value={mockAuthValue}>
      <ToastContext.Provider value={mockToastValue}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrackerContext.Provider value={mockTrackerValue}>
            <div className="min-h-screen bg-bg text-ink flex flex-col">
              {/* Sticky Dev Navigation Toolbar */}
              <nav className="sticky top-0 z-50 bg-surface border-b border-line px-4 py-2.5 shadow-warm-1 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-body-sm text-ink flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    Preview Switcher:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { id: 'tokens', label: 'Tokens' },
                      { id: 'dashboard', label: 'Dashboard' },
                      { id: 'transactions', label: 'Transactions' },
                      { id: 'add-transaction', label: 'Add Tx' },
                      { id: 'autopay', label: 'Autopay' },
                      { id: 'analytics', label: 'Analytics' },
                      { id: 'profile', label: 'Profile' },
                      { id: 'confirm', label: 'Confirm' },
                      { id: 'toast', label: 'Toast' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => navigateTo(tab.id)}
                        className={`px-2.5 py-1 text-caption font-semibold rounded-btn transition-colors ${
                          currentView === tab.id
                            ? 'bg-accent text-white shadow-warm-1'
                            : 'bg-surface-2 text-ink-2 hover:bg-line hover:text-ink'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {onBack && (
                  <Button variant="ghost" size="sm" onClick={onBack}>
                    Exit Preview
                  </Button>
                )}
              </nav>

              {/* Render Selected View */}
              {currentView === 'dashboard' && (
                <div className="flex-1 flex flex-col">
                  <Header title="Overview" onOpenProfile={() => navigateTo('profile')} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8">
                    <DashboardTab />
                  </main>
                </div>
              )}

              {currentView === 'transactions' && (
                <div className="flex-1 flex flex-col">
                  <Header title="Transactions Feed" onOpenProfile={() => navigateTo('profile')} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8">
                    <TransactionsTab />
                  </main>
                </div>
              )}

              {currentView === 'add-transaction' && (
                <div className="flex-1 flex flex-col">
                  <Header title="New Transaction" onOpenProfile={() => navigateTo('profile')} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8">
                    <AddTransactionTab />
                  </main>
                </div>
              )}

              {currentView === 'autopay' && (
                <div className="flex-1 flex flex-col">
                  <Header title="Autopay & Recurring" onOpenProfile={() => navigateTo('profile')} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8">
                    <AutopayTab />
                  </main>
                </div>
              )}

              {currentView === 'analytics' && (
                <div className="flex-1 flex flex-col">
                  <Header title="Analytics & Insights" onOpenProfile={() => navigateTo('profile')} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8">
                    <AnalyticsTab />
                  </main>
                </div>
              )}

              {currentView === 'profile' && (
                <div className="flex-1 flex flex-col">
                  <Header title="Overview" onOpenProfile={() => {}} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8">
                    <DashboardTab />
                  </main>
                  <ProfileModal isOpen={true} onClose={() => navigateTo('dashboard')} />
                </div>
              )}

              {currentView === 'confirm' && (
                <div className="flex-1 flex flex-col">
                  <Header title="Overview" onOpenProfile={() => {}} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8">
                    <DashboardTab />
                  </main>
                  <ConfirmModal />
                </div>
              )}

              {currentView === 'toast' && (
                <div className="flex-1 flex flex-col">
                  <Header title="Overview" onOpenProfile={() => {}} />
                  <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8 space-y-4">
                    <Card className="p-6">
                      <h3 className="font-display text-body font-semibold text-ink mb-2">
                        Active Toast Demonstrations
                      </h3>
                      <p className="text-body-sm text-ink-2">
                        Toasts appear with timer progress bars, 5-second undo actions, and accessible status roles.
                      </p>
                    </Card>
                    <DashboardTab />
                  </main>
                  <ToastContainer />
                </div>
              )}

              {currentView === 'tokens' && (
                <div className="max-w-6xl w-full mx-auto p-6 md:p-10 space-y-12">
                  <header className="flex justify-between items-center border-b border-line pb-6">
                    <div>
                      <span className="text-caption text-ink-3 uppercase tracking-wider font-semibold">
                        Design System Spec
                      </span>
                      <h1 className="font-display text-page-title text-ink font-semibold">
                        Tokens & Core Primitives
                      </h1>
                      <p className="text-body-sm text-ink-2 mt-1">
                        Self-hosted Instrument Sans & Bricolage Grotesque, warm palette, 44px touch targets
                      </p>
                    </div>
                  </header>

                  {/* Buttons */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Buttons</h2>
                    <div className="flex flex-wrap items-center gap-3 bg-surface p-6 rounded-card border border-line shadow-warm-1">
                      <Button variant="primary" leftIcon={<PlusIcon size={16} />}>Primary Button</Button>
                      <Button variant="secondary">Secondary Button</Button>
                      <Button variant="ghost">Ghost Button</Button>
                      <Button variant="danger" leftIcon={<TrashIcon size={16} />}>Danger Button</Button>
                      <Button variant="primary" isLoading>Loading</Button>
                      <Button variant="primary" disabled>Disabled</Button>
                    </div>
                  </section>

                  {/* Inputs */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Inputs & Amount Input</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-card border border-line shadow-warm-1">
                      <TextInput
                        label="Text Input"
                        placeholder="e.g. Grocery Store"
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                        hint="Labels sit above, never floating"
                      />
                      <TextInput
                        label="Input with Error Shake"
                        defaultValue="invalid-value"
                        error="Please enter a valid format"
                      />
                      <AmountInput
                        label="Amount Input (Live Indian Grouping)"
                        value={amountVal}
                        onChange={setAmountVal}
                      />
                      <div className="space-y-1.5">
                        <label className="text-caption font-medium text-ink-2">Segmented Control</label>
                        <SegmentedControl
                          options={[
                            { value: 'expense', label: 'Expense' },
                            { value: 'income', label: 'Income' },
                          ]}
                          value={segmentVal}
                          onChange={(val) => setSegmentVal(val as 'income' | 'expense')}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Pickers & Selects */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Dropdowns & Day Pickers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface p-6 rounded-card border border-line shadow-warm-1">
                      <div className="space-y-1.5">
                        <label className="text-caption font-medium text-ink-2">Custom Select</label>
                        <CustomSelect
                          value={selectVal}
                          onChange={setSelectVal}
                          options={[
                            { value: 'food', label: 'Food & Dining' },
                            { value: 'bills', label: 'Bills & Utilities' },
                            { value: 'travel', label: 'Travel & Transport' },
                          ]}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-caption font-medium text-ink-2">Custom Date Picker</label>
                        <CustomDatePicker value={dateVal} onChange={setDateVal} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-caption font-medium text-ink-2">Autopay Day-of-Month Picker</label>
                        <AutopayDayPicker value={dayVal} onChange={setDayVal} />
                      </div>
                    </div>
                  </section>

                  {/* Cards & Progress Bars */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Cards & Budget Progress</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <MetricCard
                        label="Total Balance"
                        figure="₹1,24,500"
                        delta={{ text: '+12.4% vs last month', type: 'income' }}
                      />
                      <MetricCard
                        label="Monthly Expenses"
                        figure="₹24,800"
                        delta={{ text: '-4.1% vs budget', type: 'danger' }}
                      />
                      <Card className="p-5 flex flex-col justify-between">
                        <div>
                          <span className="text-caption text-ink-3 font-semibold uppercase tracking-wider block mb-2">Monthly Budget</span>
                          <ProgressBar value={24800} max={30000} thresholdPercent={80} />
                        </div>
                        <p className="text-caption text-ink-3 mt-3">8px track with threshold tick mark and color shift.</p>
                      </Card>
                    </div>
                  </section>

                  {/* Category Badges */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Category Badges & Status Pills</h2>
                    <div className="flex flex-wrap gap-2.5 bg-surface p-6 rounded-card border border-line shadow-warm-1">
                      {categoryTokens.map((cat) => (
                        <CategoryBadge key={cat} category={cat} />
                      ))}
                      <Badge variant="accent">Active Plan</Badge>
                      <Badge variant="income">Income</Badge>
                      <Badge variant="warning">Near Limit</Badge>
                      <Badge variant="danger">Over Budget</Badge>
                    </div>
                  </section>

                  {/* Skeletons */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Loading Skeletons (Warm Shimmer)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SkeletonCard />
                      <div className="bg-surface border border-line rounded-card overflow-hidden shadow-warm-1">
                        <SkeletonTableRow />
                        <SkeletonTableRow />
                        <SkeletonTableRow />
                      </div>
                    </div>
                  </section>

                  {/* Colors */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Color Tokens</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                      {colorTokens.map((c) => (
                        <div key={c.name} className="flex flex-col rounded-card overflow-hidden border border-line bg-surface shadow-warm-1">
                          <div className={`h-16 ${c.varName} flex items-end p-2`}>
                            <span className="text-caption font-mono text-[10px] opacity-80">{c.hex}</span>
                          </div>
                          <div className="p-2 text-center">
                            <span className="text-caption font-mono font-medium text-ink">{c.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* SVG Icons */}
                  <section className="space-y-4">
                    <h2 className="text-section-title font-display font-semibold">Inline SVG Icon Components ({icons.length})</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-4 bg-surface p-6 rounded-card border border-line shadow-warm-1">
                      {icons.map(({ name, Component }) => (
                        <div key={name} className="flex flex-col items-center justify-center p-3 rounded-btn bg-surface-2 hover:bg-accent-tint hover:text-accent transition-colors duration-fast">
                          <Component size={22} />
                          <span className="text-[11px] text-ink-2 mt-2 truncate max-w-full text-center">{name}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}
