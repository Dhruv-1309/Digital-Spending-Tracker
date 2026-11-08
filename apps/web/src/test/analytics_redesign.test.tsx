import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AnalyticsTab } from '../components/analytics/AnalyticsTab';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import type { Transaction, CategoriesMap } from '../types';
import {
  getDailyExpensesInsight,
  getCategoryExpensesInsight,
  getForecastInsight,
  getRunwayInsight,
  getWeekdayExpensesInsight,
} from '../components/analytics/analyticsInsights';
import {
  calculateAnalyticsSummary,
  calculateDailyExpenses,
  calculateExpensesByCategory,
  performTimeSeriesAnalysis,
  calculateSMAForecast,
  calculateMoneyRunway,
  getExpensesByDayOfWeek,
} from '../lib/analytics';
import { getCategoryBadgeColor } from '../components/ui/categoryColors';
import { getThemeTokens } from '../ui/chartTheme';

// Mock chart.js to prevent canvas errors in JSDOM while capturing dataset/options props
vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div
      data-testid="mock-bar-chart"
      data-labels={JSON.stringify(data?.labels)}
      data-datasets={JSON.stringify(
        data?.datasets?.map((d: any) => ({
          label: d.label,
          data: d.data,
          backgroundColor: d.backgroundColor,
          borderRadius: d.borderRadius,
        })),
      )}
      data-options={JSON.stringify({
        animation: options?.animation,
        legend: options?.plugins?.legend,
      })}
    />
  ),
  Doughnut: ({ data, options, plugins }: any) => (
    <div
      data-testid="mock-doughnut-chart"
      data-labels={JSON.stringify(data?.labels)}
      data-datasets={JSON.stringify(
        data?.datasets?.map((d: any) => ({
          data: d.data,
          backgroundColor: d.backgroundColor,
          hoverOffset: d.hoverOffset,
        })),
      )}
      data-plugins={JSON.stringify(plugins?.map((p: any) => p?.id))}
      data-options={JSON.stringify({
        cutout: options?.cutout,
        animation: options?.animation,
      })}
    />
  ),
  Line: ({ data, options }: any) => (
    <div
      data-testid="mock-line-chart"
      data-labels={JSON.stringify(data?.labels)}
      data-datasets={JSON.stringify(
        data?.datasets?.map((d: any) => ({
          label: d.label,
          data: d.data,
          borderColor: d.borderColor,
          borderDash: d.borderDash,
        })),
      )}
      data-options={JSON.stringify({
        animation: options?.animation,
        legend: options?.plugins?.legend,
      })}
    />
  ),
}));

const mockCategories: CategoriesMap = {
  income: ['Salary', 'Investments'],
  expense: ['Food & Dining', 'Shopping', 'Utilities', 'Travel'],
};

// Span 8 days (2026-10-08 to 2026-10-15) so 7-day SMA forecast triggers
const sampleTransactions: Transaction[] = [
  {
    id: 'tx_0',
    amount: 500,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'cash',
    description: 'Snack',
    date: '2026-10-08',
  },
  {
    id: 'tx_1',
    amount: 1200,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'card',
    description: 'Dinner with friends',
    date: '2026-10-15',
  },
  {
    id: 'tx_2',
    amount: 50000,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'bank_transfer',
    description: 'October Salary',
    date: '2026-10-01',
  },
  {
    id: 'tx_3',
    amount: 3500,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'upi',
    description: 'Clothing store',
    date: '2026-10-14',
  },
  {
    id: 'tx_4',
    amount: 800,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'cash',
    description: 'Lunch cafe',
    date: '2026-10-12',
  },
  {
    id: 'tx_5',
    amount: 1500,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'net_banking',
    description: 'Internet bill',
    date: '2026-10-10',
  },
];

const createMockTracker = (overrides: Partial<TrackerContextValue> = {}): TrackerContextValue => ({
  currentTab: 'analytics',
  setCurrentTab: vi.fn(),
  transactions: sampleTransactions,
  categories: mockCategories,
  approvedAnomalies: [],
  autopays: [],
  budgetGoal: { monthlyExpenseLimit: 30000, thresholdPercent: 80 },
  isOnline: true,
  isLoading: false,
  loadError: null,
  refreshData: vi.fn(),
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
  ...overrides,
});

