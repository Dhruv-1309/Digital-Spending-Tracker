import { useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import '../../lib/chartConfig';
import type { Transaction } from '../../types';
import { formatIndianGrouping } from '../ui/formatIndianGrouping';
import { useReducedMotion } from '../../ui/motion';

export interface WeeklyActivityChartProps {
  transactions: Transaction[];
}

/**
 * Helper to read design tokens from CSS variables via getComputedStyle
 */
function getThemeTokens() {
  if (typeof window === 'undefined') {
    return {
      income: '#2E7D5B',
      incomeTint: '#E4F2EA',
      ink: '#1F1B16',
      ink2: '#5C554B',
      line: '#E6DFD3',
      surface: '#FFFFFF',
      fontBody: "'Instrument Sans', sans-serif",
    };
  }
  const computed = getComputedStyle(document.documentElement);
  return {
    income: computed.getPropertyValue('--income').trim() || '#2E7D5B',
    incomeTint: computed.getPropertyValue('--income-tint').trim() || '#E4F2EA',
    ink: computed.getPropertyValue('--ink').trim() || '#1F1B16',
    ink2: computed.getPropertyValue('--ink-2').trim() || '#5C554B',
    line: computed.getPropertyValue('--line').trim() || '#E6DFD3',
    surface: computed.getPropertyValue('--surface').trim() || '#FFFFFF',
    fontBody: computed.getPropertyValue('--font-body').trim() || "'Instrument Sans', sans-serif",
  };
}

/**
 * WeeklyActivityChart Component (SPEC Section 4 rule 6, Section 5 & 6)
 * - Renders 7-day daily Income vs Expense lines
 * - Restyles Chart.js from design tokens (CSS variables via getComputedStyle)
 * - Light grid lines in --line, no chart border
 * - Custom HTML tooltip with grouped rupee values
 * - Animates 600ms easeOutQuart on first render only; updates use animation false
 * - Visually hidden data table for screen readers
 */
export function WeeklyActivityChart({ transactions }: WeeklyActivityChartProps) {
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);
  const prefersReduced = useReducedMotion();

  // Read design tokens from CSS variables
  const themeTokens = useMemo(() => getThemeTokens(), []);

  // Mark first render complete asynchronously after mount
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsFirstRender(false);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Cleanup tooltips on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        const tooltips = document.querySelectorAll('.chartjs-custom-tooltip');
        tooltips.forEach((t) => t.remove());
      }
    };
  }, []);

  // Compute 7 days series
  const daysData = useMemo(() => {
    const list: Array<{
      date: Date;
      label: string;
      fullDate: string;
      income: number;
      expense: number;
    }> = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();

      const dayExpenses = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            new Date(t.date).toDateString() === dateStr,
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const dayIncomes = transactions
        .filter(
          (t) =>
            t.type === 'income' &&
            new Date(t.date).toDateString() === dateStr,
        )
        .reduce((sum, t) => sum + t.amount, 0);

      list.push({
        date: d,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        income: dayIncomes,
        expense: dayExpenses,
      });
    }

    return list;
  }, [transactions]);

  const chartData = useMemo<ChartData<'line'>>(() => {
    return {
      labels: daysData.map((d) => d.label),
      datasets: [
        {
          label: 'Income',
          data: daysData.map((d) => d.income),
          borderColor: themeTokens.income,
          backgroundColor: 'rgba(46, 125, 91, 0.12)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: themeTokens.surface,
          pointBorderColor: themeTokens.income,
          pointHoverBackgroundColor: themeTokens.income,
          pointHoverBorderColor: themeTokens.surface,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Expense',
          data: daysData.map((d) => d.expense),
          borderColor: themeTokens.ink,
          backgroundColor: 'rgba(31, 27, 22, 0.06)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: themeTokens.surface,
          pointBorderColor: themeTokens.ink,
          pointHoverBackgroundColor: themeTokens.ink,
          pointHoverBorderColor: themeTokens.surface,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [daysData, themeTokens]);

  const chartOptions = useMemo<ChartOptions<'line'>>(() => {
    const shouldAnimate = !prefersReduced && isFirstRender;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: shouldAnimate
        ? {
            duration: 600,
            easing: 'easeOutQuart',
          }
        : false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            color: themeTokens.ink2,
            font: {
              family: themeTokens.fontBody,
              size: 12,
              weight: 500,
            },
          },
        },
        tooltip: {
          enabled: false,
          external: (context) => {
            const { chart, tooltip } = context;
            const parent = chart.canvas.parentNode as HTMLElement | null;
            if (!parent) return;

            let tooltipEl = parent.querySelector(
              '.chartjs-custom-tooltip',
            ) as HTMLDivElement | null;

            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.className = 'chartjs-custom-tooltip';
              tooltipEl.style.position = 'absolute';
              tooltipEl.style.pointerEvents = 'none';
              tooltipEl.style.zIndex = '50';
              tooltipEl.style.backgroundColor = 'var(--surface)';
              tooltipEl.style.color = 'var(--ink)';
              tooltipEl.style.border = '1px solid var(--line)';
              tooltipEl.style.borderRadius = 'var(--radius-btn, 10px)';
              tooltipEl.style.boxShadow = 'var(--shadow-2)';
              tooltipEl.style.padding = '8px 12px';
              tooltipEl.style.fontFamily = 'var(--font-body)';
              tooltipEl.style.fontSize = '12px';
              tooltipEl.style.transition = 'opacity 120ms ease';
              parent.style.position = 'relative';
              parent.appendChild(tooltipEl);
            }

            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = '0';
              return;
            }

            if (tooltip.body) {
              const dataIndex = tooltip.dataPoints?.[0]?.dataIndex ?? 0;
              const dayItem = daysData[dataIndex];
              const titleText = dayItem ? `${dayItem.label}, ${dayItem.fullDate}` : tooltip.title?.[0] || '';

              let innerHtml = `<div style="font-weight: 600; color: var(--ink-2); margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--line);">${titleText}</div>`;
              innerHtml += `<div style="display: flex; flex-direction: column; gap: 4px;">`;

              tooltip.dataPoints.forEach((point) => {
                const isIncome = point.dataset.label === 'Income';
                const label = point.dataset.label;
                const rawVal = (point.raw as number) || 0;
                const formattedVal = `₹${formatIndianGrouping(rawVal)}`;
                const dotColor = isIncome ? 'var(--income)' : 'var(--ink)';
                const valueColor = isIncome ? 'var(--income)' : 'var(--ink)';

                innerHtml += `
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                    <span style="display: flex; align-items: center; gap: 6px; color: var(--ink-2);">
                      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background-color: ${dotColor};"></span>
                      ${label}
                    </span>
                    <span style="font-variant-numeric: tabular-nums; font-weight: 600; color: ${valueColor};">
                      ${isIncome && rawVal > 0 ? '+' : ''}${formattedVal}
                    </span>
                  </div>
                `;
              });
              innerHtml += `</div>`;

              tooltipEl.innerHTML = innerHtml;
            }

            const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
            tooltipEl.style.opacity = '1';
            tooltipEl.style.left = `${positionX + tooltip.caretX}px`;
            tooltipEl.style.top = `${positionY + tooltip.caretY}px`;
            tooltipEl.style.transform = 'translate(-50%, -115%)';
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: themeTokens.line,
          },
          border: {
            display: false,
          },
          ticks: {
            color: themeTokens.ink2,
            font: {
              family: themeTokens.fontBody,
              size: 11,
            },
            callback: (value) => `₹${formatIndianGrouping(value)}`,
          },
        },
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: themeTokens.ink2,
            font: {
              family: themeTokens.fontBody,
              size: 12,
            },
          },
        },
      },
    };
  }, [daysData, themeTokens, prefersReduced, isFirstRender]);

  return (
    <div className="relative w-full h-full">
      <Line data={chartData} options={chartOptions} />

      {/* Screen Reader Accessible Data Table (SPEC Section 7) */}
      <div className="sr-only">
        <h4>Weekly Activity Summary</h4>
        <table>
          <caption>Daily income and expense totals for the past 7 days</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Income</th>
              <th scope="col">Expense</th>
            </tr>
          </thead>
          <tbody>
            {daysData.map((day) => (
              <tr key={day.fullDate}>
                <td>{day.label} ({day.fullDate})</td>
                <td>₹{formatIndianGrouping(day.income)}</td>
                <td>₹{formatIndianGrouping(day.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WeeklyActivityChart;
