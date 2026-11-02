import { useState, useMemo } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { ChartOptions, TooltipItem } from 'chart.js';
import '../../lib/chartConfig';
import type { AnalyticsPreset, AnalyticsPeriod } from '../../types';
import { useTracker } from '../../hooks/useTracker';
import { CustomSelect } from '../common/CustomSelect';
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
import { formatCurrency } from '../../lib/formatters';
import { CheckIcon, AlertTriangleIcon } from '../common/icons';

const MONTH_OPTIONS = [
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

const PERIOD_OPTIONS = [
  { value: 'overall', label: 'Overall' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const CATEGORY_PALETTE = [
  '#B45309', // amber/accent
  '#2E7D5B', // sage/income
  '#854D0E', // warm brown
  '#C2410C', // terracotta
  '#0F766E', // teal
  '#4338CA', // indigo
  '#7E22CE', // purple
  '#A16207', // ochre
];

export function AnalyticsTab() {
  const { transactions } = useTracker();

  const now = useMemo(() => new Date(), []);
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const [preset, setPreset] = useState<AnalyticsPreset>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('overall');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);

  const availableYears = useMemo(() => {
    return extractUniqueYears(transactions, now.getFullYear());
  }, [transactions, now]);

  const yearOptions = useMemo(() => {
    return availableYears.map((y) => ({ value: y, label: y }));
  }, [availableYears]);

  const handlePreset = (clickedPreset: NonNullable<AnalyticsPreset>) => {
    setPreset((prev) => (prev === clickedPreset ? null : clickedPreset));
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
          backgroundColor: '#B45309', // --accent deep
          borderColor: '#92400E',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [dailyData]);

  const dailyBarOptions: ChartOptions<'bar'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#FFFDF9',
          titleColor: '#1F1B16',
          bodyColor: '#5C5449',
          borderColor: '#E8E2D8',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              return ` ${formatCurrency(Number(context.parsed.y))}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8C8274', font: { family: 'Instrument Sans', size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#E8E2D8' },
          ticks: {
            color: '#8C8274',
            font: { family: 'Instrument Sans', size: 11 },
            callback: (value: string | number) => '₹' + Number(value).toLocaleString('en-IN'),
          },
        },
      },
    };
  }, []);

  // 2. Expense by Category Data
  const categoryData = useMemo(() => {
    return calculateExpensesByCategory(filteredTransactions);
  }, [filteredTransactions]);

  const pieData = useMemo(() => {
    const colors = categoryData.labels.map((_, i) => CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]);
    return {
      labels: categoryData.labels,
      datasets: [
        {
          data: categoryData.amounts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#FFFDF9',
          hoverOffset: 6,
        },
      ],
    };
  }, [categoryData]);

  const totalCategoryExpenses = useMemo(() => {
    return categoryData.amounts.reduce((a, b) => a + b, 0);
  }, [categoryData]);

  const pieOptions: ChartOptions<'doughnut'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#FFFDF9',
          titleColor: '#1F1B16',
          bodyColor: '#5C5449',
          borderColor: '#E8E2D8',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) => {
              const value = context.parsed;
              const total = totalCategoryExpenses;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return ` ${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            },
          },
        },
      },
      cutout: '72%',
    };
  }, [totalCategoryExpenses]);

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
        label: 'Actual Spending',
        data: [
          ...timeSeriesAnalysis.amounts,
          ...Array(forecast.forecastDates.length).fill(null),
        ],
        borderColor: '#1F1B16', // --ink
        backgroundColor: 'rgba(31, 27, 22, 0.04)',
        borderWidth: 2,
        fill: true,
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1F1B16',
        pointBorderColor: '#FFFDF9',
        pointBorderWidth: 2,
      },
    ];

    if (forecast.forecastDates.length > 0) {
      datasets.push({
        label: '7-Day Forecast',
        data: [
          ...Array(Math.max(0, timeSeriesAnalysis.amounts.length - 1)).fill(null),
          timeSeriesAnalysis.amounts[timeSeriesAnalysis.amounts.length - 1],
          ...forecast.forecastAmounts,
        ],
        borderColor: '#B45309', // --accent
        backgroundColor: 'rgba(180, 83, 9, 0.04)',
        borderWidth: 2,
        // @ts-expect-error borderDash is valid on Line dataset
        borderDash: [6, 4],
        fill: false,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#B45309',
        pointBorderColor: '#FFFDF9',
        pointBorderWidth: 2,
        pointStyle: 'circle',
      });
    }

    return {
      labels: allLabels,
      datasets,
    };
  }, [timeSeriesAnalysis, forecast]);

  const timeSeriesLineOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { family: 'Instrument Sans', size: 12, weight: 600 },
            color: '#1F1B16',
            usePointStyle: true,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: '#FFFDF9',
          titleColor: '#1F1B16',
          bodyColor: '#5C5449',
          borderColor: '#E8E2D8',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: (context: TooltipItem<'line'>[]) => {
              const index = context[0].dataIndex;
              if (index < timeSeriesAnalysis.rawDates.length) {
                return timeSeriesAnalysis.rawDates[index];
              }
              const lastDate = new Date(
                timeSeriesAnalysis.rawDates[timeSeriesAnalysis.rawDates.length - 1],
              );
              const daysAhead = index - timeSeriesAnalysis.rawDates.length + 1;
              lastDate.setDate(lastDate.getDate() + daysAhead);
              return lastDate.toISOString().split('T')[0] + ' (Forecast)';
            },
            label: (context: TooltipItem<'line'>) => {
              const value = context.parsed.y;
              if (value === null) return '';
              const prefix = context.datasetIndex === 0 ? 'Actual: ' : 'Forecast: ';
              return `${prefix}${formatCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8C8274', font: { family: 'Instrument Sans', size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#E8E2D8' },
          ticks: {
            color: '#8C8274',
            font: { family: 'Instrument Sans', size: 11 },
            callback: (value: string | number) => '₹' + Number(value).toLocaleString('en-IN'),
          },
        },
      },
    };
  }, [timeSeriesAnalysis]);

  // 4. Day of Week Analysis (Heatmap from --accent-tint to --accent)
  const dayOfWeekData = useMemo(() => {
    return getExpensesByDayOfWeek(filteredTransactions);
  }, [filteredTransactions]);

  const dayOfWeekBarData = useMemo(() => {
    const days = Object.keys(dayOfWeekData.dayTotals);
    const totals = Object.values(dayOfWeekData.dayTotals);
    const maxTotal = Math.max(...totals);

    // Color gradient from --accent-tint (rgba(180,83,9,0.15)) to --accent (rgba(180,83,9,1))
    const backgroundColors = totals.map((total) => {
      const ratio = maxTotal > 0 ? total / maxTotal : 0;
      const alpha = Math.max(0.18, ratio).toFixed(2);
      return `rgba(180, 83, 9, ${alpha})`;
    });

    return {
      labels: days,
      datasets: [
        {
          label: 'Total Spending',
          data: totals,
          backgroundColor: backgroundColors,
          borderColor: '#B45309',
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    };
  }, [dayOfWeekData]);

  const dayOfWeekBarOptions: ChartOptions<'bar'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#FFFDF9',
          titleColor: '#1F1B16',
          bodyColor: '#5C5449',
          borderColor: '#E8E2D8',
          borderWidth: 1,
          padding: 10,
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
                ` Total: ${formatCurrency(Number(total))}`,
                ` Average: ${formatCurrency(avg)} / txn`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8C8274', font: { family: 'Instrument Sans', size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#E8E2D8' },
          ticks: {
            color: '#8C8274',
            font: { family: 'Instrument Sans', size: 11 },
            callback: (value: string | number) => '₹' + Number(value).toLocaleString('en-IN'),
          },
        },
      },
    };
  }, [dayOfWeekData]);

  const tsStats = timeSeriesAnalysis.stats;

  // Insight sentences derived from data
  const dailyInsight = useMemo(() => {
    if (dailyData.amounts.length === 0) return 'No expenses recorded in this period.';
    const maxAmount = Math.max(...dailyData.amounts);
    const maxIndex = dailyData.amounts.indexOf(maxAmount);
    const maxLabel = dailyData.labels[maxIndex] || 'N/A';
    return `Peak expense was ${formatCurrency(maxAmount)} on ${maxLabel}. Average daily expense is ${formatCurrency(tsStats.averageDailySpending)}.`;
  }, [dailyData, tsStats]);

  const categoryInsight = useMemo(() => {
    if (categoryData.amounts.length === 0) return 'No categorized expenses found.';
    const maxAmount = Math.max(...categoryData.amounts);
    const maxIndex = categoryData.amounts.indexOf(maxAmount);
    const topCat = categoryData.labels[maxIndex];
    const pct = totalCategoryExpenses > 0 ? ((maxAmount / totalCategoryExpenses) * 100).toFixed(1) : '0';
    return `${topCat} is your highest expense, accounting for ${pct}% (${formatCurrency(maxAmount)}) of total spending.`;
  }, [categoryData, totalCategoryExpenses]);

  return (
    <div id="analytics" className="tab-content active space-y-6">
      {/* Sticky Top Control Toolbar */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md py-3 border-b border-line -mx-4 px-4 md:-mx-8 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5" id="analyticsPresets">
          <button
            type="button"
            className={`px-3.5 py-1.5 text-caption font-semibold rounded-btn border transition-all ${
              preset === 'this-week'
                ? 'bg-accent text-white border-accent shadow-warm-1'
                : 'bg-surface text-ink-2 border-line hover:bg-surface-2'
            }`}
            onClick={() => handlePreset('this-week')}
            data-preset="this-week"
          >
            This Week
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-caption font-semibold rounded-btn border transition-all ${
              preset === 'this-month'
                ? 'bg-accent text-white border-accent shadow-warm-1'
                : 'bg-surface text-ink-2 border-line hover:bg-surface-2'
            }`}
            onClick={() => handlePreset('this-month')}
            data-preset="this-month"
          >
            This Month
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-caption font-semibold rounded-btn border transition-all ${
              preset === 'last-30-days'
                ? 'bg-accent text-white border-accent shadow-warm-1'
                : 'bg-surface text-ink-2 border-line hover:bg-surface-2'
            }`}
            onClick={() => handlePreset('last-30-days')}
            data-preset="last-30-days"
          >
            Last 30 Days
          </button>
        </div>

        {/* Granularity Dropdowns */}
        <div className="flex items-center gap-2">
          <div className="w-32">
            <CustomSelect
              id="analyticsPeriod"
              value={period}
              options={PERIOD_OPTIONS}
              onChange={handlePeriodChange}
            />
          </div>
          <div
            id="analyticsMonthWrap"
            className={`w-36 ${period !== 'monthly' ? 'hidden' : 'block'}`}
          >
            <CustomSelect
              id="analyticsMonth"
              value={selectedMonth}
              options={MONTH_OPTIONS}
              onChange={handleMonthChange}
            />
          </div>
          <div
            id="analyticsYearWrap"
            className={`w-28 ${period === 'overall' ? 'hidden' : 'block'}`}
          >
            <CustomSelect
              id="analyticsYear"
              value={selectedYear}
              options={yearOptions}
              onChange={handleYearChange}
            />
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div id="analyticsSummaryGrid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="p-4 bg-surface rounded-card border border-line shadow-warm-1">
          <span className="text-caption font-semibold text-ink-3 uppercase tracking-wider block mb-1">
            Income
          </span>
          <span
            id="analyticsIncome"
            className="font-display text-section-title font-semibold text-income tabular-nums"
          >
            {formatCurrency(summary.income)}
          </span>
        </div>

        {/* Expenses Card */}
        <div className="p-4 bg-surface rounded-card border border-line shadow-warm-1">
          <span className="text-caption font-semibold text-ink-3 uppercase tracking-wider block mb-1">
            Expenses
          </span>
          <span
            id="analyticsExpenses"
            className="font-display text-section-title font-semibold text-ink tabular-nums"
          >
            {formatCurrency(summary.expenses)}
          </span>
        </div>

        {/* Net Flow Card */}
        <div className="p-4 bg-surface rounded-card border border-line shadow-warm-1">
          <span className="text-caption font-semibold text-ink-3 uppercase tracking-wider block mb-1">
            Net
          </span>
          <span
            id="analyticsNet"
            className={`font-display text-section-title font-semibold tabular-nums ${
              summary.net >= 0 ? 'text-income' : 'text-danger'
            }`}
          >
            {summary.net >= 0 ? '+' : ''}
            {formatCurrency(summary.net)}
          </span>
        </div>

        {/* Transactions Count Card */}
        <div className="p-4 bg-surface rounded-card border border-line shadow-warm-1">
          <span className="text-caption font-semibold text-ink-3 uppercase tracking-wider block mb-1">
            Transactions
          </span>
          <span
            id="analyticsCount"
            className="font-display text-section-title font-semibold text-ink tabular-nums"
          >
            {summary.count}
          </span>
        </div>
      </div>

      {/* Row 1: Daily Expenses & Expense by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Expenses Chart Card (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-card border border-line p-5 md:p-6 shadow-warm-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-body font-semibold text-ink">Daily Expenses</h3>
              <span className="text-caption text-ink-3">Trend by day</span>
            </div>
            <p className="text-caption text-ink-3 mb-4">{dailyInsight}</p>
          </div>

          <div className="h-64 relative w-full">
            {dailyData.labels.length === 0 ? (
              <div className="h-full flex items-center justify-center text-body-sm text-ink-3">
                No expense data available for this range
              </div>
            ) : (
              <Bar data={dailyBarData} options={dailyBarOptions} />
            )}
          </div>
        </div>

        {/* Expense by Category Doughnut Card (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-card border border-line p-5 md:p-6 shadow-warm-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-body font-semibold text-ink">
                Expense by Category
              </h3>
              <span className="text-caption text-ink-3">Distribution</span>
            </div>
            <p className="text-caption text-ink-3 mb-4">{categoryInsight}</p>
          </div>

          {categoryData.labels.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-body-sm text-ink-3">
              No category data available
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-44 relative flex items-center justify-center">
                <Doughnut data={pieData} options={pieOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">
                    Total
                  </span>
                  <span className="font-display text-body font-semibold text-ink tabular-nums">
                    {formatCurrency(totalCategoryExpenses)}
                  </span>
                </div>
              </div>

              {/* Synchronized Legend with percent bars */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {categoryData.labels.map((cat, idx) => {
                  const amount = categoryData.amounts[idx];
                  const pct = totalCategoryExpenses > 0 ? (amount / totalCategoryExpenses) * 100 : 0;
                  const color = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
                  const isHovered = hoveredCategoryIndex === idx;

                  return (
                    <div
                      key={cat}
                      onMouseEnter={() => setHoveredCategoryIndex(idx)}
                      onMouseLeave={() => setHoveredCategoryIndex(null)}
                      className={`p-1.5 rounded-btn transition-colors cursor-pointer ${
                        isHovered ? 'bg-surface-2' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-caption font-medium text-ink mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate max-w-[130px]">{cat}</span>
                        </div>
                        <span className="tabular-nums font-semibold">
                          {formatCurrency(amount)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-surface-2 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Time Series Analysis & 7-Day Forecast */}
      <div className="bg-surface rounded-card border border-line p-5 md:p-6 shadow-warm-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-body font-semibold text-ink">
              Time Series Analysis - Expense Trends
            </h3>
            <p className="text-caption text-ink-3 mt-0.5">
              Historical spending patterns with 7-day Simple Moving Average (SMA) forecast
            </p>
          </div>

          {forecast.forecastDates.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-caption text-ink-3">Confidence:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-caption font-semibold capitalize inline-flex items-center gap-1 ${
                  forecast.confidence === 'high'
                    ? 'bg-income-tint text-income border border-income/30'
                    : forecast.confidence === 'medium'
                    ? 'bg-warning-tint text-warning border border-warning/30'
                    : 'bg-danger-tint text-danger border border-danger/30'
                }`}
              >
                {forecast.confidence === 'high' ? (
                  <CheckIcon size={12} />
                ) : (
                  <AlertTriangleIcon size={12} />
                )}
                <span>{forecast.confidence}</span>
              </span>
            </div>
          )}
        </div>

        {timeSeriesAnalysis.dates.length === 0 ? (
          <div className="text-center py-12 text-ink-3 text-body-sm">
            Add some expense transactions to see time series trends and SMA forecasts.
          </div>
        ) : (
          <div className="h-72 relative w-full">
            <Line data={timeSeriesLineData} options={timeSeriesLineOptions} />
          </div>
        )}

        {/* Time Series Stats & Forecast Cards */}
        <div id="timeSeriesStats" className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-line">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider block">
              Avg Daily Spend
            </span>
            <span className="font-display text-body font-semibold text-ink tabular-nums">
              {formatCurrency(tsStats.averageDailySpending)}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider block">
              Peak Day Spend
            </span>
            <span className="font-display text-body font-semibold text-ink tabular-nums">
              {formatCurrency(tsStats.maxSpending)}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider block">
              Spending Active
            </span>
            <span className="font-display text-body font-semibold text-ink tabular-nums">
              {tsStats.daysWithSpending} of {tsStats.totalDays} days
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider block">
              7-Day Projected Total
            </span>
            <span className="font-display text-body font-semibold text-accent tabular-nums">
              {formatCurrency(forecast.totalForecast)}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Money Runway & Weekday Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Money Runway Card (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-card border border-line p-5 md:p-6 shadow-warm-1 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-body font-semibold text-ink">Money Runway</h3>
              <span className="text-caption text-ink-3">Sustainability</span>
            </div>
            <p className="text-caption text-ink-3">
              Estimated duration your current balance will last at current spending velocity.
            </p>
          </div>

          <div className="p-5 rounded-card bg-surface-2/60 border border-line space-y-4">
            <div>
              <span className="text-caption text-ink-3 block mb-1">Days Remaining</span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-hero font-semibold text-ink tabular-nums">
                  {runway.daysRemaining === Infinity ? '∞' : runway.daysRemaining}
                </span>
                <span className="text-body font-medium text-ink-2">
                  {runway.daysRemaining === Infinity ? 'Sustainable' : 'days'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-line/60 grid grid-cols-2 gap-3 text-caption">
              <div>
                <span className="text-ink-3 block">Depletion Date</span>
                <span className="font-semibold text-ink">{runway.depletionDate}</span>
              </div>
              <div>
                <span className="text-ink-3 block">Daily Burn Rate</span>
                <span className="font-semibold text-ink">{runway.burnRatePercent}% / day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Day of Week Heatmap Card (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-card border border-line p-5 md:p-6 shadow-warm-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-body font-semibold text-ink">
                Spending Heatmap - Day of Week Analysis
              </h3>
              <span className="text-caption text-ink-3">Distribution</span>
            </div>
            <p className="text-caption text-ink-3">
              {dayOfWeekData.isEmpty
                ? 'No expense data available for day of week analysis.'
                : `You spend the most on ${dayOfWeekData.maxDay}s (${formatCurrency(
                    dayOfWeekData.maxAmount,
                  )}) and least on ${dayOfWeekData.minDay}s (${formatCurrency(
                    dayOfWeekData.minAmount,
                  )}).`}
            </p>
          </div>

          <div className="h-56 relative w-full">
            {dayOfWeekData.isEmpty ? (
              <div className="h-full flex items-center justify-center text-body-sm text-ink-3">
                No expenses to analyze across weekdays
              </div>
            ) : (
              <Bar data={dayOfWeekBarData} options={dayOfWeekBarOptions} />
            )}
          </div>

          <div id="dayOfWeekStats" className="pt-3 border-t border-line flex items-center justify-between text-caption text-ink-3">
            <span>
              Highest Day: <strong className="text-ink">{dayOfWeekData.maxDay}</strong>
            </span>
            <span>
              Lowest Day: <strong className="text-ink">{dayOfWeekData.minDay}</strong>
            </span>
            <span>
              Weekly Total: <strong className="text-ink">{formatCurrency(dayOfWeekData.totalExpenses)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