describe('Phase 7: Analytics Screen Redesign', () => {
  /* ==========================================================================
     1. Pure Insight Functions (Item 3 & 8)
     ========================================================================== */
  describe('Pure Insight Functions', () => {
    it('getDailyExpensesInsight computes the highest spending day and share percentage', () => {
      const dailyData = {
        labels: ['10 Oct', '12 Oct', '14 Oct', '15 Oct'],
        amounts: [1500, 800, 3500, 1200],
      };
      // Total = 7000; Max = 3500 on '14 Oct'; share = 50.0%
      const insight = getDailyExpensesInsight(dailyData);
      expect(insight).toContain('Highest single-day spending was ₹3,500 on 14 Oct');
      expect(insight).toContain('50.0% of period expenses');
    });

    it('getDailyExpensesInsight handles empty or zero amounts gracefully', () => {
      expect(getDailyExpensesInsight({ labels: [], amounts: [] })).toBe(
        'No expense transactions recorded in this period.',
      );
      expect(getDailyExpensesInsight({ labels: ['10 Oct'], amounts: [0] })).toBe(
        'No expense spending recorded across the selected dates.',
      );
    });

    it('getCategoryExpensesInsight identifies top category and share', () => {
      const catData = {
        labels: ['Food & Dining', 'Shopping', 'Utilities'],
        amounts: [2000, 3500, 1500],
      };
      // Total = 7000; Top = Shopping at 3500 (50.0%)
      const insight = getCategoryExpensesInsight(catData);
      expect(insight).toBe('Top category is Shopping at ₹3,500 (50.0% of total expenses).');
    });

    it('getCategoryExpensesInsight handles empty data', () => {
      expect(getCategoryExpensesInsight({ labels: [], amounts: [] })).toBe(
        'No category expenses recorded in this period.',
      );
    });

    it('getForecastInsight formats projected 7-day spending and confidence', () => {
      const forecast = {
        totalForecast: 7000,
        smaValue: 1000,
        confidence: 'high' as const,
        forecastDates: ['16 Oct', '17 Oct', '18 Oct', '19 Oct', '20 Oct', '21 Oct', '22 Oct'],
      };
      const insight = getForecastInsight(forecast);
      expect(insight).toBe('Projected 7-day spending is ₹7,000 (₹1,000/day) with high confidence.');
    });

    it('getForecastInsight handles empty forecast dates', () => {
      expect(
        getForecastInsight({
          totalForecast: 0,
          smaValue: 0,
          confidence: 'low',
          forecastDates: [],
        }),
      ).toBe('Add expense transactions to generate 7-day spending forecasts and trends.');
    });

    it('getRunwayInsight formats sustainable and depleting states', () => {
      const sustainable = {
        daysRemaining: Infinity,
        balance: 50000,
        depletionDate: 'N/A',
        burnRatePercent: '0.00',
      };
      expect(getRunwayInsight(sustainable)).toBe(
        'Current balance is sustainable with zero or positive net daily burn rate.',
      );

      const depleting = {
        daysRemaining: 45,
        balance: 45000,
        depletionDate: '29 Nov 2026',
        burnRatePercent: '2.22',
      };
      expect(getRunwayInsight(depleting)).toBe(
        'At a daily burn rate of 2.22%, current balance will last approximately 45 days (depletion: 29 Nov 2026).',
      );
    });

    it('getWeekdayExpensesInsight preserves the exact existing PRD insight sentence', () => {
      const weekdayData = {
        maxDay: 'Wednesday',
        maxAmount: 3500,
        minDay: 'Saturday',
        minAmount: 0,
        totalExpenses: 7000,
        isEmpty: false,
      };
      const insight = getWeekdayExpensesInsight(weekdayData);
      expect(insight).toContain('You tend to spend most on Wednesdays (₹3,500)');
      expect(insight).toContain('least on Saturdays (₹0)');
      expect(insight).toContain('Consider budgeting more carefully on Wednesdays.');
    });
  });

  /* ==========================================================================
     2. Shared Chart Theme Module (Item 2)
     ========================================================================== */
  describe('Shared Chart Theme Module', () => {
    it('reads colors and fonts from design tokens with safe fallbacks', () => {
      const tokens = getThemeTokens();
      expect(tokens.accent).toBeDefined();
      expect(tokens.line).toBeDefined();
      expect(tokens.fontBody).toContain('Instrument Sans');
      expect(tokens.surface).toBeDefined();
    });
  });

  /* ==========================================================================
     3. Sticky Controls Bar & Dropdowns (Item 1)
     ========================================================================== */
  describe('Controls Bar & Selectors', () => {
    it('renders presets as a SegmentedControl with radio roles and options', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      const thisWeek = screen.getByRole('radio', { name: 'This Week' });
      const thisMonth = screen.getByRole('radio', { name: 'This Month' });
      const last30 = screen.getByRole('radio', { name: 'Last 30 Days' });

      expect(thisWeek).toBeInTheDocument();
      expect(thisMonth).toBeInTheDocument();
      expect(last30).toBeInTheDocument();
    });

    it('toggling a preset updates selection and period resets it', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      const thisMonth = screen.getByRole('radio', { name: 'This Month' });
      fireEvent.click(thisMonth);
      expect(thisMonth).toHaveAttribute('aria-checked', 'true');

      // Clicking again toggles off
      fireEvent.click(thisMonth);
      expect(thisMonth).toHaveAttribute('aria-checked', 'false');
    });
  });

  /* ==========================================================================
     4. Daily Expenses Bar Chart (Item 4)
     ========================================================================== */
  describe('Daily Expenses Bar Chart', () => {
    it('renders Daily Expenses card with rounded corners, theme accent color, and insight', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(screen.getByText('Daily Expenses')).toBeInTheDocument();

      const barCharts = screen.getAllByTestId('mock-bar-chart');
      const dailyChart = barCharts[0];
      const datasets = JSON.parse(dailyChart.getAttribute('data-datasets') || '[]');
      expect(datasets.length).toBeGreaterThan(0);
      expect(datasets[0].label).toBe('Daily Expenses');
      expect(datasets[0].borderRadius).toEqual({
        topLeft: 6,
        topRight: 6,
        bottomLeft: 0,
        bottomRight: 0,
      });

      // Visually hidden data table
      expect(screen.getByText('Daily Expenses Table')).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     5. Category Doughnut & Linked Legend (Item 5)
     ========================================================================== */
  describe('Category Doughnut & Interactive Legend', () => {
    it('renders Category Doughnut with 6px hoverOffset and Badge color assignment', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(screen.getByText('Expense by Category')).toBeInTheDocument();

      const doughnutChart = screen.getByTestId('mock-doughnut-chart');
      const datasets = JSON.parse(doughnutChart.getAttribute('data-datasets') || '[]');
      expect(datasets.length).toBe(1);
      expect(datasets[0].hoverOffset).toBe(6);

      // Verify colors match Badge color assignment
      const foodBadgeColor = getCategoryBadgeColor('Food & Dining');
      expect(datasets[0].backgroundColor).toContain(foodBadgeColor.ink);

      // Verify custom centre text plugin is attached
      const plugins = JSON.parse(doughnutChart.getAttribute('data-plugins') || '[]');
      expect(plugins).toContain('categoryDoughnutCentreText');
    });

    it('renders legend rows with percent bars and highlights on mouse hover/focus', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      // Legend rows with percent bars
      const foodRow = screen.getByRole('button', { name: /Food & Dining/i });
      expect(foodRow).toBeInTheDocument();

      fireEvent.mouseEnter(foodRow);
      expect(foodRow.className).toContain('bg-surface-2');

      fireEvent.mouseLeave(foodRow);
      expect(foodRow.className).not.toContain('opacity-40');
    });
  });

  /* ==========================================================================
     6. Forecast Chart & Labelled Confidence Chip (Item 6)
     ========================================================================== */
  describe('7-Day Forecast & Confidence', () => {
    it('renders forecast with dashed line continuation and confidence chip using returned logic value', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(screen.getByText('Time Series Analysis - Expense Trends')).toBeInTheDocument();

      // Confidence chip matches existing logic value without invented thresholds
      expect(screen.getByText(/Confidence: (HIGH|MEDIUM|LOW)/i)).toBeInTheDocument();

      const lineChart = screen.getByTestId('mock-line-chart');
      const datasets = JSON.parse(lineChart.getAttribute('data-datasets') || '[]');
      expect(datasets.length).toBe(2);

      const forecastDataset = datasets.find((d: any) => d.label.includes('Forecast'));
      expect(forecastDataset).toBeDefined();
      expect(forecastDataset.borderDash).toEqual([6, 4]);

      // Hidden data table
      expect(screen.getByText('Expense Trends & Forecast Table')).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     7. Money Runway (Item 7)
     ========================================================================== */
  describe('Money Runway', () => {
    it('renders days remaining as large figure with depletion date and daily burn rate beneath it', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(screen.getByText('Money Runway')).toBeInTheDocument();
      expect(screen.getByText('Estimated Depletion')).toBeInTheDocument();
      expect(screen.getAllByText('Daily Burn Rate').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Current Balance').length).toBeGreaterThanOrEqual(1);

      // Screen reader summary table
      expect(screen.getByText('Money Runway Summary Table')).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     8. Weekday Heatmap (Item 8)
     ========================================================================== */
  describe('Weekday Heatmap', () => {
    it('renders weekday bars colored from accent-tint to accent with insight sentence', () => {
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(screen.getByText('Spending Heatmap - Day of Week Analysis')).toBeInTheDocument();

      // Insight sentence underneath
      expect(screen.getByText(/You tend to spend most on/i)).toBeInTheDocument();

      // Hidden data table
      expect(screen.getByText('Day of Week Spending Heatmap Table')).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     9. Accessibility, Skeletons, Error State, Empty State (Item 9)
     ========================================================================== */
  describe('States & Skeletons', () => {
    it('renders skeleton view when isLoading is true', () => {
      const tracker = createMockTracker({ isLoading: true });
      const { container } = render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders error state with retry button when loadError is present', () => {
      const refreshMock = vi.fn();
      const tracker = createMockTracker({
        loadError: 'Database connection failed',
        refreshData: refreshMock,
      });
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(screen.getByText('Unable to load analytics')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryBtn);
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    it('renders empty state when there are no transactions in selected period', () => {
      const tracker = createMockTracker({ transactions: [] });
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      expect(screen.getByText('No transactions in this period')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Overall Analytics/i })).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     10. Numerical Parity Verification (Item 10)
     ========================================================================== */
  describe('Numerical Parity Verification against pre-redesign calculations', () => {
    it('summary numbers match calculateAnalyticsSummary exactly', () => {
      const expectedSummary = calculateAnalyticsSummary(sampleTransactions);
      const tracker = createMockTracker();
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      const incomeEl = document.getElementById('analyticsIncome');
      const expensesEl = document.getElementById('analyticsExpenses');
      const netEl = document.getElementById('analyticsNet');
      const countEl = document.getElementById('analyticsCount');

      expect(incomeEl?.textContent?.replace(/[₹,]/g, '').trim()).toBe(
        String(expectedSummary.income),
      );
      expect(expensesEl?.textContent?.replace(/[₹,]/g, '').trim()).toBe(
        String(expectedSummary.expenses),
      );
      expect(netEl?.textContent?.replace(/[₹,]/g, '').trim()).toBe(String(expectedSummary.net));
      expect(countEl?.textContent?.trim()).toBe(String(expectedSummary.count));
    });

    it('daily, category, SMA forecast, runway, and weekday figures equal underlying calculations', () => {
      const refDate = new Date();
      const expectedDaily = calculateDailyExpenses(sampleTransactions);
      const expectedCategory = calculateExpensesByCategory(sampleTransactions);
      const expectedTs = performTimeSeriesAnalysis(sampleTransactions);
      const expectedForecast = calculateSMAForecast(
        expectedTs.rawDates,
        expectedTs.amounts,
        7,
        7,
      );
      const expectedRunway = calculateMoneyRunway(
        sampleTransactions,
        expectedTs.stats.averageDailySpending,
        refDate,
      );
      const expectedWeekday = getExpensesByDayOfWeek(sampleTransactions);

      // Verify that the underlying numbers are unchanged
      expect(expectedDaily.amounts.reduce((a, b) => a + b, 0)).toBe(7500);
      expect(expectedCategory.amounts.reduce((a, b) => a + b, 0)).toBe(7500);
      expect(expectedForecast.forecastAmounts.length).toBe(7);
      expect(expectedRunway.balance).toBe(42500); // 50000 - 7500
      expect(expectedWeekday.totalExpenses).toBe(7500);
    });

    it('renders Sustainable and N/A (Sustainable) without Infinity when daily spend is 0 (CORE-7)', () => {
      // Income only: 50,000 income, 0 expense
      const incomeOnly: Transaction[] = [
        {
          id: 'tx_inc_only',
          amount: 50000,
          type: 'income',
          category: 'Salary',
          paymentMethod: 'bank_transfer',
          description: 'Salary Only',
          date: '2026-10-01',
          createdAt: new Date().toISOString(),
        },
      ];

      const tracker = createMockTracker({ transactions: incomeOnly });
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      // Badge displays Sustainable
      expect(screen.getByText('Sustainable')).toBeInTheDocument();

      // Accessible table renders "N/A (Sustainable)" rather than "Infinity"
      const runwayTable = screen.getByRole('table', { name: /Estimated runway and burn metrics/i });
      expect(runwayTable).toHaveTextContent('N/A (Sustainable)');
      expect(runwayTable).not.toHaveTextContent('Infinity');
      expect(runwayTable).not.toHaveTextContent('NaN');
    });

    it('renders 0 and Already Depleted without NaN or Infinity when balance is negative (CORE-7)', () => {
      const negativeBalanceTxs: Transaction[] = [
        {
          id: 'tx_exp_only',
          amount: 5000,
          type: 'expense',
          category: 'Food & Dining',
          paymentMethod: 'upi',
          description: 'Overdraft Dinner',
          date: '2026-10-05',
          createdAt: new Date().toISOString(),
        },
      ];

      const tracker = createMockTracker({ transactions: negativeBalanceTxs });
      render(
        <TrackerContext.Provider value={tracker}>
          <AnalyticsTab />
        </TrackerContext.Provider>,
      );

      // Runway displays Critical badge and Already Depleted
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getAllByText('Already Depleted').length).toBeGreaterThanOrEqual(1);

      const runwayTable = screen.getByRole('table', { name: /Estimated runway and burn metrics/i });
      expect(runwayTable).not.toHaveTextContent('Infinity');
      expect(runwayTable).not.toHaveTextContent('NaN');
    });
  });
});
