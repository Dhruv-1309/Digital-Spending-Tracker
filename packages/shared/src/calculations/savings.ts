/**
 * Savings Goal Calculations & Planning (DIFF-8)
 */
export interface SavingsGoalPlan {
  id: string;
  name: string;
  targetAmountPaise: number;
  currentSavedPaise: number;
  remainingPaise: number;
  targetDate: string;
  monthsRemaining: number;
  requiredMonthlyDepositPaise: number;
  progressPercent: number;
  isCompleted: boolean;
  status: 'completed' | 'on-track' | 'due-soon';
}

export function calculateMonthsRemaining(targetDateStr: string, refDate: Date = new Date()): number {
  const parts = targetDateStr.split('-').map(Number);
  const targetYear = parts[0];
  const targetMonth = parts[1] - 1; // 0-indexed

  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();

  const diffYears = targetYear - currentYear;
  const diffMonths = diffYears * 12 + (targetMonth - currentMonth);

  return Math.max(1, diffMonths);
}

export function calculateSavingsGoalPlan(
  goal: {
    id: string;
    name: string;
    targetAmountPaise: number;
    currentSavedPaise: number;
    targetDate: string;
  },
  refDate: Date = new Date(),
): SavingsGoalPlan {
  const remainingPaise = Math.max(0, goal.targetAmountPaise - goal.currentSavedPaise);
  const isCompleted = remainingPaise === 0;
  const progressPercent =
    goal.targetAmountPaise > 0
      ? parseFloat(Math.min(100, Math.max(0, (goal.currentSavedPaise / goal.targetAmountPaise) * 100)).toFixed(1))
      : 100;

  const monthsRemaining = isCompleted ? 0 : calculateMonthsRemaining(goal.targetDate, refDate);
  const requiredMonthlyDepositPaise =
    isCompleted || monthsRemaining === 0 ? 0 : Math.ceil(remainingPaise / monthsRemaining);

  let status: 'completed' | 'on-track' | 'due-soon' = 'on-track';
  if (isCompleted) {
    status = 'completed';
  } else if (monthsRemaining <= 2) {
    status = 'due-soon';
  }

  return {
    id: goal.id,
    name: goal.name,
    targetAmountPaise: goal.targetAmountPaise,
    currentSavedPaise: goal.currentSavedPaise,
    remainingPaise,
    targetDate: goal.targetDate,
    monthsRemaining,
    requiredMonthlyDepositPaise,
    progressPercent,
    isCompleted,
    status,
  };
}
