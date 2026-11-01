import type { AutopayPlan, Transaction } from '../types';

export function calculateMonthlyFlow(autopays: AutopayPlan[]): number {
  return autopays
    .filter((a) => a.active !== false)
    .reduce((sum, a) => {
      return a.type === 'income' ? sum + a.amount : sum - a.amount;
    }, 0);
}

export interface UpcomingAutopayItem {
  autopay: AutopayPlan;
  dueDateStr: string;
  daysRemaining: number;
  formattedDue: string;
}

export function getUpcomingAutopays(
  autopays: AutopayPlan[],
  refDate: Date = new Date(),
): UpcomingAutopayItem[] {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();
  const currentDay = refDate.getDate();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const upcoming: UpcomingAutopayItem[] = [];

  autopays
    .filter((a) => a.active !== false)
    .forEach((autopay) => {
      const targetDay = Math.min(autopay.day, daysInMonth);
      if (targetDay >= currentDay) {
        const daysRemaining = targetDay - currentDay;
        const dueDate = new Date(currentYear, currentMonth, targetDay);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        const formattedDue = dueDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });

        upcoming.push({
          autopay,
          dueDateStr,
          daysRemaining,
          formattedDue,
        });
      }
    });

  upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return upcoming;
}

export function processScheduledAutopays(
  autopays: AutopayPlan[],
  refDate: Date = new Date(),
): {
  newTransactions: Transaction[];
  updatedAutopays: AutopayPlan[];
} {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();
  const currentDay = refDate.getDate();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const newTransactions: Transaction[] = [];
  const updatedAutopays = autopays.map((autopay) => {
    if (autopay.active === false) return autopay;
    if (autopay.lastProcessedMonth === currentMonthKey) return autopay;

    const dueDay = Math.min(autopay.day, daysInMonth);
    if (currentDay >= dueDay) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
      const tag = autopay.type === 'expense' ? '[Autopay]' : '[Recurring Income]';
      const desc = autopay.description
        ? `${autopay.description} ${tag}`
        : `${autopay.name} ${tag}`;

      const newTx: Transaction = {
        id: `tx_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: autopay.amount,
        type: autopay.type,
        category: autopay.category,
        paymentMethod: 'bank_transfer',
        description: desc,
        date: dateStr,
        createdAt: new Date().toISOString(),
        source: 'autopay',
        autopayId: autopay.id,
      };

      newTransactions.push(newTx);
      return {
        ...autopay,
        lastProcessedMonth: currentMonthKey,
      };
    }

    return autopay;
  });

  return {
    newTransactions,
    updatedAutopays,
  };
}
