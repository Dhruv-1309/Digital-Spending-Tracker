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
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#10b981',
          pointRadius: 4,
        },
        {
          label: 'Expense',
          data: expenses,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#ef4444',
          pointRadius: 4,
        },
      ],
    };
  }, [transactions]);

  const chartOptions = useMemo<ChartOptions<'line'>>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#1e293b',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: '#f1f5f9',
          },
          ticks: {
            display: false,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };
  }, []);

  return <Line data={chartData} options={chartOptions} />;
}
