import type { AutopayPlan } from '../../types';
import { getDaySuffix } from '../../lib/formatters';

export interface NextDeductionInfo {
  date: Date;
  dueDateStr: string;
  formattedDue: string;
  dayLabel: string;
  daysRemaining: number;
}

/**
 * Calculates the next deduction date for an autopay plan based on the calendar rules.
 * Clamps days to month bounds and moves to next month if this month's deduction has passed.
 */
export function getNextDeductionDate(
  plan: AutopayPlan,
  refDate: Date = new Date(),
): NextDeductionInfo {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();
  const currentDay = refDate.getDate();

  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const targetDayThisMonth = Math.min(plan.day, daysInCurrentMonth);

  let targetYear = currentYear;
  let targetMonth = currentMonth;
  let targetDay = targetDayThisMonth;

  if (targetDayThisMonth >= currentDay) {
    targetYear = currentYear;
    targetMonth = currentMonth;
    targetDay = targetDayThisMonth;
  } else {
    // Occurrence for this month has passed, target next month
    targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    targetMonth = (currentMonth + 1) % 12;
    const daysInNextMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    targetDay = Math.min(plan.day, daysInNextMonth);
  }

  const date = new Date(targetYear, targetMonth, targetDay);
  const dueDateStr = date.toISOString().split('T')[0];
  const formattedDue = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const dueMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.max(0, Math.round((dueMidnight.getTime() - refMidnight.getTime()) / oneDayMs));

  const dayLabel = plan.day === 31 ? 'Last day' : `the ${plan.day}${getDaySuffix(plan.day)}`;

  return {
    date,
    dueDateStr,
    formattedDue,
    dayLabel,
    daysRemaining,
  };
}

/**
 * Returns formatted countdown chip text (SPEC Section 6 & prompt requirement 3).
 * e.g., 'Due today', 'in 1 day', 'in 3 days'
 */
export function getCountdownChipText(daysRemaining: number): string {
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return 'in 1 day';
  return `in ${daysRemaining} days`;
}
