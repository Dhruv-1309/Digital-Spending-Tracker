import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface CategorySpendSummary {
  category: string;
  amountPaise: number;
  percent: number;
}

export interface UpcomingAutopaySummary {
  name: string;
  amountPaise: number;
  category: string;
  dayOfMonth: number;
  dueDateFormatted: string;
}

export interface WeeklyDigestData {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalSpentPaise: number;
  transactionCount: number;
  categoryBreakdown: CategorySpendSummary[];
  topCategory: { category: string; amountPaise: number } | null;
  dailyAveragePaise: number;
  monthlyBudget: {
    limitPaise: number;
    spentPaise: number;
    percentUsed: number;
    daysRemaining: number;
    safeSpendTodayPaise: number;
  } | null;
  upcomingAutopays: UpcomingAutopaySummary[];
}

export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Compiles a weekly spending, budget, and autopay digest for a user (DIFF-9).
 */
export async function compileUserWeeklyDigest(
  userId: string,
  targetDate: Date = new Date(),
): Promise<WeeklyDigestData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { budgetGoal: true },
  });

  if (!user) return null;

  // 1. Calculate past 7 days window [targetDate - 7 days, targetDate]
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(targetDate);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const startDateStr = start.toISOString().slice(0, 10);
  const endDateStr = end.toISOString().slice(0, 10);

  // 2. Fetch past 7 days expense transactions
  const weeklyTxns = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      type: 'expense',
      txnDate: {
        gte: start,
        lte: end,
      },
    },
  });

  let totalSpentPaise = 0;
  const catMap: Record<string, number> = {};

  weeklyTxns.forEach((tx) => {
    const paise = Number(tx.amountPaise);
    totalSpentPaise += paise;
    catMap[tx.category] = (catMap[tx.category] || 0) + paise;
  });

  const categoryBreakdown: CategorySpendSummary[] = Object.entries(catMap)
    .map(([cat, amt]) => ({
      category: cat,
      amountPaise: amt,
      percent: totalSpentPaise > 0 ? Math.round((amt / totalSpentPaise) * 100) : 0,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);

  const topCategory = categoryBreakdown.length > 0
    ? { category: categoryBreakdown[0].category, amountPaise: categoryBreakdown[0].amountPaise }
    : null;

  const dailyAveragePaise = Math.round(totalSpentPaise / 7);

  // 3. Current month budget evaluation
  let monthlyBudget: WeeklyDigestData['monthlyBudget'] = null;
  if (user.budgetGoal) {
    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const monthTxns = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        type: 'expense',
        txnDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    let monthSpentPaise = 0;
    monthTxns.forEach((t) => {
      monthSpentPaise += Number(t.amountPaise);
    });

    const limitPaise = Number(user.budgetGoal.monthlyExpenseLimitPaise);
    const percentUsed = limitPaise > 0 ? Math.round((monthSpentPaise / limitPaise) * 100) : 0;
    const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - targetDate.getDate() + 1);
    const remainingLimitPaise = Math.max(0, limitPaise - monthSpentPaise);
    const safeSpendTodayPaise = Math.floor(remainingLimitPaise / daysRemaining);

    monthlyBudget = {
      limitPaise,
      spentPaise: monthSpentPaise,
      percentUsed,
      daysRemaining,
      safeSpendTodayPaise,
    };
  }

  // 4. Upcoming autopays in the next 7 days
  const activePlans = await prisma.autopayPlan.findMany({
    where: {
      userId,
      active: true,
      deletedAt: null,
      type: 'expense',
    },
  });

  const upcomingAutopays: UpcomingAutopaySummary[] = [];
  const currentDay = targetDate.getDate();

  activePlans.forEach((plan) => {
    // Check if plan.day falls within [currentDay, currentDay + 7]
    const planDay = plan.day;
    let daysUntilDue = planDay - currentDay;
    if (daysUntilDue < 0) {
      // Due next month
      const daysInCurrentMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      daysUntilDue = (daysInCurrentMonth - currentDay) + planDay;
    }

    if (daysUntilDue >= 0 && daysUntilDue <= 7) {
      const dueDate = new Date(targetDate);
      dueDate.setDate(dueDate.getDate() + daysUntilDue);

      upcomingAutopays.push({
        name: plan.name,
        amountPaise: Number(plan.amountPaise),
        category: plan.category,
        dayOfMonth: plan.day,
        dueDateFormatted: dueDate.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }
  });

  upcomingAutopays.sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalSpentPaise,
    transactionCount: weeklyTxns.length,
    categoryBreakdown,
    topCategory,
    dailyAveragePaise,
    monthlyBudget,
    upcomingAutopays,
  };
}

/**
 * Renders an accessible, responsive HTML email template for the weekly summary.
 */
export function renderWeeklyDigestHtml(
  digest: WeeklyDigestData,
  userEmail: string,
  userName?: string,
): string {
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  const totalFormatted = formatRupees(digest.totalSpentPaise);
  const dailyAvgFormatted = formatRupees(digest.dailyAveragePaise);

  const categoryRows = digest.categoryBreakdown.slice(0, 5).map((cat) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
        ${cat.category}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; font-weight: 600; color: #0f172a;">
        ${formatRupees(cat.amountPaise)} (${cat.percent}%)
      </td>
    </tr>
  `).join('');

  const autopayRows = digest.upcomingAutopays.length > 0
    ? digest.upcomingAutopays.map((plan) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
            <strong>${plan.name}</strong> <span style="font-size: 12px; color: #64748b;">(${plan.category})</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; color: #0f172a;">
            Due ${plan.dueDateFormatted} &bull; <strong>${formatRupees(plan.amountPaise)}</strong>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="2" style="padding: 12px 0; font-size: 13px; color: #64748b; font-style: italic;">No scheduled bills due in the next 7 days.</td></tr>`;

  const budgetSection = digest.monthlyBudget ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">Monthly Budget Status</h3>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;">
        Spent <strong>${formatRupees(digest.monthlyBudget.spentPaise)}</strong> of <strong>${formatRupees(digest.monthlyBudget.limitPaise)}</strong> (${digest.monthlyBudget.percentUsed}%)
      </p>
      <div style="background-color: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 12px;">
        <div style="background-color: ${digest.monthlyBudget.percentUsed > 100 ? '#ef4444' : digest.monthlyBudget.percentUsed > 80 ? '#f59e0b' : '#10b981'}; width: ${Math.min(100, digest.monthlyBudget.percentUsed)}%; height: 100%;"></div>
      </div>
      <p style="margin: 0; font-size: 13px; color: #475569;">
        Safe to spend today: <strong style="color: #0284c7;">${formatRupees(digest.monthlyBudget.safeSpendTodayPaise)}/day</strong> (${digest.monthlyBudget.daysRemaining} days left)
      </p>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly MoneyTracker Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden;">
    <div style="background-color: #0f172a; padding: 20px 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">MoneyTracker</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Weekly Financial Summary &bull; ${digest.startDate} to ${digest.endDate}</p>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 15px; color: #334155; margin-top: 0;">${greeting}</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">Here is your weekly financial digest reflecting your spending activity and upcoming bill payments.</p>

      <!-- Spend Hero Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin: 18px 0;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Past 7 Days Expenses</span>
        <div style="font-size: 32px; font-weight: 700; color: #0f172a; margin: 6px 0;">${totalFormatted}</div>
        <div style="font-size: 13px; color: #64748b;">${digest.transactionCount} transactions &bull; Avg ${dailyAvgFormatted}/day</div>
      </div>

      <!-- Categories -->
      ${digest.categoryBreakdown.length > 0 ? `
        <h3 style="font-size: 15px; color: #0f172a; margin: 24px 0 10px 0;">Top Spending Categories</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
      ` : '<p style="font-size: 13px; color: #64748b; font-style: italic;">No expenses recorded in the past 7 days.</p>'}

      <!-- Budget Section -->
      ${budgetSection}

      <!-- Upcoming Autopays -->
      <h3 style="font-size: 15px; color: #0f172a; margin: 24px 0 10px 0;">Upcoming Autopay Charges (Next 7 Days)</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${autopayRows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 6px 0;">You received this email because you opted into weekly summaries for <strong>${userEmail}</strong>.</p>
      <p style="margin: 0;">To update your preferences, visit your MoneyTracker Profile &rarr; Weekly Email Digest.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders a plain-text version for accessibility and lightweight delivery.
 */
export function renderWeeklyDigestText(
  digest: WeeklyDigestData,
  userEmail: string,
  userName?: string,
): string {
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  const lines: string[] = [
    '========================================',
    'MONEYTRACKER WEEKLY FINANCIAL SUMMARY',
    `Period: ${digest.startDate} to ${digest.endDate}`,
    '========================================',
    '',
    greeting,
    '',
    `Total Spent (Past 7 Days): ${formatRupees(digest.totalSpentPaise)} (${digest.transactionCount} transactions)`,
    `Daily Average: ${formatRupees(digest.dailyAveragePaise)}/day`,
    '',
  ];

  if (digest.categoryBreakdown.length > 0) {
    lines.push('--- TOP SPENDING CATEGORIES ---');
    digest.categoryBreakdown.slice(0, 5).forEach((c) => {
      lines.push(`* ${c.category}: ${formatRupees(c.amountPaise)} (${c.percent}%)`);
    });
    lines.push('');
  }

  if (digest.monthlyBudget) {
    lines.push('--- MONTHLY BUDGET STATUS ---');
    lines.push(`Spent: ${formatRupees(digest.monthlyBudget.spentPaise)} of ${formatRupees(digest.monthlyBudget.limitPaise)} (${digest.monthlyBudget.percentUsed}%)`);
    lines.push(`Safe to spend today: ${formatRupees(digest.monthlyBudget.safeSpendTodayPaise)}/day (${digest.monthlyBudget.daysRemaining} days left)`);
    lines.push('');
  }

  lines.push('--- UPCOMING AUTOPAYS (NEXT 7 DAYS) ---');
  if (digest.upcomingAutopays.length > 0) {
    digest.upcomingAutopays.forEach((p) => {
      lines.push(`* ${p.name} (${p.category}): ${formatRupees(p.amountPaise)} on ${p.dueDateFormatted}`);
    });
  } else {
    lines.push('No scheduled bills due in the next 7 days.');
  }

  lines.push('');
  lines.push('----------------------------------------');
  lines.push(`You received this digest for ${userEmail}.`);
  lines.push('Manage your notifications anytime in MoneyTracker Profile Settings.');

  return lines.join('\n');
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  sent: boolean;
  provider: 'resend' | 'sendgrid' | 'dry-run';
  messageId?: string;
  note?: string;
}

/**
 * Sends or logs transactional email, checking for configured API credentials (X-3 / DIFF-9).
 */
export async function sendWeeklyDigestEmail(
  payload: SendEmailPayload,
): Promise<SendEmailResult> {
  const fromAddress = config.email.fromAddress;

  // 1. Resend API
  if (config.email.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.email.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { id?: string };
        logger.info({ to: payload.to, messageId: data.id }, 'Weekly digest sent via Resend');
        return { sent: true, provider: 'resend', messageId: data.id };
      }
      logger.warn({ status: res.status }, 'Resend API returned non-200');
    } catch (err) {
      logger.error({ err }, 'Failed to deliver email via Resend');
    }
  }

  // 2. SendGrid API
  if (config.email.sendgridApiKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.email.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: fromAddress },
          subject: payload.subject,
          content: [
            { type: 'text/plain', value: payload.text },
            { type: 'text/html', value: payload.html },
          ],
        }),
      });

      if (res.status === 202 || res.ok) {
        logger.info({ to: payload.to }, 'Weekly digest sent via SendGrid');
        return { sent: true, provider: 'sendgrid' };
      }
      logger.warn({ status: res.status }, 'SendGrid API returned non-200');
    } catch (err) {
      logger.error({ err }, 'Failed to deliver email via SendGrid');
    }
  }

  // 3. Dry-run / Development fallback (when credentials not present)
  logger.info(
    { to: payload.to, subject: payload.subject },
    'Weekly digest simulated (email provider credentials unconfigured - X-3)',
  );
  return {
    sent: false,
    provider: 'dry-run',
    note: 'Transactional email provider unconfigured; output rendered cleanly.',
  };
}
