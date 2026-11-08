import React, { useState, useMemo } from 'react';
import {
  WalletIcon,
  ChevronLeftIcon,
  SearchIcon,
  XIcon,
  HelpCircleIcon,
} from '../icons';
import { Button } from '../ui/Button';
import { navigateTo } from '../../lib/routes';

export interface HelpPageProps {
  onBack?: () => void;
}

interface HelpItem {
  id: string;
  category: 'transactions' | 'autopay' | 'budget' | 'analytics' | 'anomalies' | 'privacy' | 'shortcuts';
  title: string;
  badge?: string;
  badgeVariant?: 'accent' | 'warning' | 'info';
  content: React.ReactNode;
  tags: string[];
}

export function HelpPage({ onBack }: HelpPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'future-dated-policy': true,
  });

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigateTo('/');
  };

  const handleNav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo(path);
  };

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const helpItems: HelpItem[] = useMemo(
    () => [
      {
        id: 'future-dated-policy',
        category: 'transactions',
        title: 'Policy on Future-Dated Transactions vs. Recurring Schedules',
        badge: 'Core Policy',
        badgeVariant: 'accent',
        tags: [
          'future',
          'future-dated',
          'schedule',
          'retroactive',
          'current month',
          'date',
          'upcoming',
          'rent',
          'bills',
        ],
        content: (
          <div className="space-y-3.5 text-sm leading-relaxed text-ink-2">
            <p>
              MoneyTracker maintains a strict, transparent policy for handling dates so your cash flow and budget always remain realistic and dependable.
            </p>
            <div className="rounded-card border border-accent/20 bg-accent-tint/40 p-3.5 sm:p-4 text-ink space-y-2">
              <span className="font-semibold text-accent block text-xs tracking-wider uppercase">
                1. Intra-Month Future Entries (Current Month)
              </span>
              <p className="text-xs sm:text-sm">
                Transactions entered with a date between <strong>today and the last day of the current calendar month</strong> (e.g., an upcoming rent payment on the 25th or planned weekend groceries) are <strong>counted immediately in your active month totals and monthly budget limit</strong>.
              </p>
              <p className="text-xs text-ink-3">
                <strong>Why?</strong> In personal budgeting, commitments made within your active billing period represent earmarked funds. Counting them immediately prevents false confidence and ensures you do not accidentally overspend before payments execute.
              </p>
            </div>

            <div className="rounded-card border border-line bg-surface-2/60 p-3.5 sm:p-4 space-y-2">
              <span className="font-semibold text-ink block text-xs tracking-wider uppercase">
                2. Future-Month Entries (Subsequent Months)
              </span>
              <p className="text-xs sm:text-sm">
                Transactions dated in <strong>future calendar months</strong> (e.g., next month or beyond) do <strong>not</strong> deduct from your current month's budget or appear in current-month dashboard totals. They are stored in your transaction ledger under their respective calendar month and become visible when filtering by that month or when that month arrives.
              </p>
            </div>

            <div className="rounded-card border border-amber-500/20 bg-amber-500/10 p-3.5 sm:p-4 space-y-2">
              <span className="font-semibold text-amber-600 dark:text-amber-400 block text-xs tracking-wider uppercase">
                3. Scheduling vs. Manual Forward Entries
              </span>
              <p className="text-xs sm:text-sm text-ink">
                <strong>Best Practice:</strong> For repeating expenses, subscriptions, or SIP investments, do <em>not</em> create manual future-dated entries month after month. Instead, set up an <strong>Autopay Plan</strong> in the Autopay tab.
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 text-ink-2">
                <li>Autopay automatically records the transaction on the exact scheduled date each month.</li>
                <li>Autopay intelligently clamps due dates for shorter months (e.g. day 31 on Feb 28 or April 30).</li>
                <li>Manual future-dated entries should be reserved for one-off commitments scheduled in the current month.</li>
              </ul>
            </div>

            <div className="rounded-card border border-line bg-surface-2/60 p-3.5 sm:p-4 space-y-2">
              <span className="font-semibold text-ink block text-xs tracking-wider uppercase">
                4. Retroactive (Past-Dated) Entries
              </span>
              <p className="text-xs sm:text-sm">
                You can freely log past transactions. When you enter an expense from earlier this month or previous months, historical charts, monthly archives, and category statistical baselines update retroactively without drift.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'autopay-mechanics',
        category: 'autopay',
        title: 'Recurring Autopay Execution & Month-End Clamping',
        badge: 'Automation',
        badgeVariant: 'info',
        tags: ['autopay', 'recurring', 'month boundary', 'leap year', 'february', 'day 31', 'last day', 'subscription'],
        content: (
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>
              The Autopay engine manages monthly repeating expenses (EMIs, utility bills, OTT subscriptions, SIP investments) with complete calendar safety:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Single Execution Guarantee:</strong> Exactly one transaction is recorded per plan per calendar month. Even if you refresh multiple times or access your account on two devices simultaneously, idempotency keys prevent duplicates.
              </li>
              <li>
                <strong>Shorter Month Clamping:</strong> If a plan is set for day 29, 30, or 31, it automatically clamps to the last valid day of shorter months (e.g. February 28, or February 29 during leap years like 2024 and 2028).
              </li>
              <li>
                <strong>Last Day of Month:</strong> The special "Last Day (31)" setting always executes on the exact calendar conclusion of each month (28, 29, 30, or 31).
              </li>
              <li>
                <strong>Active / Paused State:</strong> You can pause any plan without deleting its historical records. Paused plans halt automatic transaction creation until resumed.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'budget-limits',
        category: 'budget',
        title: 'Monthly Budget Thresholds & Boundary Alerts',
        badge: 'Spending Control',
        badgeVariant: 'warning',
        tags: ['budget', 'limit', '80%', 'threshold', 'near limit', 'at limit', 'over budget'],
        content: (
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>
              MoneyTracker monitors your cumulative current-month expenses against your configured monthly spending goal in integer paise:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-card bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">On Track (&lt; 80%)</span>
                Spending is well within budget. Progress indicator is emerald.
              </div>
              <div className="p-3 rounded-card bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">Near Limit (80% – 99.99%)</span>
                Warning status. Displays remaining funds to assist cautious spending.
              </div>
              <div className="p-3 rounded-card bg-rose-500/10 border border-rose-500/20 text-xs">
                <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">At Limit / Over Budget (≥ 100%)</span>
                Danger alert. Visual badge highlights exact amount exceeded.
              </div>
            </div>
            <p className="text-xs text-ink-3">
              Boundary calculations use exact paise arithmetic to ensure values like ₹7,999.99 vs ₹8,000.00 never trigger false threshold warnings.
            </p>
          </div>
        ),
      },
      {
        id: 'anomaly-detection',
        category: 'anomalies',
        title: 'Statistical Anomaly Detection (Z-Score)',
        badge: 'Smart Detection',
        badgeVariant: 'accent',
        tags: ['anomaly', 'z-score', 'statistical', 'unusual', 'variance', 'outlier', 'fraud'],
        content: (
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>
              To catch unexpected charges or billing spikes, MoneyTracker evaluates each new expense against your historical spending pattern within that specific category:
            </p>
            <div className="p-3.5 rounded-card bg-surface-2/80 border border-line text-xs font-mono">
              Z = (Transaction Amount - Category Mean) / Category Standard Deviation
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Minimum Sample Requirement:</strong> Anomaly detection activates only after you have logged at least <strong>3 historical transactions</strong> in a given category to avoid noise from sparse data.
              </li>
              <li>
                <strong>2.0 Standard Deviations Threshold:</strong> A transaction is flagged as anomalous when its value exceeds the category average by more than 2.0 standard deviations (Z &gt; 2.0).
              </li>
              <li>
                <strong>User Review &amp; Approval:</strong> When you mark an unusual transaction as "Approved", the system treats it as legitimate user behavior, gradually adapting future thresholds to your evolving lifestyle.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'forecasting-runway',
        category: 'analytics',
        title: 'Spending Forecasts & Capital Runway Calculations',
        badge: 'Analytics',
        badgeVariant: 'info',
        tags: ['forecast', 'runway', 'sma', '7-day', 'burn rate', 'projection', 'days remaining'],
        content: (
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>
              The Analytics dashboard provides forward-looking visibility using conservative statistical models:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>7-Day Simple Moving Average (SMA) Forecast:</strong> Calculates your average daily expenditure over the preceding 7 active days and projects this burn rate across the remaining days of the current month.
              </li>
              <li>
                <strong>Capital Runway:</strong> Divides your current net cash balance by your average daily spend to forecast how many days your capital will sustain your current burn rate.
              </li>
              <li>
                <strong>Sustainable Cash Flow State:</strong> If your monthly income equals or exceeds your expenses, or if daily spend is zero, the runway card displays <em>"N/A (Sustainable)"</em> rather than nonsensical infinite or negative numbers.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'math-evaluator',
        category: 'transactions',
        title: 'In-Line Math Evaluator in Amount Field',
        badge: 'Convenience',
        badgeVariant: 'info',
        tags: ['math', 'calculator', 'expression', 'amount', 'add', 'plus', 'multiply', 'split'],
        content: (
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>
              You don't need a separate calculator when splitting bills or tallying receipts. The Amount field in the New Transaction form directly supports arithmetic formulas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-card bg-surface-2 border border-line">
                <span className="font-semibold text-ink block mb-0.5">Summing items:</span>
                <code>150 + 220 + 350</code> → saves ₹720.00
              </div>
              <div className="p-2.5 rounded-card bg-surface-2 border border-line">
                <span className="font-semibold text-ink block mb-0.5">Quantity / Tax:</span>
                <code>450 * 3</code> → saves ₹1,350.00
              </div>
              <div className="p-2.5 rounded-card bg-surface-2 border border-line">
                <span className="font-semibold text-ink block mb-0.5">Splitting with friends:</span>
                <code>2400 / 4</code> → saves ₹600.00
              </div>
              <div className="p-2.5 rounded-card bg-surface-2 border border-line">
                <span className="font-semibold text-ink block mb-0.5">Complex calculation:</span>
                <code>(1200 + 300) * 0.5</code> → saves ₹750.00
              </div>
            </div>
            <p className="text-xs text-ink-3">
              Pressing Enter or tabbing away automatically evaluates the formula into exact Indian rupee formatting with integer paise precision.
            </p>
          </div>
        ),
      },
      {
        id: 'privacy-backups',
        category: 'privacy',
        title: 'Privacy-First Architecture, Encrypted Backups & 90-Day Recovery',
        badge: 'Security',
        badgeVariant: 'accent',
        tags: ['privacy', 'encrypted', 'backup', 'export', 'trash', 'soft-delete', 'recover', 'undo'],
        content: (
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>
              MoneyTracker is built around absolute user data sovereignty and security:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Client-Side Encrypted Backups:</strong> Export your complete financial history into a password-protected <code>.enc</code> file encrypted client-side using <strong>AES-GCM (256-bit)</strong> with a key derived via <strong>PBKDF2 (100,000 iterations of SHA-256)</strong>. Not even server administrators can decrypt this file without your passphrase.
              </li>
              <li>
                <strong>Offline-First IndexedDB Persistence:</strong> Transactions are saved instantly to your local browser storage. You can add, edit, and review data without an internet connection.
              </li>
              <li>
                <strong>Recoverable Soft-Delete (90-Day Trash):</strong> Deleted transactions remain safely stored in the Trash for 90 days. You can restore them anytime or purge them immediately.
              </li>
              <li>
                <strong>6-Second Instant Undo Toast:</strong> Deleting a transaction immediately surfaces an action toast allowing you to reverse the deletion with one tap.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'keyboard-shortcuts',
        category: 'shortcuts',
        title: 'Keyboard Shortcuts Reference',
        badge: 'Productivity',
        badgeVariant: 'info',
        tags: ['shortcuts', 'keyboard', 'hotkeys', 'quick', 'keybinding', 'fast'],
        content: (
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>Accelerate your daily logging with built-in desktop keyboard shortcuts:</p>
            <div className="rounded-card border border-line overflow-hidden divide-y divide-line text-xs sm:text-sm">
              <div className="p-3 bg-surface flex items-center justify-between">
                <span className="text-ink font-medium">Add New Transaction</span>
                <kbd className="px-2 py-1 rounded bg-surface-2 border border-line font-mono text-xs text-ink font-semibold">
                  N
                </kbd>
              </div>
              <div className="p-3 bg-surface flex items-center justify-between">
                <span className="text-ink font-medium">Toggle Desktop Sidebar (Expand / Collapse)</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 rounded bg-surface-2 border border-line font-mono text-xs text-ink font-semibold">
                    Ctrl
                  </kbd>
                  <span className="text-ink-3">+</span>
                  <kbd className="px-2 py-1 rounded bg-surface-2 border border-line font-mono text-xs text-ink font-semibold">
                    B
                  </kbd>
                </div>
              </div>
              <div className="p-3 bg-surface flex items-center justify-between">
                <span className="text-ink font-medium">Close Modal, Drawer, or Slide-Over</span>
                <kbd className="px-2 py-1 rounded bg-surface-2 border border-line font-mono text-xs text-ink font-semibold">
                  Escape
                </kbd>
              </div>
              <div className="p-3 bg-surface flex items-center justify-between">
                <span className="text-ink font-medium">Evaluate Amount Formula</span>
                <kbd className="px-2 py-1 rounded bg-surface-2 border border-line font-mono text-xs text-ink font-semibold">
                  Enter / Tab
                </kbd>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [],
  );

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'transactions', label: 'Transactions & Dates' },
    { id: 'autopay', label: 'Autopay' },
    { id: 'budget', label: 'Budgets' },
    { id: 'anomalies', label: 'Anomalies' },
    { id: 'analytics', label: 'Analytics & Runway' },
    { id: 'privacy', label: 'Privacy & Security' },
    { id: 'shortcuts', label: 'Shortcuts' },
  ];

  const filteredItems = useMemo(() => {
    return helpItems.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) {
        return true;
      }
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchTags;
    });
  }, [helpItems, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-card bg-accent-tint flex items-center justify-center text-accent shadow-xs">
              <WalletIcon size={20} />
            </div>
            <div>
              <span className="font-display font-semibold text-base sm:text-lg text-ink tracking-tight block leading-tight">
                MoneyTracker
              </span>
              <span className="text-xs text-ink-3 block">Help &amp; Knowledge Base</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleBack}
              aria-label="Back to App"
              className="gap-1.5"
            >
              <ChevronLeftIcon size={16} />
              <span>Back to App</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold mb-3">
            <HelpCircleIcon size={14} />
            <span>Documentation &amp; User Guide</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-ink mb-3">
            How Can We Help You?
          </h1>
          <p className="text-sm sm:text-base text-ink-2">
            Clear, plain-language documentation explaining calculations, future-dated policies, autopay scheduling, and security protections.
          </p>

          {/* Search Bar */}
          <div className="relative mt-6 max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-3">
              <SearchIcon size={18} />
            </div>
            <input
              type="text"
              role="searchbox"
              placeholder="Search topics (e.g., future dates, z-score, runway, shortcuts)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-card bg-surface border border-line text-sm text-ink placeholder:text-ink-3 shadow-xs focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-3 hover:text-ink"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar text-xs">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-fast font-medium ${
                  isSelected
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-surface border border-line text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Help Items Accordion List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 rounded-card border border-line bg-surface p-6">
            <HelpCircleIcon size={32} className="mx-auto text-ink-3 mb-2" />
            <h3 className="text-base font-medium text-ink mb-1">No matching help topics found</h3>
            <p className="text-xs text-ink-3 mb-4">
              Try different keywords or browse all categories above.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredItems.map((item) => {
              const isExpanded = expandedItems[item.id] ?? false;
              return (
                <div
                  key={item.id}
                  className="rounded-card border border-line bg-surface overflow-hidden shadow-xs transition-shadow hover:shadow-1"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isExpanded}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-base sm:text-lg text-ink">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider ${
                              item.badgeVariant === 'accent'
                                ? 'bg-accent-tint text-accent'
                                : item.badgeVariant === 'warning'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-surface-2 text-ink-2'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-3">
                        <span>Click to {isExpanded ? 'collapse' : 'expand'} explanation</span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1 text-ink-3">
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 border-t border-line/60 pt-4">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Links Section */}
        <div className="mt-12 rounded-card border border-line bg-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
              Looking for User Guides or System Runbooks?
            </h3>
            <p className="text-xs sm:text-sm text-ink-2">
              Explore offline documentation in the repository or review our legal policies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleBack}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-3">
          <div>
            &copy; {new Date().getFullYear()} MoneyTracker. Built with privacy-first offline architecture.
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/terms"
              onClick={handleNav('/terms')}
              className="hover:text-ink hover:underline transition-colors"
            >
              Terms
            </a>
            <span>•</span>
            <a
              href="/privacy"
              onClick={handleNav('/privacy')}
              className="hover:text-ink hover:underline transition-colors"
            >
              Privacy
            </a>
            <span>•</span>
            <a
              href="/"
              onClick={handleNav('/')}
              className="hover:text-ink hover:underline transition-colors"
            >
              App
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HelpPage;
