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

export function AnalyticsTab() {
  const { transactions } = useTracker();

  const now = useMemo(() => new Date(), []);
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const [preset, setPreset] = useState<AnalyticsPreset>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('overall');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

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
          label: 'Daily Expenses (₹)',
          data: dailyData.amounts,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [dailyData]);

  const dailyBarOptions: ChartOptions<'bar'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              return `₹${Number(context.parsed.y).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: string | number) => {
              return '₹' + Number(value).toLocaleString();
            },
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
    return {
      labels: categoryData.labels,
      datasets: [
        {
          data: categoryData.amounts,
          backgroundColor: categoryData.colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [categoryData]);

  const pieOptions: ChartOptions<'doughnut'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) => {
              const value = context.parsed;
              const dataArr = context.dataset.data as number[];
              const total = dataArr.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
    };
  }, []);

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
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
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
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        borderWidth: 2,
        // @ts-expect-error borderDash is valid on Line dataset
        borderDash: [8, 4],
        fill: false,
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointStyle: 'rectRot',
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
            font: { weight: 'bold' },
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
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
              return lastDate.toISOString().split('T')[0] + ' (Predicted)';
            },
            label: (context: TooltipItem<'line'>) => {
              const value = context.parsed.y;
              if (value === null) return '';
              if (value === 0) return 'No spending';
              const prefix = context.datasetIndex === 0 ? 'Spent: ' : 'Predicted: ';
              return `${prefix}₹${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
            font: { weight: 'bold' },
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount (₹)',
            font: { weight: 'bold' },
          },
          ticks: {
            callback: (value: string | number) => {
              return '₹' + Number(value).toLocaleString();
            },
          },
        },
      },
    };
  }, [timeSeriesAnalysis]);

  // 4. Day of Week Analysis
  const dayOfWeekData = useMemo(() => {
    return getExpensesByDayOfWeek(filteredTransactions);
  }, [filteredTransactions]);

  const dayOfWeekBarData = useMemo(() => {
    const days = Object.keys(dayOfWeekData.dayTotals);
    const totals = Object.values(dayOfWeekData.dayTotals);
    const maxTotal = Math.max(...totals);

    const colors = totals.map((total) => {
      const intensity = maxTotal > 0 ? total / maxTotal : 0;
      const red = 239;
      const green = Math.floor(68 + 180 * (1 - intensity));
      const blue = Math.floor(68 + 180 * (1 - intensity));
      return `rgb(${red}, ${green}, ${blue})`;
    });

    return {
      labels: days,
      datasets: [
        {
          label: 'Total Spending (₹)',
          data: totals,
          backgroundColor: colors,
          borderColor: colors.map((color) =>
            color.replace('rgb', 'rgba').replace(')', ', 0.8)'),
          ),
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [dayOfWeekData]);

  const dayOfWeekBarOptions: ChartOptions<'bar'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { weight: 'bold' },
          },
        },
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
                `Total: ₹${Number(total).toLocaleString()}`,
                `Average: ₹${avg.toLocaleString()} per transaction`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Day of Week',
            font: { weight: 'bold' },
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Spending (₹)',
            font: { weight: 'bold' },
          },
          ticks: {
            callback: (value: string | number) => {
              return '₹' + Number(value).toLocaleString();
            },
          },
        },
      },
    };
  }, [dayOfWeekData]);

  const tsStats = timeSeriesAnalysis.stats;

  const runwayColor =
    runway.daysRemaining <= 7
      ? '#ef4444'
      : runway.daysRemaining <= 30
        ? '#f59e0b'
        : runway.daysRemaining === Infinity
          ? '#10b981'
          : '#3b82f6';

  const confidenceColor =
    forecast.confidence === 'high'
      ? '#10b981'
      : forecast.confidence === 'medium'
        ? '#f59e0b'
        : '#ef4444';

  const confidenceIcon =
    forecast.confidence === 'high'
      ? '✓'
      : forecast.confidence === 'medium'
        ? '⚠'
        : '!';

  return (
    <div id="analytics" className="tab-content active">
      <div className="analytics-toolbar">
        <div className="section-header analytics-header">
          <h3>
            <i className="fas fa-chart-pie"></i> Analytics
          </h3>
        </div>
        <div className="analytics-presets" id="analyticsPresets">
          <button
            type="button"
            className={`analytics-preset-btn ${preset === 'this-week' ? 'active' : ''}`}
            onClick={() => handlePreset('this-week')}
            data-preset="this-week"
          >
            This Week
          </button>
          <button
            type="button"
            className={`analytics-preset-btn ${preset === 'this-month' ? 'active' : ''}`}
            onClick={() => handlePreset('this-month')}
            data-preset="this-month"
          >
            This Month
          </button>
          <button
            type="button"
            className={`analytics-preset-btn ${preset === 'last-30-days' ? 'active' : ''}`}
            onClick={() => handlePreset('last-30-days')}
            data-preset="last-30-days"
          >
            Last 30 Days
          </button>
        </div>
        <div className="analytics-filters">
          <div className="custom-select analytics-select">
            <CustomSelect
              id="analyticsPeriod"
              value={period}
              options={PERIOD_OPTIONS}
              onChange={handlePeriodChange}
            />
          </div>
          <div
            className={`custom-select analytics-select analytics-filter ${period !== 'monthly' ? 'is-hidden' : ''}`}
            id="analyticsMonthWrap"
          >
            <CustomSelect
              id="analyticsMonth"
              value={selectedMonth}
              options={MONTH_OPTIONS}
              onChange={handleMonthChange}
            />
          </div>
          <div
            className={`custom-select analytics-select analytics-filter ${period === 'overall' ? 'is-hidden' : ''}`}
            id="analyticsYearWrap"
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

      <div className="analytics-summary-grid" id="analyticsSummaryGrid">
        <div className="analytics-summary-card income">
          <div className="label">Income</div>
          <div className="value" id="analyticsIncome">
            ₹{summary.income.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="analytics-summary-card expense">
          <div className="label">Expenses</div>
          <div className="value" id="analyticsExpenses">
            ₹{summary.expenses.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="analytics-summary-card balance">
          <div className="label">Net</div>
          <div
            className="value"
            id="analyticsNet"
            style={{ color: summary.net >= 0 ? '#16a34a' : '#dc2626' }}
          >
            ₹{summary.net.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="analytics-summary-card count">
          <div className="label">Transactions</div>
          <div className="value" id="analyticsCount">
            {summary.count}
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="chart-container">
          <h3>
            <i className="fas fa-chart-bar"></i> Daily Expenses
          </h3>
          {dailyData.labels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No expense data available
            </div>
          ) : (
            <div style={{ height: 250, position: 'relative' }}>
              <Bar data={dailyBarData} options={dailyBarOptions} />
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>
            <i className="fas fa-chart-pie"></i> Expense by Category
          </h3>
          {categoryData.labels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No expense data available
            </div>
          ) : (
            <div style={{ height: 250, position: 'relative' }}>
              <Doughnut data={pieData} options={pieOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Time Series Analysis Section */}
      <div className="chart-container analytics-section-gap">
        <h3>
          <i className="fas fa-chart-area"></i> Time Series Analysis - Expense Trends
        </h3>
        {timeSeriesAnalysis.dates.length === 0 ? (
          <>
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No expense data available for time series analysis
            </div>
            <div id="timeSeriesStats" className="analytics-stats-box">
              <p style={{ textAlign: 'center', color: '#64748b' }}>
                Add some expense transactions to see time series analysis and forecasts
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{ height: 300, position: 'relative' }}>
              <Line data={timeSeriesLineData} options={timeSeriesLineOptions} />
            </div>
            <div id="timeSeriesStats" className="analytics-stats-box">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>Total Period:</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>{tsStats.totalDays} days</span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Days with Spending:</strong>
                  <br />
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    {tsStats.daysWithSpending} days
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Days without Spending:</strong>
                  <br />
                  <span style={{ color: '#10b981', fontWeight: 600 }}>
                    {tsStats.daysWithoutSpending} days
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Average Daily Spending:</strong>
                  <br />
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                    ₹{tsStats.averageDailySpending.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Maximum Daily Spending:</strong>
                  <br />
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    ₹{tsStats.maxSpending.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Minimum Daily Spending:</strong>
                  <br />
                  <span style={{ color: '#10b981', fontWeight: 600 }}>
                    ₹{tsStats.minSpending.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Total Spending:</strong>
                  <br />
                  <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.1rem' }}>
                    ₹{tsStats.totalSpending.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Spending Frequency:</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>
                    {tsStats.totalDays > 0
                      ? ((tsStats.daysWithSpending / tsStats.totalDays) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                </div>

                {forecast.forecastDates.length > 0 && (
                  <>
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        marginTop: 12,
                        paddingTop: 16,
                        borderTop: '2px solid #e2e8f0',
                      }}
                    >
                      <strong style={{ color: '#8b5cf6', fontSize: '1.05rem' }}>
                        <i className="fas fa-crystal-ball"></i> 7-Day Forecast (SMA Prediction)
                      </strong>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Predicted Daily Average:</strong>
                      <br />
                      <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.1rem' }}>
                        ₹{forecast.smaValue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Total Forecast (7 days):</strong>
                      <br />
                      <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.1rem' }}>
                        ₹{forecast.totalForecast.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Forecast Confidence:</strong>
                      <br />
                      <span
                        style={{
                          color: confidenceColor,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {confidenceIcon} {forecast.confidence}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Data Variance:</strong>
                      <br />
                      <span style={{ color: '#64748b' }}>
                        {forecast.coefficientOfVariation.toFixed(1)}% CV
                      </span>
                    </div>
                  </>
                )}

                <div
                  style={{
                    gridColumn: '1 / -1',
                    marginTop: 12,
                    paddingTop: 16,
                    borderTop: '2px solid #e2e8f0',
                  }}
                >
                  <strong style={{ color: runwayColor, fontSize: '1.05rem' }}>
                    <i className="fas fa-hourglass-half"></i> Money Runway Prediction
                  </strong>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Current Balance:</strong>
                  <br />
                  <span
                    style={{
                      color: runway.balance >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                    }}
                  >
                    ₹{runway.balance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Days Until Depleted:</strong>
                  <br />
                  <span style={{ color: runwayColor, fontWeight: 700, fontSize: '1.1rem' }}>
                    {runway.daysRemaining === Infinity
                      ? '∞ (Sustainable)'
                      : `${runway.daysRemaining} days`}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Estimated Depletion:</strong>
                  <br />
                  <span style={{ color: runwayColor, fontWeight: 600 }}>
                    {runway.depletionDate}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Daily Burn Rate:</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>{runway.burnRatePercent}%/day</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Day of Week Heatmap Section */}
      <div className="chart-container analytics-section-gap">
        <h3>
          <i className="fas fa-fire"></i> Spending Heatmap - Day of Week Analysis
        </h3>
        {dayOfWeekData.isEmpty ? (
          <>
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No expense data available for day of week analysis
            </div>
            <div id="dayOfWeekStats" className="analytics-stats-box">
              <p style={{ textAlign: 'center', color: '#64748b' }}>
                Add some expense transactions to see day of week analysis
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{ height: 300, position: 'relative' }}>
              <Bar data={dayOfWeekBarData} options={dayOfWeekBarOptions} />
            </div>
            <div id="dayOfWeekStats" className="analytics-stats-box">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>Highest Spending Day:</strong>
                  <br />
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>
                    {dayOfWeekData.maxDay}
                  </span>
                  <br />
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    ₹{dayOfWeekData.maxAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Lowest Spending Day:</strong>
                  <br />
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>
                    {dayOfWeekData.minDay}
                  </span>
                  <br />
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    ₹{dayOfWeekData.minAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Total Weekly Spending:</strong>
                  <br />
                  <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.1rem' }}>
                    ₹{dayOfWeekData.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Average per Day:</strong>
                  <br />
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                    ₹{(dayOfWeekData.totalExpenses / 7).toFixed(0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: 'white',
                  borderRadius: 8,
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <strong style={{ color: '#0f172a' }}>💡 Spending Pattern Insight:</strong>
                <br />
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  You tend to spend most on{' '}
                  <strong style={{ color: '#ef4444' }}>{dayOfWeekData.maxDay}s</strong> (₹
                  {dayOfWeekData.maxAmount.toLocaleString()}) and least on{' '}
                  <strong style={{ color: '#10b981' }}>{dayOfWeekData.minDay}s</strong> (₹
                  {dayOfWeekData.minAmount.toLocaleString()}).{' '}
                  {dayOfWeekData.maxAmount > (dayOfWeekData.totalExpenses / 7) * 1.5
                    ? `Consider budgeting more carefully on ${dayOfWeekData.maxDay}s.`
                    : 'Your spending is relatively balanced across the week.'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
