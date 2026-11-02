import { useState } from 'react';
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

export function DesignSystemDevPage({ onBack }: { onBack?: () => void }) {
  const [segmentVal, setSegmentVal] = useState<'income' | 'expense'>('expense');
  const [selectVal, setSelectVal] = useState('food');
  const [dateVal, setDateVal] = useState('2026-11-02');
  const [dayVal, setDayVal] = useState<number | string>(5);
  const [amountVal, setAmountVal] = useState<number | string>(125000);
  const [textVal, setTextVal] = useState('');

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
    'Travel',
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
    <div className="min-h-screen bg-bg text-ink p-6 md:p-10 max-w-6xl mx-auto space-y-12">
      <header className="flex justify-between items-center border-b border-line pb-6">
        <div>
          <span className="text-caption text-ink-3 uppercase tracking-wider font-semibold">Dev-Only Preview</span>
          <h1 className="font-display text-page-title text-ink font-semibold">Design System & Primitives (Phase 2)</h1>
          <p className="text-body-sm text-ink-2 mt-1">Tokens, typography, motion patterns, and redesigned primitives</p>
        </div>
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Back to App
          </Button>
        )}
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

      {/* Inputs & Amount Input */}
      <section className="space-y-4">
        <h2 className="text-section-title font-display font-semibold">Inputs & Amount Input</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-card border border-line shadow-warm-1">
          <TextInput
            label="Transaction Description"
            placeholder="e.g. Grocery shopping"
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            hint="Standard input with 44px height, line-strong border, and focus ring"
          />
          <AmountInput
            label="Amount (Indian Grouping)"
            value={amountVal}
            onChange={(val) => setAmountVal(val)}
          />
          <TextInput
            label="Input with Error"
            defaultValue="Invalid Input"
            error="Please enter a valid description"
          />
          <div className="space-y-1.5">
            <label className="text-caption font-medium text-ink-2">Type Segmented Control</label>
            <div>
              <SegmentedControl
                options={[
                  { value: 'expense', label: 'Expense', icon: <ArrowUpIcon size={16} /> },
                  { value: 'income', label: 'Income', icon: <ArrowDownIcon size={16} /> },
                ]}
                value={segmentVal}
                onChange={setSegmentVal}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dropdown, Date Picker & Day Picker */}
      <section className="space-y-4">
        <h2 className="text-section-title font-display font-semibold">Dropdowns & Pickers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface p-6 rounded-card border border-line shadow-warm-1">
          <div className="space-y-1.5">
            <label className="text-caption font-medium text-ink-2">Custom Select</label>
            <CustomSelect
              value={selectVal}
              onChange={setSelectVal}
              options={[
                { value: 'food', label: 'Food & Dining' },
                { value: 'shopping', label: 'Shopping' },
                { value: 'bills', label: 'Bills & Utilities' },
                { value: 'salary', label: 'Salary Income' },
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

      {/* Cards, Metric Cards & Progress */}
      <section className="space-y-4">
        <h2 className="text-section-title font-display font-semibold">Cards & Budget Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Total Balance"
            figure="₹1,25,000"
            delta={{ text: '+12.4%', type: 'income' }}
            secondaryText="Indian numbering system formatting"
            icon={<WalletIcon size={20} />}
          />
          <MetricCard
            label="Monthly Expenses"
            figure="₹42,850"
            delta={{ text: '-4.2%', type: 'danger' }}
            secondaryText="Target limit: ₹50,000"
            icon={<ArrowUpIcon size={20} />}
          />
          <Card className="p-6 space-y-4">
            <span className="text-body-sm font-medium text-ink-2">Budget Goal Progress</span>
            <ProgressBar value={42850} max={50000} thresholdPercent={80} showLabels />
            <p className="text-caption text-ink-3">8px track with threshold indicator and automatic warning/danger tints.</p>
          </Card>
        </div>
      </section>

      {/* Category Badges & Generic Badges */}
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

      {/* Colors & Icons */}
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
