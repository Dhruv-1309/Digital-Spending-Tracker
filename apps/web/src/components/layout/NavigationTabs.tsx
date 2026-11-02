import { useTracker } from '../../hooks/useTracker';
import {
  LayoutDashboardIcon,
  ArrowLeftRightIcon,
  ClockIcon,
  BarChart2Icon,
  PlusIcon,
} from '../common/icons';


export interface NavigationTabsProps {
  onAddTransaction?: () => void;
}

export function NavigationTabs({ onAddTransaction }: NavigationTabsProps) {
  const { currentTab, setCurrentTab } = useTracker();

  return (
    <nav
      className="nav-tabs fixed bottom-0 inset-x-0 h-16 bg-surface border-t border-line flex items-center justify-around z-40 px-2 pb-safe md:static md:h-auto md:bg-transparent md:border-0 md:flex-col md:p-3 md:gap-1 shadow-warm-2 md:shadow-none"
      aria-label="Main Navigation"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        data-tab="dashboard"
        role="button"
        aria-label="Dashboard"
        aria-current={currentTab === 'dashboard' ? 'page' : undefined}
        onClick={() => setCurrentTab('dashboard')}
        className={`relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none w-full md:h-10 md:px-3 rounded-btn text-[11px] md:text-body-sm font-medium transition-all duration-fast select-none ${
          currentTab === 'dashboard'
            ? 'text-accent font-semibold md:bg-accent-tint md:before:absolute md:before:left-0 md:before:top-2 md:before:bottom-2 md:before:w-[3px] md:before:bg-accent md:before:rounded-r'
            : 'text-ink-2 hover:text-ink md:hover:bg-surface-2'
        }`}
      >
        <LayoutDashboardIcon size={18} className={currentTab === 'dashboard' ? 'text-accent' : 'text-ink-3'} />
        <span>Dashboard</span>
      </button>

      {/* 2. Transactions */}
      <button
        type="button"
        data-tab="transactions"
        role="button"
        aria-label="Transactions"
        aria-current={currentTab === 'transactions' ? 'page' : undefined}
        onClick={() => setCurrentTab('transactions')}
        className={`relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none w-full md:h-10 md:px-3 rounded-btn text-[11px] md:text-body-sm font-medium transition-all duration-fast select-none ${
          currentTab === 'transactions'
            ? 'text-accent font-semibold md:bg-accent-tint md:before:absolute md:before:left-0 md:before:top-2 md:before:bottom-2 md:before:w-[3px] md:before:bg-accent md:before:rounded-r'
            : 'text-ink-2 hover:text-ink md:hover:bg-surface-2'
        }`}
      >
        <ArrowLeftRightIcon size={18} className={currentTab === 'transactions' ? 'text-accent' : 'text-ink-3'} />
        <span>Transactions</span>
      </button>

      {/* 3. Mobile Raised Center Add Button (Hidden on Desktop) */}
      {onAddTransaction && (
        <div className="flex md:hidden flex-col items-center justify-center px-1">
          <button
            type="button"
            aria-label="Add Transaction"
            onClick={onAddTransaction}
            className="flex items-center justify-center w-12 h-12 -translate-y-4 rounded-full bg-accent text-white shadow-warm-2 interactive-btn active:scale-95"
          >
            <PlusIcon size={22} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* 4. Autopay */}
      <button
        type="button"
        data-tab="autopay"
        role="button"
        aria-label="Autopay"
        aria-current={currentTab === 'autopay' ? 'page' : undefined}
        onClick={() => setCurrentTab('autopay')}
        className={`relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none w-full md:h-10 md:px-3 rounded-btn text-[11px] md:text-body-sm font-medium transition-all duration-fast select-none ${
          currentTab === 'autopay'
            ? 'text-accent font-semibold md:bg-accent-tint md:before:absolute md:before:left-0 md:before:top-2 md:before:bottom-2 md:before:w-[3px] md:before:bg-accent md:before:rounded-r'
            : 'text-ink-2 hover:text-ink md:hover:bg-surface-2'
        }`}
      >
        <ClockIcon size={18} className={currentTab === 'autopay' ? 'text-accent' : 'text-ink-3'} />
        <span>Autopay</span>
      </button>

      {/* 5. Analytics */}
      <button
        type="button"
        data-tab="analytics"
        role="button"
        aria-label="Analytics"
        aria-current={currentTab === 'analytics' ? 'page' : undefined}
        onClick={() => setCurrentTab('analytics')}
        className={`relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none w-full md:h-10 md:px-3 rounded-btn text-[11px] md:text-body-sm font-medium transition-all duration-fast select-none ${
          currentTab === 'analytics'
            ? 'text-accent font-semibold md:bg-accent-tint md:before:absolute md:before:left-0 md:before:top-2 md:before:bottom-2 md:before:w-[3px] md:before:bg-accent md:before:rounded-r'
            : 'text-ink-2 hover:text-ink md:hover:bg-surface-2'
        }`}
      >
        <BarChart2Icon size={18} className={currentTab === 'analytics' ? 'text-accent' : 'text-ink-3'} />
        <span>Analytics</span>
      </button>
    </nav>
  );
}
