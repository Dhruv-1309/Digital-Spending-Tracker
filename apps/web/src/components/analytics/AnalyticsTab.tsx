import { useState, useMemo, useRef, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { ChartOptions, Plugin, TooltipItem, Chart as ChartJS } from 'chart.js';
import '../../lib/chartConfig';
import type { AnalyticsPreset, AnalyticsPeriod } from '../../types';
import { useTracker } from '../../hooks/useTracker';
import {
  extractUniqueYears,
  getAnalyticsDateRange,
  filterAnalyticsTransactions,
  calculateAnalyticsSummary,
  calculateDailyExpenses,
  calculateExpensesByCategory,
  performTimeSeriesAnalysis,
  calculateSMAForecast,
  calculateMoneyRunway,
  getExpensesByDayOfWeek,
} from '../../lib/analytics';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SegmentedControl, type SegmentedOption } from '../ui/SegmentedControl';
import { Dropdown, type DropdownOption } from '../ui/Dropdown';
import { EmptyState } from '../ui/EmptyState';
import { formatIndianGrouping } from '../ui/formatIndianGrouping';
import { getCategoryBadgeColor } from '../ui/categoryColors';
import { useChartTheme, customHtmlTooltip, cleanupChartTooltips } from '../../ui/chartTheme';
import {
  getDailyExpensesInsight,
  getCategoryExpensesInsight,
  getForecastInsight,
  getRunwayInsight,
  getWeekdayExpensesInsight,
} from './analyticsInsights';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import {
  AlertCircleIcon,
  RefreshCwIcon,
  BarChartIcon,
  PieChartIcon,
  AreaChartIcon,
  HourglassIcon,
  FlameIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  WalletIcon,
  ListCheckIcon,
} from '../icons';

const PRESET_OPTIONS: SegmentedOption[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-30-days', label: 'Last 30 Days' },
];

const PERIOD_OPTIONS: DropdownOption[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'overall', label: 'Overall' },
];

