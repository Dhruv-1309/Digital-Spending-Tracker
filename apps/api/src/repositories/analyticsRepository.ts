import { prisma } from '../db/prisma.js';
import {
  calculateSMAForecast,
  calculateMoneyRunway,
  getAnalyticsDateRange,
  type AnalyticsPreset,
  type AnalyticsPeriod,
  type BudgetStatus,
  type DayOfWeekData,
} from '@moneytracker/shared';

export class AnalyticsRepository {
  async getDashboardSummary(userId: string, refDate: Date = new Date()): Promise<{
    monthIncomePaise: number;
    monthExpensesPaise: number;
    balancePaise: number;
    budget: {
      monthlyExpenseLimitPaise: number;
      thresholdPercent: number;
      percentUsed: number;
      status: BudgetStatus;
    } | null;
    weeklyActivity: Array<{
      date: string;
      incomePaise: number;
      expensePaise: number;
    }>;
    recentTransactions: any[];
  }> {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const startOfMonth = new Date(Date.UTC(year, month, 1));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    // 1. Current month transactions
    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        txnDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: {
        type: true,
        amountPaise: true,
      },
    });

    let monthIncomePaise = 0;
    let monthExpensesPaise = 0;
    monthTransactions.forEach((t) => {
      if (t.type === 'income') monthIncomePaise += Number(t.amountPaise);
      else monthExpensesPaise += Number(t.amountPaise);
    });

    // 2. Overall balance
    const allTransactions = await prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      select: { type: true, amountPaise: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    allTransactions.forEach((t) => {
      if (t.type === 'income') totalIncome += Number(t.amountPaise);
      else totalExpense += Number(t.amountPaise);
    });
    const balancePaise = totalIncome - totalExpense;

    // 3. Budget goal
    const budgetGoal = await prisma.budgetGoal.findUnique({ where: { userId } });
    let budgetInfo: any = null;

    if (budgetGoal && Number(budgetGoal.monthlyExpenseLimitPaise) > 0) {
      const limit = Number(budgetGoal.monthlyExpenseLimitPaise);
      const percentUsed = parseFloat(((monthExpensesPaise / limit) * 100).toFixed(1));
      let status: BudgetStatus = 'is-good';

      if (monthExpensesPaise > limit) {
        status = 'is-danger';
      } else if (percentUsed >= budgetGoal.thresholdPercent) {
        status = 'is-warning';
      }

      budgetInfo = {
        monthlyExpenseLimitPaise: limit,
        thresholdPercent: budgetGoal.thresholdPercent,
        percentUsed,
        status,
      };
    }

    // 4. Last 7 days activity
    const past7DaysStart = new Date(refDate);
    past7DaysStart.setDate(past7DaysStart.getDate() - 6);
    past7DaysStart.setHours(0, 0, 0, 0);

    const weekTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        txnDate: { gte: past7DaysStart, lte: refDate },
      },
      select: {
        type: true,
        amountPaise: true,
        txnDate: true,
      },
    });

    const weeklyMap: Record<string, { incomePaise: number; expensePaise: number }> = {};
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(past7DaysStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      weeklyMap[key] = { incomePaise: 0, expensePaise: 0 };
    }

    weekTransactions.forEach((t) => {
      const key = t.txnDate.toISOString().split('T')[0];
      if (weeklyMap[key]) {
        if (t.type === 'income') {
          weeklyMap[key].incomePaise += Number(t.amountPaise);
        } else {
          weeklyMap[key].expensePaise += Number(t.amountPaise);
        }
      }
    });

    const weeklyActivity = Object.entries(weeklyMap).map(([date, totals]) => ({
      date,
      incomePaise: totals.incomePaise,
      expensePaise: totals.expensePaise,
    }));

    // 5. Recent 5 transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      orderBy: { txnDate: 'desc' },
      take: 5,
    });

    return {
      monthIncomePaise,
      monthExpensesPaise,
      balancePaise,
      budget: budgetInfo,
      weeklyActivity,
      recentTransactions,
    };
  }

  async getAnalyticsOverview(
    userId: string,
    preset: AnalyticsPreset,
    period: AnalyticsPeriod,
    year?: string,
    month?: string,
    refDate: Date = new Date(),
  ): Promise<{
    summary: {
      incomePaise: number;
      expensesPaise: number;
      netPaise: number;
      count: number;
    };
    dailyExpenses: Array<{ date: string; amountPaise: number }>;
    categoryBreakdown: Array<{
      category: string;
      amountPaise: number;
      percentage: number;
    }>;
  }> {
    const range = getAnalyticsDateRange(
      preset,
      period,
      year || String(refDate.getFullYear()),
      month || String(refDate.getMonth() + 1),
      refDate,
    );

    const where: any = { userId, deletedAt: null };
    if (range) {
      where.txnDate = { gte: range.start, lte: range.end };
    }

    const txs = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        category: true,
        amountPaise: true,
        txnDate: true,
      },
    });

    let incomePaise = 0;
    let expensesPaise = 0;
    const dailyMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};

    txs.forEach((t) => {
      const amt = Number(t.amountPaise);
      if (t.type === 'income') {
        incomePaise += amt;
      } else {
        expensesPaise += amt;
        const dateKey = t.txnDate.toISOString().split('T')[0];
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + amt;
        categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
      }
    });

    const dailyExpenses = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amountPaise]) => ({ date, amountPaise }));

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, amountPaise]) => ({
        category,
        amountPaise,
        percentage:
          expensesPaise > 0
            ? parseFloat(((amountPaise / expensesPaise) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    return {
      summary: {
        incomePaise,
        expensesPaise,
        netPaise: incomePaise - expensesPaise,
        count: txs.length,
      },
      dailyExpenses,
      categoryBreakdown,
    };
  }

  async getWeekdayTotals(userId: string): Promise<DayOfWeekData[]> {
    const expenseTxs = await prisma.transaction.findMany({
      where: { userId, type: 'expense', deletedAt: null },
      select: { amountPaise: true, txnDate: true },
    });

    const days = [
      { dayName: 'Sunday', dayIndex: 0 },
      { dayName: 'Monday', dayIndex: 1 },
      { dayName: 'Tuesday', dayIndex: 2 },
      { dayName: 'Wednesday', dayIndex: 3 },
      { dayName: 'Thursday', dayIndex: 4 },
      { dayName: 'Friday', dayIndex: 5 },
      { dayName: 'Saturday', dayIndex: 6 },
    ];

    const result: DayOfWeekData[] = days.map((d) => ({
      dayName: d.dayName,
      dayIndex: d.dayIndex,
      totalExpensePaise: 0,
      count: 0,
      averageExpensePaise: 0,
    }));

    expenseTxs.forEach((t) => {
      const dayIdx = t.txnDate.getDay();
      const amt = Number(t.amountPaise);
      result[dayIdx].totalExpensePaise += amt;
      result[dayIdx].count += 1;
    });

    result.forEach((d) => {
      if (d.count > 0) {
        d.averageExpensePaise = Math.round(d.totalExpensePaise / d.count);
      }
    });

    return result;
  }

  async getSMAForecast(userId: string): Promise<any> {
    const expenseTxs = await prisma.transaction.findMany({
      where: { userId, type: 'expense', deletedAt: null },
      select: { amountPaise: true, txnDate: true },
      orderBy: { txnDate: 'asc' },
    });

    if (expenseTxs.length === 0) {
      return {
        forecastDates: [],
        forecastAmountsPaise: [],
        smaValuePaise: 0,
        totalForecastPaise: 0,
        confidence: 'low',
        coefficientOfVariation: 0,
      };
    }

    const daily: Record<string, number> = {};
    expenseTxs.forEach((t) => {
      const d = t.txnDate.toISOString().split('T')[0];
      daily[d] = (daily[d] || 0) + Number(t.amountPaise);
    });

    const sortedDates = Object.keys(daily).sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);

    const rawDates: string[] = [];
    const amounts: number[] = [];

    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dateStr = cur.toISOString().split('T')[0];
      rawDates.push(dateStr);
      amounts.push(daily[dateStr] || 0);
      cur.setDate(cur.getDate() + 1);
    }

    const forecast = calculateSMAForecast(rawDates, amounts, 7, 7);

    return {
      forecastDates: forecast.forecastDates,
      forecastAmountsPaise: forecast.forecastAmounts,
      smaValuePaise: Math.round(forecast.smaValue),
      totalForecastPaise: Math.round(forecast.totalForecast),
      confidence: forecast.confidence,
      coefficientOfVariation: forecast.coefficientOfVariation,
    };
  }

  async getMoneyRunway(userId: string, refDate: Date = new Date()): Promise<any> {
    const allTxs = await prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      select: { type: true, amountPaise: true, txnDate: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const dailyExpenses: Record<string, number> = {};

    allTxs.forEach((t) => {
      const amt = Number(t.amountPaise);
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        const d = t.txnDate.toISOString().split('T')[0];
        dailyExpenses[d] = (dailyExpenses[d] || 0) + amt;
      }
    });

    const balancePaise = totalIncome - totalExpense;
    const expenseDaysCount = Object.keys(dailyExpenses).length || 1;
    const avgDailySpendPaise = Math.round(totalExpense / expenseDaysCount);

    const runway = calculateMoneyRunway(
      allTxs.map((t) => ({ type: t.type, amount: Number(t.amountPaise) / 100 })),
      avgDailySpendPaise / 100,
      refDate,
    );

    return {
      balancePaise,
      daysRemaining: runway.daysRemaining,
      depletionDate: runway.depletionDate,
      burnRatePercent: runway.burnRatePercent,
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
