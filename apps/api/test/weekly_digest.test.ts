import { describe, it, expect, beforeEach } from 'vitest';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';
import {
  compileUserWeeklyDigest,
  renderWeeklyDigestHtml,
  renderWeeklyDigestText,
  sendWeeklyDigestEmail,
  formatRupees,
} from '../src/services/weeklyDigestService.js';
import { processWeeklyDigests } from '../src/jobs/weeklyDigestJob.js';
import { prisma } from '../src/db/prisma.js';
import { randomUUID } from 'node:crypto';

describe('Weekly Financial Summary Email Digest (DIFF-9 / X-3)', () => {
  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('formats integer paise correctly as Indian Rupees', () => {
    expect(formatRupees(15000000)).toMatch(/₹\s?1,50,000/);
    expect(formatRupees(64900)).toMatch(/₹\s?649/);
    expect(formatRupees(0)).toMatch(/₹\s?0/);
  });

  it('compiles past 7 days spending, top categories, monthly budget, and upcoming autopays', async () => {
    // 1. Create test user
    const userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        firebaseUid: 'uid-digest-user',
        email: 'alice@example.com',
        displayName: 'Alice Sharma',
        authMethod: 'password',
      },
    });

    // 2. Set monthly budget limit of ₹1,00,000 (10,000,000 paise)
    await prisma.budgetGoal.create({
      data: {
        userId,
        monthlyExpenseLimitPaise: BigInt(10000000),
        thresholdPercent: 80,
      },
    });

    const targetDate = new Date('2026-11-15T10:00:00.000Z');

    // 3. Create expense transactions in the last 7 days (Nov 8 - Nov 15)
    await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amountPaise: BigInt(500000), // ₹5,000
        category: 'Groceries',
        paymentMethod: 'upi',
        description: 'Supermarket supplies',
        txnDate: new Date('2026-11-12'),
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amountPaise: BigInt(300000), // ₹3,000
        category: 'Dining Out',
        paymentMethod: 'credit_card',
        description: 'Dinner with family',
        txnDate: new Date('2026-11-14'),
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amountPaise: BigInt(200000), // ₹2,000
        category: 'Entertainment',
        paymentMethod: 'upi',
        description: 'Movie tickets',
        txnDate: new Date('2026-11-10'),
      },
    });

    // 4. Create an older expense (outside 7-day window, on Nov 1)
    await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amountPaise: BigInt(1000000), // ₹10,000
        category: 'Utilities',
        paymentMethod: 'net_banking',
        description: 'Electricity bill',
        txnDate: new Date('2026-11-01'),
      },
    });

    // 5. Create upcoming autopay plan due on the 18th (in 3 days)
    await prisma.autopayPlan.create({
      data: {
        userId,
        name: 'Broadband Fiber',
        type: 'expense',
        amountPaise: BigInt(99900), // ₹999
        category: 'Utilities',
        day: 18,
        active: true,
      },
    });

    // 6. Compile digest
    const digest = await compileUserWeeklyDigest(userId, targetDate);
    expect(digest).not.toBeNull();
    if (!digest) return;

    // Past 7 days: ₹5,000 + ₹3,000 + ₹2,000 = ₹10,000 (1,000,000 paise)
    expect(digest.totalSpentPaise).toBe(1000000);
    expect(digest.transactionCount).toBe(3);
    expect(digest.dailyAveragePaise).toBe(Math.round(1000000 / 7));

    // Top category check
    expect(digest.topCategory?.category).toBe('Groceries');
    expect(digest.topCategory?.amountPaise).toBe(500000);

    // Category breakdown sorting
    expect(digest.categoryBreakdown[0].category).toBe('Groceries');
    expect(digest.categoryBreakdown[0].percent).toBe(50);
    expect(digest.categoryBreakdown[1].category).toBe('Dining Out');
    expect(digest.categoryBreakdown[1].percent).toBe(30);

    // Monthly budget check: Month total includes Nov 1 expense (₹10,000) + 7-day expenses (₹10,000) = ₹20,000
    expect(digest.monthlyBudget).not.toBeNull();
    expect(digest.monthlyBudget?.limitPaise).toBe(10000000);
    expect(digest.monthlyBudget?.spentPaise).toBe(2000000);
    expect(digest.monthlyBudget?.percentUsed).toBe(20);

    // Upcoming autopays in next 7 days
    expect(digest.upcomingAutopays).toHaveLength(1);
    expect(digest.upcomingAutopays[0].name).toBe('Broadband Fiber');
    expect(digest.upcomingAutopays[0].amountPaise).toBe(99900);
  });

  it('renders clean accessible HTML and plain text email templates', async () => {
    const userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        firebaseUid: 'uid-digest-render',
        email: 'bob@example.com',
        displayName: 'Bob Mehta',
        authMethod: 'password',
      },
    });

    const targetDate = new Date('2026-11-15T10:00:00.000Z');
    await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amountPaise: BigInt(450000), // ₹4,500
        category: 'Food',
        paymentMethod: 'upi',
        description: 'Groceries',
        txnDate: new Date('2026-11-13'),
      },
    });

    const digest = await compileUserWeeklyDigest(userId, targetDate);
    expect(digest).not.toBeNull();
    if (!digest) return;

    // HTML Rendering Check
    const html = renderWeeklyDigestHtml(digest, 'bob@example.com', 'Bob');
    expect(html).toContain('MoneyTracker');
    expect(html).toContain('Hello Bob,');
    expect(html).toContain('Food');
    expect(html).toContain('bob@example.com');
    expect(html).toContain('Weekly Email Digest');
    // Ensure no third-party tracker or script tags
    expect(html).not.toContain('<script');
    expect(html).not.toContain('google-analytics');

    // Plain Text Rendering Check
    const text = renderWeeklyDigestText(digest, 'bob@example.com', 'Bob');
    expect(text).toContain('MONEYTRACKER WEEKLY FINANCIAL SUMMARY');
    expect(text).toContain('Total Spent (Past 7 Days):');
    expect(text).toContain('Food');
    expect(text).toContain('bob@example.com');
  });

  it('handles zero-spending week and empty autopays without crashing', async () => {
    const userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        firebaseUid: 'uid-digest-empty',
        email: 'charlie@example.com',
        authMethod: 'password',
      },
    });

    const digest = await compileUserWeeklyDigest(userId, new Date('2026-11-15'));
    expect(digest).not.toBeNull();
    if (!digest) return;

    expect(digest.totalSpentPaise).toBe(0);
    expect(digest.transactionCount).toBe(0);
    expect(digest.topCategory).toBeNull();
    expect(digest.categoryBreakdown).toHaveLength(0);
    expect(digest.upcomingAutopays).toHaveLength(0);

    const html = renderWeeklyDigestHtml(digest, 'charlie@example.com');
    expect(html).toContain('No expenses recorded in the past 7 days');
    expect(html).toContain('No scheduled bills due in the next 7 days');

    const text = renderWeeklyDigestText(digest, 'charlie@example.com');
    expect(text).toContain('Total Spent (Past 7 Days):');
    expect(text).toContain('No scheduled bills due in the next 7 days');
  });

  it('falls back gracefully to dry-run when provider credentials are not set (X-3)', async () => {
    const result = await sendWeeklyDigestEmail({
      to: 'dave@example.com',
      subject: 'Weekly Summary',
      html: '<p>Weekly summary</p>',
      text: 'Weekly summary',
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe('dry-run');
    expect(result.note).toContain('output rendered cleanly');
  });

  it('runs batch processWeeklyDigests job across all registered users', async () => {
    // Populate two users
    await prisma.user.create({
      data: {
        id: randomUUID(),
        firebaseUid: 'uid-user-1',
        email: 'user1@example.com',
        authMethod: 'password',
      },
    });

    await prisma.user.create({
      data: {
        id: randomUUID(),
        firebaseUid: 'uid-user-2',
        email: 'user2@example.com',
        authMethod: 'password',
      },
    });

    const result = await processWeeklyDigests(new Date('2026-11-15'));
    expect(result.totalEligibleUsers).toBeGreaterThanOrEqual(2);
    expect(result.processedCount).toBeGreaterThanOrEqual(2);
    expect(result.failedCount).toBe(0);
  });
});
