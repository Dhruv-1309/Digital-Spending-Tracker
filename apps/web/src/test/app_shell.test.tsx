import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyMotion, domAnimation } from 'motion/react';
import { AuthContext } from '../context/authContextDef';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { ConfirmContext } from '../context/confirmContextDef';
import { AppShell } from '../components/layout/AppShell';
import { AppLayout } from '../components/layout/AppLayout';
import { NavigationTabs } from '../components/layout/NavigationTabs';
import { ToastContainer } from '../components/common/ToastContainer';
import { ConfirmModal } from '../components/common/ConfirmModal';
import type { UserProfile, NavTab } from '../types';

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
  Line: () => <div data-testid="mock-line-chart" />,
}));

const mockUser: UserProfile = {
  uid: 'usr_test_123',
  email: 'tester@example.com',
  displayName: 'Test User',
  authMethod: 'password',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignIn: '2026-10-15T10:00:00.000Z',
  hasPassword: true,
};

const defaultTrackerValue: TrackerContextValue = {
  currentTab: 'dashboard',
  setCurrentTab: vi.fn(),
  transactions: [
    {
      id: 'tx_1',
      type: 'expense',
      amount: 500,
      category: 'Food & Dining',
      paymentMethod: 'card',
      description: 'Grocery Run',
      date: '2026-11-01',
    },
  ],
  categories: {
    income: ['Salary', 'Investments'],
    expense: ['Food & Dining', 'Subscriptions', 'Utilities'],
  },
  approvedAnomalies: [],
  autopays: [],
  budgetGoal: {
    monthlyExpenseLimit: 30000,
    thresholdPercent: 80,
  },
  isOnline: true,
  isLoading: false,
  pendingSyncCount: 0,
  addTransaction: vi.fn().mockResolvedValue(true),
  deleteTransaction: vi.fn().mockResolvedValue(true),
  importTransactions: vi.fn().mockResolvedValue(true),
  addCustomCategory: vi.fn().mockResolvedValue(true),
  approveAnomaly: vi.fn().mockResolvedValue(true),
  dismissAnomaly: vi.fn().mockResolvedValue(true),
  addAutopay: vi.fn().mockResolvedValue(true),
  deleteAutopay: vi.fn().mockResolvedValue(true),
  toggleAutopay: vi.fn().mockResolvedValue(true),
  updateBudgetGoal: vi.fn().mockResolvedValue(true),
};

function renderWithProviders(
  ui: React.ReactNode,
  user: UserProfile | null = mockUser,
  trackerOverrides: Partial<TrackerContextValue> = {},
  toastOverrides = {},
  confirmOverrides = {},
) {
  const authValue = {
    user,
    loading: false,
    isAuthReady: true,
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updateDisplayName: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
  };

  const toastValue = {
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
    ...toastOverrides,
  };

  const confirmValue = {
    confirmState: {
      isOpen: false,
      message: '',
      title: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'warning' as const,
    },
    showConfirm: vi.fn().mockResolvedValue(true),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
    ...confirmOverrides,
  };

  const trackerValue = { ...defaultTrackerValue, ...trackerOverrides };

  return render(
    <LazyMotion features={domAnimation} strict>
      <AuthContext.Provider value={authValue}>
        <ToastContext.Provider value={toastValue}>
          <ConfirmContext.Provider value={confirmValue}>
            <TrackerContext.Provider value={trackerValue}>
              {ui}
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </LazyMotion>,
  );
}