const MONTH_OPTIONS: DropdownOption[] = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function AnalyticsTab() {
  const { transactions, isLoading, loadError, refreshData } = useTracker();
  const { themeTokens, animation } = useChartTheme();

  const now = useMemo(() => new Date(), []);
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  // Default month & year: current month/year if transactions exist in it or if empty;
  // otherwise latest month with transactions
  const defaultMonthYear = useMemo(() => {
    if (transactions.length === 0) {
      return { month: currentMonthStr, year: currentYearStr };
    }
    const currentMonthKey = `${currentYearStr}-${currentMonthStr}`;
    const hasCurrentMonthTx = transactions.some(
      (t) => t.date && t.date.startsWith(currentMonthKey),
    );
    if (hasCurrentMonthTx) {
      return { month: currentMonthStr, year: currentYearStr };
    }
    const validDates = transactions
      .map((t) => t.date)
      .filter((d) => d && d.length >= 7)
      .sort()
      .reverse();
    if (validDates.length > 0) {
      const [y, m] = validDates[0].split('-');
      return { month: m, year: y };
    }
    return { month: currentMonthStr, year: currentYearStr };
  }, [transactions, currentMonthStr, currentYearStr]);

  const [preset, setPreset] = useState<AnalyticsPreset>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthYear.month);
  const [selectedYear, setSelectedYear] = useState<string>(defaultMonthYear.year);

  // Sync if defaultMonthYear updates when transactions first load
  useEffect(() => {
    setSelectedMonth((prev) => (prev === currentMonthStr ? defaultMonthYear.month : prev));
    setSelectedYear((prev) => (prev === currentYearStr ? defaultMonthYear.year : prev));
  }, [defaultMonthYear, currentMonthStr, currentYearStr]);

  // Category Doughnut <-> Legend bidirectional hover state
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const doughnutRef = useRef<ChartJS<'doughnut'> | null>(null);

  // Cleanup tooltips on unmount
  useEffect(() => {
    return () => cleanupChartTooltips();
  }, []);

  const availableYears = useMemo(() => {
    return extractUniqueYears(transactions, now.getFullYear());
  }, [transactions, now]);

  const yearOptions: DropdownOption[] = useMemo(() => {
    return availableYears.map((y) => ({ value: y, label: y }));
  }, [availableYears]);

  const handlePreset = (clickedPreset: string) => {
    setPreset((prev) => (prev === clickedPreset ? null : (clickedPreset as AnalyticsPreset)));
  };

  const handlePeriodChange = (val: string) => {
    setPreset(null);
    setPeriod(val as AnalyticsPeriod);
  };

  const handleMonthChange = (val: string) => {
    setPreset(null);
    setSelectedMonth(val);
  };

  const handleYearChange = (val: string) => {
    setPreset(null);
    setSelectedYear(val);
  };

  // Filter transactions
  const dateRange = useMemo(() => {
    return getAnalyticsDateRange(preset, period, selectedYear, selectedMonth, now);
  }, [preset, period, selectedYear, selectedMonth, now]);

  const filteredTransactions = useMemo(() => {
    return filterAnalyticsTransactions(transactions, dateRange);
  }, [transactions, dateRange]);

  // Summaries
  const summary = useMemo(() => {
    return calculateAnalyticsSummary(filteredTransactions);
  }, [filteredTransactions]);

  // 1. Daily Expenses Data
  const dailyData = useMemo(() => {
    return calculateDailyExpenses(filteredTransactions);
  }, [filteredTransactions]);

  const dailyBarData = useMemo(() => {
    return {
      labels: dailyData.labels,
      datasets: [
        {
          label: 'Daily Expenses',
          data: dailyData.amounts,
          backgroundColor: themeTokens.accent,
          hoverBackgroundColor: themeTokens.accent,
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: 'bottom' as const,
        },
      ],
    };
  }, [dailyData, themeTokens.accent]);

  const dailyBarOptions: ChartOptions<'bar'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: customHtmlTooltip,
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: themeTokens.ink3,
            font: { family: themeTokens.fontBody, size: 11, weight: 500 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: themeTokens.line, drawBorder: false },
          ticks: {
            color: themeTokens.ink3,
            font: { family: themeTokens.fontBody, size: 11, weight: 500 },
            callback: (value: string | number) => `₹${formatIndianGrouping(Number(value))}`,
          },
        },
      },
    };
  }, [animation, themeTokens]);

  // 2. Expense by Category Data
  const categoryData = useMemo(() => {
    return calculateExpensesByCategory(filteredTransactions);
  }, [filteredTransactions]);

  const categoryTotal = useMemo(() => {
    return categoryData.amounts.reduce((sum, val) => sum + val, 0);
  }, [categoryData]);

  // Use Badge color assignment for category colors (SPEC Section 3 & Task 5)
  const categoryPalettes = useMemo(() => {
    return categoryData.labels.map((label) => getCategoryBadgeColor(label));
  }, [categoryData.labels]);

  const pieData = useMemo(() => {
    return {
      labels: categoryData.labels,
      datasets: [
        {
          data: categoryData.amounts,
          backgroundColor: categoryPalettes.map((p) => p.ink),
          hoverBackgroundColor: categoryPalettes.map((p) => p.ink),
          borderWidth: 2,
          borderColor: themeTokens.surface,
          hoverOffset: 6,
        },
      ],
    };
  }, [categoryData, categoryPalettes, themeTokens.surface]);

  // Small Chart.js plugin to draw category name and amount in the centre
  const doughnutCentreTextPlugin: Plugin<'doughnut'> = useMemo(() => {
    return {
      id: 'categoryDoughnutCentreText',
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const activeElements = chart.getActiveElements();

        let title = 'Total Expenses';
        let amount = `₹${formatIndianGrouping(categoryTotal)}`;
        let share = '';

        if (activeElements.length > 0) {
          const idx = activeElements[0].index;
          if (categoryData.labels[idx]) {
            title = categoryData.labels[idx];
            const val = categoryData.amounts[idx] || 0;
            amount = `₹${formatIndianGrouping(val)}`;
            share = categoryTotal > 0 ? `${((val / categoryTotal) * 100).toFixed(1)}%` : '0%';
          }
        }

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;

        ctx.font = `500 12px ${themeTokens.fontBody}`;
        ctx.fillStyle = themeTokens.ink2;
        ctx.fillText(title, cx, share ? cy - 14 : cy - 8);

        ctx.font = `600 18px ${themeTokens.fontBody}`;
        ctx.fillStyle = themeTokens.ink;
        ctx.fillText(amount, cx, share ? cy + 6 : cy + 12);

        if (share) {
          ctx.font = `500 11px ${themeTokens.fontBody}`;
          ctx.fillStyle = themeTokens.ink3;
          ctx.fillText(share, cx, cy + 24);
        }

        ctx.restore();
      },
    };
  }, [categoryData, categoryTotal, themeTokens]);

  const pieOptions: ChartOptions<'doughnut'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: customHtmlTooltip,
        },
      },
      onHover: (_event, elements) => {
        if (elements.length > 0) {
          setHoveredCategoryIndex(elements[0].index);
        } else {
          setHoveredCategoryIndex(null);
        }
      },
    };
  }, [animation]);

  // Legend hover row -> chart segment highlight
  const highlightChartSegment = (index: number | null) => {
    if (!doughnutRef.current) return;
    if (index !== null) {
      doughnutRef.current.setActiveElements([{ datasetIndex: 0, index }]);
    } else {
      doughnutRef.current.setActiveElements([]);
    }
    doughnutRef.current.update();
  };

  // 3. Time Series Data & Forecast & Runway
  const timeSeriesAnalysis = useMemo(() => {
    return performTimeSeriesAnalysis(filteredTransactions);
  }, [filteredTransactions]);

  const forecast = useMemo(() => {
    return calculateSMAForecast(
      timeSeriesAnalysis.rawDates,
      timeSeriesAnalysis.amounts,
      7,
      7,
    );
  }, [timeSeriesAnalysis]);

  const runway = useMemo(() => {
    return calculateMoneyRunway(
      transactions,
      timeSeriesAnalysis.stats.averageDailySpending,
      now,
    );
  }, [transactions, timeSeriesAnalysis.stats.averageDailySpending, now]);

  const timeSeriesLineData = useMemo(() => {
    const allLabels = [...timeSeriesAnalysis.dates, ...forecast.forecastDates];
    const datasets = [
      {
        label: 'Daily Expenses',
        data: [
          ...timeSeriesAnalysis.amounts,
          ...Array(forecast.forecastDates.length).fill(null),
        ],
        borderColor: themeTokens.ink,
        backgroundColor: 'rgba(31, 27, 22, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: themeTokens.surface,
        pointBorderColor: themeTokens.ink,
        pointBorderWidth: 2,
      },
    ];

    if (forecast.forecastDates.length > 0) {
      datasets.push({
        label: '7-Day Forecast (SMA)',
        data: [
          ...Array(Math.max(0, timeSeriesAnalysis.amounts.length - 1)).fill(null),
          timeSeriesAnalysis.amounts[timeSeriesAnalysis.amounts.length - 1],
          ...forecast.forecastAmounts,
        ],
        borderColor: themeTokens.accent,
        backgroundColor: 'rgba(42, 79, 214, 0.06)',
        borderWidth: 2,
        // @ts-expect-error borderDash is valid on Line dataset
        borderDash: [6, 4],
        fill: false,
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: themeTokens.surface,
        pointBorderColor: themeTokens.accent,
        pointBorderWidth: 2,
        pointStyle: 'rectRot',
      });
    }

    return {
      labels: allLabels,
      datasets,
    };
  }, [timeSeriesAnalysis, forecast, themeTokens]);

  const timeSeriesLineOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            color: themeTokens.ink2,
            font: { family: themeTokens.fontBody, size: 12, weight: 500 },
          },
        },
        tooltip: {
          enabled: false,
          external: customHtmlTooltip,
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: themeTokens.ink3,
            font: { family: themeTokens.fontBody, size: 11, weight: 500 },
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: themeTokens.line, drawBorder: false },
          ticks: {
            color: themeTokens.ink3,
            font: { family: themeTokens.fontBody, size: 11, weight: 500 },
            callback: (value: string | number) => `₹${formatIndianGrouping(Number(value))}`,
          },
        },
      },
    };
  }, [animation, themeTokens]);

  // 4. Day of Week Analysis
  const dayOfWeekData = useMemo(() => {
    return getExpensesByDayOfWeek(filteredTransactions);
  }, [filteredTransactions]);

  const dayOfWeekBarData = useMemo(() => {
    const days = Object.keys(dayOfWeekData.dayTotals);
    const totals = Object.values(dayOfWeekData.dayTotals);
    const maxTotal = Math.max(...totals, 1);

    // Color runs from --accent-tint (#E6EBFB: 230, 235, 251) to --accent (#2A4FD6: 42, 79, 214)
    const colors = totals.map((total) => {
      const intensity = maxTotal > 0 ? total / maxTotal : 0;
      const r = Math.round(230 - intensity * (230 - 42));
      const g = Math.round(235 - intensity * (235 - 79));
      const b = Math.round(251 - intensity * (251 - 214));
      return `rgb(${r}, ${g}, ${b})`;
    });

    return {
      labels: days,
      datasets: [
        {
          label: 'Total Spending',
          data: totals,
          backgroundColor: colors,
          hoverBackgroundColor: themeTokens.accent,
          borderWidth: 0,
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: 'bottom' as const,
        },
      ],
    };
  }, [dayOfWeekData, themeTokens.accent]);

  const dayOfWeekBarOptions: ChartOptions<'bar'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (context: TooltipItem<'bar'>[]) => {
              const day = context[0].label;
              const count = dayOfWeekData.dayCounts[day] || 0;
              return `${day} (${count} transaction${count !== 1 ? 's' : ''})`;
            },
            label: (context: TooltipItem<'bar'>) => {
              const day = context.label;
              const total = context.parsed.y;
              const avg = dayOfWeekData.dayAverages[day] || 0;
              return [
                `Total: ₹${formatIndianGrouping(Number(total))}`,
                `Average: ₹${formatIndianGrouping(avg)} per transaction`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: themeTokens.ink3,
            font: { family: themeTokens.fontBody, size: 11, weight: 500 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: themeTokens.line, drawBorder: false },
          ticks: {
            color: themeTokens.ink3,
            font: { family: themeTokens.fontBody, size: 11, weight: 500 },
            callback: (value: string | number) => `₹${formatIndianGrouping(Number(value))}`,
          },
        },
      },
    };
  }, [animation, dayOfWeekData, themeTokens]);

  const tsStats = timeSeriesAnalysis.stats;

  // 1. Loading State Skeletons
  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  // 2. Error State with Retry
  if (loadError) {
    return (
      <div id="analytics" className="w-full max-w-md mx-auto my-12 p-8 text-center bg-surface border border-line rounded-card shadow-1 animate-section-entrance">
        <div className="w-12 h-12 rounded-full bg-danger-tint text-danger flex items-center justify-center mx-auto mb-4">
          <AlertCircleIcon size={24} />
        </div>
        <h3 className="font-display font-semibold text-lg text-ink mb-2">
          Unable to load analytics
        </h3>
        <p className="text-sm text-ink-2 mb-6">
          {loadError || 'An error occurred while calculating analytics data.'}
        </p>
        <Button
          variant="secondary"
          onClick={() => (refreshData ? refreshData() : window.location.reload())}
          className="gap-2 mx-auto"
        >
          <RefreshCwIcon size={16} />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div id="analytics" className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Sticky Controls Bar (SPEC Section 6, Task 1) */}
      <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 bg-bg/95 backdrop-blur-sm border-b border-line flex flex-wrap items-center justify-between gap-3">
        {/* Presets SegmentedControl with sliding indicator */}
        <div id="analyticsPresets" className="flex items-center">
          <SegmentedControl
            options={PRESET_OPTIONS}
            value={preset || ''}
            onChange={handlePreset}
            size="md"
          />
        </div>

        {/* Period granularity and year/month dropdowns on right */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-32">
            <Dropdown
              id="analyticsPeriod"
              value={period}
              options={PERIOD_OPTIONS}
              onChange={handlePeriodChange}
            />
          </div>

          <div
            id="analyticsMonthWrap"
            className={period !== 'monthly' ? 'hidden' : 'w-36'}
          >
            <Dropdown
              id="analyticsMonth"
              value={selectedMonth}
              options={MONTH_OPTIONS}
              onChange={handleMonthChange}
            />
          </div>

          <div
            id="analyticsYearWrap"
            className={period !== 'monthly' && period !== 'yearly' ? 'hidden' : 'w-28'}
          >
            <Dropdown
              id="analyticsYear"
              value={selectedYear}
              options={yearOptions}
              onChange={handleYearChange}
            />
          </div>
        </div>
      </div>

      {/* 3. Empty State when no transactions in selected period */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="No transactions in this period"
            description="There are no transactions recorded for the selected date range. Try choosing another preset or period."
            action={
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setPreset(null);
                  setPeriod('overall');
                }}
              >
                View Overall Analytics
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" id="analyticsSummaryGrid">
            {/* 1. Income */}
            <Card className="p-4 sm:p-5 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider">Income</span>
                <div className="w-7 h-7 rounded-full bg-income-tint text-income flex items-center justify-center shrink-0 border border-income/20">
                  <TrendingUpIcon size={14} />
                </div>
              </div>
              <div>
                <div id="analyticsIncome" className="font-display text-2xl sm:text-3xl font-semibold text-income tabular-nums">
                  ₹{formatIndianGrouping(summary.income)}
                </div>
                <span className="text-[11px] text-ink-3 mt-1 block font-sans">Period inflow</span>
              </div>
            </Card>

            {/* 2. Expenses */}
            <Card className="p-4 sm:p-5 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider">Expenses</span>
                <div className="w-7 h-7 rounded-full bg-danger-tint text-danger flex items-center justify-center shrink-0 border border-danger/20">
                  <TrendingDownIcon size={14} />
                </div>
              </div>
              <div>
                <div id="analyticsExpenses" className="font-display text-2xl sm:text-3xl font-semibold text-ink tabular-nums">
                  ₹{formatIndianGrouping(summary.expenses)}
                </div>
                <span className="text-[11px] text-ink-3 mt-1 block font-sans">Period outflow</span>
              </div>
            </Card>

            {/* 3. Net */}
            <Card className="p-4 sm:p-5 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider">Net</span>
                <div className="w-7 h-7 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
                  <WalletIcon size={14} />
                </div>
              </div>
              <div>
                <div
                  id="analyticsNet"
                  className={`font-display text-2xl sm:text-3xl font-semibold tabular-nums ${
                    summary.net >= 0 ? 'text-income' : 'text-danger'
                  }`}
                >
                  ₹{formatIndianGrouping(summary.net)}
                </div>
                <span className="text-[11px] text-ink-3 mt-1 block font-sans">Net savings</span>
              </div>
            </Card>

            {/* 4. Transactions */}
            <Card className="p-4 sm:p-5 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider">Transactions</span>
                <div className="w-7 h-7 rounded-full bg-surface-2 text-ink-2 flex items-center justify-center shrink-0 border border-line">
                  <ListCheckIcon size={14} />
                </div>
              </div>
              <div>
                <div id="analyticsCount" className="font-display text-2xl sm:text-3xl font-semibold text-ink tabular-nums">
                  {summary.count}
                </div>
                <span className="text-[11px] text-ink-3 mt-1 block font-sans">Total records</span>
              </div>
            </Card>
          </div>

          {/* Grid: Daily Expenses & Category Doughnut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4. Daily Expenses Card */}
            <Card className="p-5 sm:p-6 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
                      <BarChartIcon size={16} />
                    </div>
                    <h3 className="font-display font-semibold text-ink text-base sm:text-lg">Daily Expenses</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-chip text-xs font-medium bg-surface-2 text-ink-2 border border-line">
                    Trend by day
                  </span>
                </div>

                {dailyData.labels.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-ink-3">
                    No expense data available
                  </div>
                ) : (
                  <div className="h-64 relative w-full">
                    <Bar data={dailyBarData} options={dailyBarOptions} />

                    {/* Visually hidden data table */}
                    <div className="sr-only">
                      <h4>Daily Expenses Table</h4>
                      <table>
                        <caption>Daily expenses for the selected period</caption>
                        <thead>
                          <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyData.labels.map((lbl, idx) => (
                            <tr key={lbl}>
                              <td>{lbl}</td>
                              <td>₹{formatIndianGrouping(dailyData.amounts[idx])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 1 sentence underneath */}
              <div className="mt-4 pt-3 border-t border-line/70 flex items-start gap-2 text-xs text-ink-2 font-sans leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <p>{getDailyExpensesInsight(dailyData)}</p>
              </div>
            </Card>

            {/* 5. Category Doughnut Card with Linked Legend */}
            <Card className="p-5 sm:p-6 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
                      <PieChartIcon size={16} />
                    </div>
                    <h3 className="font-display font-semibold text-ink text-base sm:text-lg">Expense by Category</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-chip text-xs font-medium bg-surface-2 text-ink-2 border border-line">
                    Distribution
                  </span>
                </div>

                {categoryData.labels.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-ink-3">
                    No category expense data available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    {/* Doughnut Chart */}
                    <div className="sm:col-span-6 h-60 relative w-full flex items-center justify-center">
                      <Doughnut
                        ref={doughnutRef}
                        data={pieData}
                        options={pieOptions}
                        plugins={[doughnutCentreTextPlugin]}
                      />
                    </div>

                    {/* Interactive Legend beside it with percent bars */}
                    <div className="sm:col-span-6 space-y-2 max-h-60 overflow-y-auto pr-1">
                      {categoryData.labels.map((label, idx) => {
                        const amount = categoryData.amounts[idx];
                        const pct = categoryTotal > 0 ? ((amount / categoryTotal) * 100).toFixed(1) : '0';
                        const palette = categoryPalettes[idx];
                        const isHovered = hoveredCategoryIndex === idx;

                        return (
                          <div
                            key={label}
                            tabIndex={0}
                            role="button"
                            aria-label={`${label}: ₹${formatIndianGrouping(amount)} (${pct}%)`}
                            onMouseEnter={() => {
                              setHoveredCategoryIndex(idx);
                              highlightChartSegment(idx);
                            }}
                            onMouseLeave={() => {
                              setHoveredCategoryIndex(null);
                              highlightChartSegment(null);
                            }}
                            onFocus={() => {
                              setHoveredCategoryIndex(idx);
                              highlightChartSegment(idx);
                            }}
                            onBlur={() => {
                              setHoveredCategoryIndex(null);
                              highlightChartSegment(null);
                            }}
                            className={`p-2 rounded-btn transition-all duration-fast select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                              isHovered
                                ? 'bg-surface-2 ring-1 ring-line-strong'
                                : hoveredCategoryIndex !== null
                                  ? 'opacity-40'
                                  : 'hover:bg-surface-2'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-sans gap-2">
                              <Badge category={label}>{label}</Badge>
                              <div className="text-right">
                                <span className="font-semibold text-ink tabular-nums">
                                  ₹{formatIndianGrouping(amount)}
                                </span>
                                <span className="text-ink-3 ml-1.5 tabular-nums">({pct}%)</span>
                              </div>
                            </div>

                            {/* Percent bar */}
                            <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full rounded-full transition-all duration-base"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: palette.ink,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Visually hidden data table */}
                    <div className="sr-only">
                      <h4>Expenses by Category Table</h4>
                      <table>
                        <caption>Category breakdown for the selected period</caption>
                        <thead>
                          <tr>
                            <th scope="col">Category</th>
                            <th scope="col">Amount</th>
                            <th scope="col">Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryData.labels.map((cat, idx) => (
                            <tr key={cat}>
                              <td>{cat}</td>
                              <td>₹{formatIndianGrouping(categoryData.amounts[idx])}</td>
                              <td>
                                {categoryTotal > 0
                                  ? ((categoryData.amounts[idx] / categoryTotal) * 100).toFixed(1)
                                  : '0'}
                                %
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 1 sentence underneath */}
              <div className="mt-4 pt-3 border-t border-line/70 flex items-start gap-2 text-xs text-ink-2 font-sans leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <p>{getCategoryExpensesInsight(categoryData)}</p>
              </div>
            </Card>
          </div>

          {/* Grid: 6. Forecast & 7. Money Runway */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 6. Forecast Card */}
            <Card className="lg:col-span-2 p-5 sm:p-6 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4 pb-2 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
                      <AreaChartIcon size={16} />
                    </div>
                    <h3 className="font-display font-semibold text-ink text-base sm:text-lg">
                      Time Series Analysis - Expense Trends
                    </h3>
                  </div>

                  {forecast.forecastDates.length > 0 && (
                    <Badge
                      variant={
                        forecast.confidence === 'high'
                          ? 'income'
                          : forecast.confidence === 'medium'
                            ? 'warning'
                            : 'danger'
                      }
                      className="text-xs"
                    >
                      Confidence: {forecast.confidence.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {timeSeriesAnalysis.dates.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-ink-3">
                    No expense data available for time series analysis
                  </div>
                ) : (
                  <>
                    <div className="h-64 relative w-full mb-4">
                      <Line data={timeSeriesLineData} options={timeSeriesLineOptions} />

                      {/* Visually hidden data table */}
                      <div className="sr-only">
                        <h4>Expense Trends & Forecast Table</h4>
                        <table>
                          <caption>Daily spending and 7-day forecast predictions</caption>
                          <thead>
                            <tr>
                              <th scope="col">Date</th>
                              <th scope="col">Actual Expense</th>
                              <th scope="col">Predicted Expense</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timeSeriesAnalysis.rawDates.map((date, idx) => (
                              <tr key={date}>
                                <td>{date}</td>
                                <td>₹{formatIndianGrouping(timeSeriesAnalysis.amounts[idx])}</td>
                                <td>—</td>
                              </tr>
                            ))}
                            {forecast.forecastDates.map((date, idx) => (
                              <tr key={date}>
                                <td>{date} (Predicted)</td>
                                <td>—</td>
                                <td>₹{formatIndianGrouping(forecast.forecastAmounts[idx])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Stats Box */}
                    <div
                      id="timeSeriesStats"
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-surface-2/70 border border-line/60 rounded-btn text-xs font-sans"
                    >
                      <div>
                        <span className="text-ink-3 block">Total Period</span>
                        <span className="font-semibold text-ink">{tsStats.totalDays} days</span>
                      </div>
                      <div>
                        <span className="text-ink-3 block">Active Spending Days</span>
                        <span className="font-semibold text-ink">{tsStats.daysWithSpending} days</span>
                      </div>
                      <div>
                        <span className="text-ink-3 block">Avg Daily Spend</span>
                        <span className="font-semibold text-ink tabular-nums">
                          ₹{formatIndianGrouping(tsStats.averageDailySpending)}
                        </span>
                      </div>
                      <div>
                        <span className="text-ink-3 block">Predicted Daily SMA</span>
                        <span className="font-semibold text-accent tabular-nums">
                          ₹{formatIndianGrouping(forecast.smaValue)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 1 sentence underneath */}
              <div className="mt-4 pt-3 border-t border-line/70 flex items-start gap-2 text-xs text-ink-2 font-sans leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <p>{getForecastInsight(forecast)}</p>
              </div>
            </Card>

            {/* 7. Money Runway Card */}
            <Card className="relative overflow-hidden p-5 sm:p-6 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
              {/* Decorative subtle aura background overlay */}
              <div
                className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none select-none opacity-10 bg-gradient-to-br from-accent to-income blur-xl"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
                      <HourglassIcon size={16} />
                    </div>
                    <h3 className="font-display font-semibold text-ink text-base sm:text-lg">Money Runway</h3>
                  </div>
                  <Badge
                    variant={
                      runway.daysRemaining === Infinity
                        ? 'income'
                        : runway.daysRemaining <= 7
                          ? 'danger'
                          : runway.daysRemaining <= 30
                            ? 'warning'
                            : 'income'
                    }
                    className="text-xs"
                  >
                    {runway.daysRemaining === Infinity
                      ? 'Sustainable'
                      : runway.daysRemaining <= 7
                        ? 'Critical'
                        : runway.daysRemaining <= 30
                          ? 'Watch'
                          : 'Healthy'}
                  </Badge>
                </div>

                {/* Days remaining large figure */}
                <div className="my-5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-display text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight ${
                        runway.daysRemaining <= 7
                          ? 'text-danger'
                          : runway.daysRemaining <= 30
                            ? 'text-warning'
                            : 'text-income'
                      }`}
                    >
                      {runway.daysRemaining === Infinity ? '∞' : runway.daysRemaining}
                    </span>
                    <span className="text-ink-2 font-sans text-sm font-medium">
                      {runway.daysRemaining === Infinity ? 'days (Sustainable)' : 'days remaining'}
                    </span>
                  </div>
                </div>

                {/* Metrics list */}
                <div className="space-y-3 pt-3 border-t border-line text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">Estimated Depletion</span>
                    <span className="font-semibold text-ink tabular-nums">
                      {runway.depletionDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">Daily Burn Rate</span>
                    <span className="font-semibold text-ink tabular-nums">
                      {runway.burnRatePercent}%/day
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">Current Balance</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        runway.balance >= 0 ? 'text-income' : 'text-danger'
                      }`}
                    >
                      ₹{formatIndianGrouping(runway.balance)}
                    </span>
                  </div>
                </div>

                {/* Visually hidden data table */}
                <div className="sr-only">
                  <h4>Money Runway Summary Table</h4>
                  <table>
                    <caption>Estimated runway and burn metrics</caption>
                    <tbody>
                      <tr>
                        <td>Current Balance</td>
                        <td>₹{formatIndianGrouping(runway.balance)}</td>
                      </tr>
                      <tr>
                        <td>Days Remaining</td>
                        <td>{runway.daysRemaining}</td>
                      </tr>
                      <tr>
                        <td>Estimated Depletion Date</td>
                        <td>{runway.depletionDate}</td>
                      </tr>
                      <tr>
                        <td>Daily Burn Rate</td>
                        <td>{runway.burnRatePercent}%/day</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 1 sentence underneath */}
              <div className="relative z-10 mt-4 pt-3 border-t border-line/70 flex items-start gap-2 text-xs text-ink-2 font-sans leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <p>{getRunwayInsight(runway)}</p>
              </div>
            </Card>
          </div>

          {/* 8. Weekday Heatmap Card */}
          <Card className="p-5 sm:p-6 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
                    <FlameIcon size={16} />
                  </div>
                  <h3 className="font-display font-semibold text-ink text-base sm:text-lg">
                    Spending Heatmap - Day of Week Analysis
                  </h3>
                </div>
              </div>

              {dayOfWeekData.isEmpty ? (
                <div className="flex items-center justify-center h-64 text-sm text-ink-3">
                  No expense data available for day of week analysis
                </div>
              ) : (
                <>
                  <div className="h-64 relative w-full mb-4">
                    <Bar data={dayOfWeekBarData} options={dayOfWeekBarOptions} />

                    {/* Visually hidden data table */}
                    <div className="sr-only">
                      <h4>Day of Week Spending Heatmap Table</h4>
                      <table>
                        <caption>Total and average spending by day of week</caption>
                        <thead>
                          <tr>
                            <th scope="col">Day</th>
                            <th scope="col">Total Spending</th>
                            <th scope="col">Transaction Count</th>
                            <th scope="col">Average Spending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(dayOfWeekData.dayTotals).map((day) => (
                            <tr key={day}>
                              <td>{day}</td>
                              <td>₹{formatIndianGrouping(dayOfWeekData.dayTotals[day])}</td>
                              <td>{dayOfWeekData.dayCounts[day] || 0}</td>
                              <td>₹{formatIndianGrouping(dayOfWeekData.dayAverages[day] || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick stats box */}
                  <div
                    id="dayOfWeekStats"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-surface-2/70 border border-line/60 rounded-btn text-xs font-sans mb-3"
                  >
                    <div>
                      <span className="text-ink-3 block">Highest Day</span>
                      <span className="font-semibold text-ink">
                        {dayOfWeekData.maxDay} (₹{formatIndianGrouping(dayOfWeekData.maxAmount)})
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-3 block">Lowest Day</span>
                      <span className="font-semibold text-ink">
                        {dayOfWeekData.minDay} (₹{formatIndianGrouping(dayOfWeekData.minAmount)})
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-3 block">Total Weekly Spend</span>
                      <span className="font-semibold text-ink tabular-nums">
                        ₹{formatIndianGrouping(dayOfWeekData.totalExpenses)}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-3 block">Average Daily Spend</span>
                      <span className="font-semibold text-ink tabular-nums">
                        ₹{formatIndianGrouping(Math.round(dayOfWeekData.totalExpenses / 7))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 1 sentence underneath (existing insight sentence) */}
            <div className="mt-3 pt-3 border-t border-line/70 flex items-start gap-2 text-xs text-ink-2 font-sans leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
              <p>{getWeekdayExpensesInsight(dayOfWeekData)}</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
