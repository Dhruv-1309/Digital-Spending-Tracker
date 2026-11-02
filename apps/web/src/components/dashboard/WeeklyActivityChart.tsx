import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import '../../lib/chartConfig';
import type { Transaction } from '../../types';

export interface WeeklyActivityChartProps {
  transactions: Transaction[];
}

export function WeeklyActivityChart({ transactions }: WeeklyActivityChartProps) {
  const chartData = useMemo<ChartData<'line'>>(() => {
    const last7Days: Date[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d);
    }

    const labels = last7Days.map((d) =>
      d.toLocaleDateString('en-IN', { weekday: 'short' }),
    );

    const expenses = last7Days.map((date) => {
      return transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            new Date(t.date).toDateString() === date.toDateString(),
        )
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const incomes = last7Days.map((date) => {
      return transactions
        .filter(
          (t) =>
            t.type === 'income' &&
            new Date(t.date).toDateString() === date.toDateString(),
        )
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          borderColor: '#2E7D5B', // --income token
          backgroundColor: 'rgba(46, 125, 91, 0.12)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#2E7D5B',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Expense',
          data: expenses,
          borderColor: '#1F1B16', // --ink token (not red)
          backgroundColor: 'rgba(31, 27, 22, 0.06)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#1F1B16',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [transactions]);

  const chartOptions = useMemo<ChartOptions<'line'>>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 16,
            font: {
              family: "'Instrument Sans', sans-serif",
              size: 13,
              weight: 500,
            },
            color: '#5C554B', // --ink-2
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#FFFFFF',
          titleColor: '#1F1B16',
          bodyColor: '#5C554B',
          borderColor: '#E6DFD3',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          cornerRadius: 10,
          titleFont: {
            family: "'Instrument Sans', sans-serif",
            size: 13,
            weight: 600,
          },
          bodyFont: {
            family: "'Instrument Sans', sans-serif",
            size: 13,
          },
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y ?? 0;
              return ` ${label}: ₹${value.toLocaleString('en-IN')}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#F3EEE6', // --surface-2
          },
          ticks: {
            color: '#766E62', // --ink-3
            font: {
              family: "'Instrument Sans', sans-serif",
              size: 11,
            },
            callback: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
          },
          border: {
            dash: [4, 4],
            display: false,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#766E62',
            font: {
              family: "'Instrument Sans', sans-serif",
              size: 12,
              weight: 500,
            },
          },
          border: {
            color: '#E6DFD3',
          },
        },
      },
    };
  }, []);

  return <Line data={chartData} options={chartOptions} />;
}