describe('Phase 3: AppShell & Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Desktop Left Rail & Tablet/Phone Navigation', () => {
    it('renders the 232px left rail with brand logo, 4 items and profile at the bottom', () => {
      const onOpenProfile = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={onOpenProfile}>
          <div>Content</div>
        </AppShell>,
      );

      // Sidebar exists
      const sidebar = screen.getByRole('complementary', { name: /Desktop Sidebar/i });
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('w-[232px]');

      // Logo and brand text
      expect(screen.getByText('MoneyTracker')).toBeInTheDocument();
      expect(screen.getByText('Personal Finance')).toBeInTheDocument();

      // Nav items in desktop rail: Dashboard, Transactions, Autopay, Analytics
      const desktopNav = screen.getByRole('navigation', { name: /Desktop Navigation/i });
      expect(desktopNav).toBeInTheDocument();

      const tabs = ['Dashboard', 'Transactions', 'Autopay', 'Analytics'];
      tabs.forEach((tab) => {
        expect(screen.getAllByText(tab).length).toBeGreaterThan(0);
      });

      // Profile entry at bottom of left rail
      const profileBtn = screen.getByLabelText('Open profile settings');
      expect(profileBtn).toBeInTheDocument();
      expect(screen.getByText('tester@example.com')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('marks the active item with aria-current="page" and 3px accent bar', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Content</div>
        </AppShell>,
        mockUser,
        { currentTab: 'dashboard' },
      );

      const desktopNav = screen.getByRole('navigation', { name: /Desktop Navigation/i });
      const dashboardBtn = desktopNav.querySelector('button[data-tab="dashboard"]');
      expect(dashboardBtn).toHaveAttribute('aria-current', 'page');
      expect(dashboardBtn).toHaveClass('bg-accent-tint');

      // 3px Accent Bar exists on the active item
      const accentBar = screen.getByTestId('active-accent-bar');
      expect(accentBar).toBeInTheDocument();
      expect(accentBar).toHaveClass('w-[3px]', 'bg-accent');

      // Inactive items do NOT have aria-current
      const txBtn = desktopNav.querySelector('button[data-tab="transactions"]');
      expect(txBtn).not.toHaveAttribute('aria-current');
    });

    it('clicking an item calls setCurrentTab', () => {
      const setCurrentTab = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Content</div>
        </AppShell>,
        mockUser,
        { setCurrentTab },
      );

      const desktopNav = screen.getByRole('navigation', { name: /Desktop Navigation/i });
      const txBtn = desktopNav.querySelector('button[data-tab="transactions"]');
      fireEvent.click(txBtn!);
      expect(setCurrentTab).toHaveBeenCalledWith('transactions');
    });

    it('renders the bottom tab bar on tablet/phone with 4 items, icons and labels', () => {
      const setCurrentTab = vi.fn();
      renderWithProviders(<NavigationTabs />, mockUser, {
        currentTab: 'autopay',
        setCurrentTab,
      });

      const mobileNav = screen.getByRole('navigation', { name: /Main Navigation Tabs/i });
      expect(mobileNav).toBeInTheDocument();
      expect(mobileNav).toHaveClass('min-[1025px]:hidden', 'fixed', 'bottom-0');

      // Autopay is active
      const autopayBtn = screen.getByRole('button', { name: /Autopay/i });
      expect(autopayBtn).toHaveAttribute('aria-current', 'page');

      // Clicking another tab calls setCurrentTab
      const analyticsBtn = screen.getByRole('button', { name: /Analytics/i });
      fireEvent.click(analyticsBtn);
      expect(setCurrentTab).toHaveBeenCalledWith('analytics');
    });

    it('supports keyboard navigation through rail and tab bar buttons', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Content</div>
        </AppShell>,
      );

      const desktopNav = screen.getByRole('navigation', { name: /Desktop Navigation/i });
      const buttons = desktopNav.querySelectorAll<HTMLButtonElement>('button');
      expect(buttons.length).toBe(4);

      buttons.forEach((btn) => {
        btn.focus();
        expect(document.activeElement).toBe(btn);
        expect(btn).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-accent');
      });

      const profileBtn = screen.getByLabelText('Open profile settings');
      profileBtn.focus();
      expect(document.activeElement).toBe(profileBtn);

      const signOutBtn = screen.getByLabelText('Sign out');
      signOutBtn.focus();
      expect(document.activeElement).toBe(signOutBtn);
    });

    it('verifies aria-current="page" is correctly assigned for every route in rail and tab bar', () => {
      const tabs: NavTab[] = ['dashboard', 'transactions', 'autopay', 'analytics'];

      tabs.forEach((activeTab) => {
        const { unmount } = renderWithProviders(
          <AppShell onOpenProfile={vi.fn()}>
            <div>Content</div>
          </AppShell>,
          mockUser,
          { currentTab: activeTab },
        );

        const desktopNav = screen.getByRole('navigation', { name: /Desktop Navigation/i });
        const mobileNav = screen.getByRole('navigation', { name: /Main Navigation Tabs/i });

        tabs.forEach((tab) => {
          const desktopBtn = desktopNav.querySelector(`button[data-tab="${tab}"]`);
          const mobileBtn = mobileNav.querySelector(`button[data-tab="${tab}"]`);

          if (tab === activeTab) {
            expect(desktopBtn).toHaveAttribute('aria-current', 'page');
            expect(mobileBtn).toHaveAttribute('aria-current', 'page');
          } else {
            expect(desktopBtn).not.toHaveAttribute('aria-current');
            expect(mobileBtn).not.toHaveAttribute('aria-current');
          }
        });

        unmount();
      });
    });

    it('exposes responsive layout classes for 390px, 768px, and 1440px widths', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Responsive Content</div>
        </AppShell>,
      );

      // Desktop Left Rail is hidden below 1025px (for 390px phone and 768px tablet), visible on 1025px+ (1440px desktop)
      const sidebar = screen.getByRole('complementary', { name: /Desktop Sidebar/i });
      expect(sidebar).toHaveClass('hidden', 'min-[1025px]:flex', 'w-[232px]');

      // Top bar adapts: on desktop offsets by rail width (min-[1025px]:left-[232px]), full width on mobile/tablet (left-0)
      const header = screen.getByRole('banner', { name: /App Header/i });
      expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'min-[1025px]:left-[232px]');

      // Mobile Profile button in top bar visible on tablet/phone, hidden on desktop
      const mobileProfileBtn = screen.getByRole('button', { name: /Open mobile profile settings/i });
      expect(mobileProfileBtn).toHaveClass('min-[1025px]:hidden');

      // Bottom Navigation bar is visible below 1025px (390px and 768px), hidden on 1025px+ (1440px)
      const mobileNav = screen.getByRole('navigation', { name: /Main Navigation Tabs/i });
      expect(mobileNav).toHaveClass('min-[1025px]:hidden', 'fixed', 'bottom-0');

      // Main content area has bottom padding for mobile bar (pb-20) and left padding for desktop rail (min-[1025px]:pl-[232px])
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-[1025px]:pl-[232px]', 'pb-20');
    });
  });

  describe('2. Top Bar & Page Title & Add Transaction Button', () => {
    it('displays the current page title and Add transaction button', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Page Content</div>
        </AppShell>,
        mockUser,
        { currentTab: 'transactions' },
      );

      // Page title is Transactions
      expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();

      // Add transaction button
      const addBtn = screen.getByRole('button', { name: /Add transaction/i });
      expect(addBtn).toBeInTheDocument();
    });

    it('clicking Add transaction calls setCurrentTab("add-transaction")', () => {
      const setCurrentTab = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Page Content</div>
        </AppShell>,
        mockUser,
        { setCurrentTab },
      );

      const addBtn = screen.getByRole('button', { name: /Add transaction/i });
      fireEvent.click(addBtn);
      expect(setCurrentTab).toHaveBeenCalledWith('add-transaction');
    });

    it('pressing "N" when no input has focus opens the add-transaction form', () => {
      const setCurrentTab = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Page Content</div>
        </AppShell>,
        mockUser,
        { setCurrentTab },
      );

      fireEvent.keyDown(window, { key: 'n' });
      expect(setCurrentTab).toHaveBeenCalledWith('add-transaction');

      fireEvent.keyDown(window, { key: 'N' });
      expect(setCurrentTab).toHaveBeenCalledTimes(2);
    });

    it('pressing "N" when an input or textarea has focus does NOT open add-transaction', () => {
      const setCurrentTab = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <input data-testid="test-input" />
          <textarea data-testid="test-textarea" />
        </AppShell>,
        mockUser,
        { setCurrentTab },
      );

      const input = screen.getByTestId('test-input');
      input.focus();
      fireEvent.keyDown(input, { key: 'n' });
      expect(setCurrentTab).not.toHaveBeenCalled();

      const textarea = screen.getByTestId('test-textarea');
      textarea.focus();
      fireEvent.keyDown(textarea, { key: 'n' });
      expect(setCurrentTab).not.toHaveBeenCalled();
    });

    it('pressing "Ctrl+N" or "Meta+N" does NOT hijack browser shortcut', () => {
      const setCurrentTab = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Page Content</div>
        </AppShell>,
        mockUser,
        { setCurrentTab },
      );

      fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'n', metaKey: true });
      fireEvent.keyDown(window, { key: 'n', altKey: true });
      expect(setCurrentTab).not.toHaveBeenCalled();
    });
  });

  describe('3. Route Transition', () => {
    it('wraps content in .route-fade-content with key keyed on currentTab', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div data-testid="child-content">Screen 1</div>
        </AppShell>,
        mockUser,
        { currentTab: 'dashboard' },
      );

      const fadeContainer = document.querySelector('.route-fade-content');
      expect(fadeContainer).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toHaveTextContent('Screen 1');
    });
  });

  describe('4. Offline Chip (FR-6.3)', () => {
    it('shows Offline chip when offline', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Content</div>
        </AppShell>,
        mockUser,
        { isOnline: false },
      );

      const offlineChip = screen.getByText('Offline');
      expect(offlineChip).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('hides Offline chip when online', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()}>
          <div>Content</div>
        </AppShell>,
        mockUser,
        { isOnline: true },
      );

      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });
  });

  describe('5. Toast and Confirm Dialog Hosts', () => {
    it('ToastContainer renders toasts with new primitive component', async () => {
      const dismissToast = vi.fn();
      renderWithProviders(
        <ToastContainer />,
        mockUser,
        {},
        {
          toasts: [
            { id: 't1', message: 'Transaction created successfully', type: 'success' },
          ],
          dismissToast,
        },
      );

      expect(screen.getByText('Transaction created successfully')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /Close notification/i });
      fireEvent.click(closeBtn);
      expect(dismissToast).toHaveBeenCalledWith('t1');
    });

    it('ConfirmModal renders with new ConfirmDialog primitive component', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      renderWithProviders(
        <ConfirmModal />,
        mockUser,
        {},
        {},
        {
          confirmState: {
            isOpen: true,
            title: 'Delete Transaction?',
            message: 'Are you sure you want to delete this transaction?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger',
          },
          handleConfirm,
          handleCancel,
        },
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Transaction?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this transaction?')).toBeInTheDocument();

      // Safe button (Cancel) and Destructive button (Delete)
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      const confirmBtn = screen.getByRole('button', { name: 'Delete' });

      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalled();

      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalled();
    });
  });

  describe('6. Every screen renders inside AppLayout and AppShell', () => {
    const screens: { tab: NavTab; expectedHeading: RegExp | string }[] = [
      { tab: 'dashboard', expectedHeading: /Dashboard/i },
      { tab: 'transactions', expectedHeading: /Transactions/i },
      { tab: 'autopay', expectedHeading: /Recurring Plans/i },
      { tab: 'analytics', expectedHeading: /Daily Expenses/i },
      { tab: 'add-transaction', expectedHeading: /Add Transaction/i },
    ];

    screens.forEach(({ tab, expectedHeading }) => {
      it(`renders tab "${tab}" inside the shell`, () => {
        renderWithProviders(<AppLayout />, mockUser, { currentTab: tab });
        expect(screen.getAllByText(expectedHeading).length).toBeGreaterThan(0);
      });
    });
  });

  describe('7. Profile Entry Interactivity', () => {
    it('clicking profile entry in desktop rail opens profile modal', () => {
      const onOpenProfile = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={onOpenProfile}>
          <div>Content</div>
        </AppShell>,
      );

      const profileBtn = screen.getByLabelText('Open profile settings');
      fireEvent.click(profileBtn);
      expect(onOpenProfile).toHaveBeenCalled();
    });

    it('clicking profile entry in mobile top bar opens profile modal', () => {
      const onOpenProfile = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={onOpenProfile}>
          <div>Content</div>
        </AppShell>,
      );

      const mobileProfileBtn = screen.getByRole('button', { name: /Open mobile profile settings/i });
      fireEvent.click(mobileProfileBtn);
      expect(onOpenProfile).toHaveBeenCalled();
    });
  });

  describe('8. Collapsible Sidebar & Clean Full-Width Mode', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('hides sidebar and expands main content to full width when clicking collapse button', () => {
      const onOpenProfile = vi.fn();
      renderWithProviders(
        <AppShell onOpenProfile={onOpenProfile} defaultSidebarCollapsed={false}>
          <div>Main Content</div>
        </AppShell>,
      );

      const sidebar = screen.getByRole('complementary', { name: /Desktop Sidebar/i });
      expect(sidebar).toHaveClass('w-[232px]', 'translate-x-0');

      // Click collapse button in sidebar header
      const collapseBtn = screen.getByTestId('sidebar-collapse-btn');
      fireEvent.click(collapseBtn);

      // Sidebar slides off-screen (-translate-x-full)
      expect(sidebar).toHaveClass('-translate-x-full');

      // Header and main content expand to full width (left-0, pl-0)
      const header = screen.getByRole('banner', { name: /App Header/i });
      expect(header).toHaveClass('min-[1025px]:left-0');
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-[1025px]:pl-0');
    });

    it('expands sidebar back when clicking toggle button in header', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()} defaultSidebarCollapsed={true}>
          <div>Main Content</div>
        </AppShell>,
      );

      const sidebar = screen.getByRole('complementary', { name: /Desktop Sidebar/i });
      expect(sidebar).toHaveClass('-translate-x-full');

      // Click toggle button in header
      const headerToggle = screen.getByTestId('header-sidebar-toggle');
      fireEvent.click(headerToggle);

      // Sidebar returns to screen
      expect(sidebar).toHaveClass('translate-x-0');
      const header = screen.getByRole('banner', { name: /App Header/i });
      expect(header).toHaveClass('min-[1025px]:left-[232px]');
    });

    it('toggles sidebar with Ctrl+B and Meta+B keyboard shortcut', () => {
      renderWithProviders(
        <AppShell onOpenProfile={vi.fn()} defaultSidebarCollapsed={false}>
          <div>Main Content</div>
        </AppShell>,
      );

      const sidebar = screen.getByRole('complementary', { name: /Desktop Sidebar/i });
      expect(sidebar).toHaveClass('translate-x-0');

      // Ctrl+B hides sidebar
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(sidebar).toHaveClass('-translate-x-full');

      // Meta+B shows sidebar
      fireEvent.keyDown(window, { key: 'b', metaKey: true });
      expect(sidebar).toHaveClass('translate-x-0');
    });
  });
});
