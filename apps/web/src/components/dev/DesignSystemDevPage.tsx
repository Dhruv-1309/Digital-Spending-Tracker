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

export function DesignSystemDevPage({ onBack }: { onBack?: () => void }) {
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
    { name: 'terracotta', bg: '#F3DCD2', ink: '#8A3A1F' },
    { name: 'olive', bg: '#E8EBCF', ink: '#55601A' },
    { name: 'teal', bg: '#D7ECE9', ink: '#1E5F58' },
    { name: 'rose', bg: '#F5DCE3', ink: '#8A2A47' },
    { name: 'sand', bg: '#EFE3CB', ink: '#7A5A12' },
    { name: 'sky', bg: '#DCE8F5', ink: '#245A8C' },
    { name: 'moss', bg: '#DDEBD9', ink: '#2F6A32' },
    { name: 'slate', bg: '#E3E6EA', ink: '#3C4654' },
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

  return (
    <div className="min-h-screen bg-bg text-ink p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex justify-between items-center border-b border-line pb-6">
        <div>
          <span className="text-caption text-ink-3 uppercase tracking-wider font-semibold">Dev-Only Preview</span>
          <h1 className="font-display text-page-title text-ink font-semibold">Design System Foundations</h1>
          <p className="text-body-sm text-ink-2 mt-1">Tokens, typography, motion patterns, and SVG icon system</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="interactive-btn px-4 py-2 bg-surface border border-line-strong rounded-btn text-body-sm font-medium hover:border-ink cursor-pointer"
          >
            Back to App
          </button>
        )}
      </header>

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

      {/* Category Badges */}
      <section className="space-y-4">
        <h2 className="text-section-title font-display font-semibold">Category Badge Palette (8 Muted Pairs)</h2>
        <div className="flex flex-wrap gap-3">
          {categoryTokens.map((cat) => (
            <span
              key={cat.name}
              className="px-3 py-1 rounded-full text-caption font-medium capitalize"
              style={{ backgroundColor: cat.bg, color: cat.ink }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      </section>

      {/* Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-section-title font-display font-semibold">Typography Scale</h2>
        <div className="bg-surface p-6 rounded-card border border-line space-y-4 shadow-warm-1">
          <div className="border-b border-line pb-3">
            <span className="text-caption text-ink-3">Hero Display (48px / 52px, 600) — Indian Grouping Tabular Figure</span>
            <div className="font-display text-hero font-semibold text-ink tabular-nums">₹1,25,000.00</div>
          </div>
          <div className="border-b border-line pb-3">
            <span className="text-caption text-ink-3">Page Title (28px / 36px, 600)</span>
            <div className="font-display text-page-title font-semibold text-ink">Monthly Flow Overview</div>
          </div>
          <div className="border-b border-line pb-3">
            <span className="text-caption text-ink-3">Section Title (20px / 28px, 600)</span>
            <div className="font-display text-section-title font-semibold text-ink">Recent Transactions</div>
          </div>
          <div className="border-b border-line pb-3">
            <span className="text-caption text-ink-3">Body (16px / 24px, 400 & 500)</span>
            <div className="text-body text-ink">Regular UI text with standard contrast for high readability.</div>
          </div>
          <div className="border-b border-line pb-3">
            <span className="text-caption text-ink-3">Body Small (14px / 20px, 400 & 500)</span>
            <div className="text-body-sm text-ink-2">Secondary metadata, category chips, and filter options.</div>
          </div>
          <div>
            <span className="text-caption text-ink-3">Caption (12px / 16px, 400)</span>
            <div className="text-caption text-ink-3">Form labels, footnotes, timestamps, and badges.</div>
          </div>
        </div>
      </section>

      {/* Shapes & Elevation */}
      <section className="space-y-4">
        <h2 className="text-section-title font-display font-semibold">Elevations & Shapes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-card border border-line shadow-warm-1">
            <span className="text-body-sm font-semibold text-ink">Elevation 1 (Resting Card)</span>
            <p className="text-caption text-ink-2 mt-1">Used for standard dashboard cards and table surfaces.</p>
          </div>
          <div className="interactive-card bg-surface p-6 rounded-card border border-line shadow-warm-1 cursor-pointer">
            <span className="text-body-sm font-semibold text-ink">Elevation 2 (Interactive Hover)</span>
            <p className="text-caption text-ink-2 mt-1">Hover over me! Lifts 2px with shadow-warm-2.</p>
          </div>
          <div className="bg-surface p-6 rounded-card border border-line shadow-warm-3">
            <span className="text-body-sm font-semibold text-ink">Elevation 3 (Modal / Dialog)</span>
            <p className="text-caption text-ink-2 mt-1">High-focus modal dialogs and slide-over panels.</p>
          </div>
        </div>
      </section>

      {/* SVG Icon System */}
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
  );
}
