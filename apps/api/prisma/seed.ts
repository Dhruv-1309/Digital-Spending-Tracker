import { PrismaClient, TxnType, PayMethod, AnomalyState } from '@prisma/client';
import { fileURLToPath } from 'node:url';

export interface SeedResult {
  userId: string;
  userEmail: string;
  categoriesCount: number;
  autopayPlansCount: number;
  transactionsCount: number;
  budgetGoalSet: boolean;
}

export const SEED_EXPENSE_CATEGORIES = [
  'Housing',
  'Groceries',
  'Food & Dining',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Investments',
  'Personal Care',
];

export const SEED_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment Returns',
  'Refunds',
];

/**
 * Populates the database with 3 full months of realistic personal finance
 * records, autopay plans, custom categories, and a budget goal (BE-20).
 */
export async function seedDatabase(client?: PrismaClient): Promise<SeedResult> {
  const prisma = client || new PrismaClient();
  const shouldDisconnect = !client;

  try {
    const firebaseUid = process.env.DEMO_USER_UID || 'demo-user-123';
    const email = process.env.DEMO_USER_EMAIL || 'dhruv@example.com';
    const displayName = 'Dhruv Sharma (Demo Account)';
    const timezone = 'Asia/Kolkata';

    // 1. Upsert Demo User
    const user = await prisma.user.upsert({
      where: { firebaseUid },
      update: {
        email,
        displayName,
        timezone,
        authMethod: 'password',
      },
      create: {
        firebaseUid,
        email,
        displayName,
        timezone,
        authMethod: 'password',
      },
    });

    // Clean existing seed data for this user to guarantee clean idempotency
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.autopayPlan.deleteMany({ where: { userId: user.id } });
    await prisma.category.deleteMany({ where: { userId: user.id } });

    // 2. Seed Categories
    const categoryData = [
      ...SEED_EXPENSE_CATEGORIES.map((name) => ({ userId: user.id, name, type: TxnType.expense })),
      ...SEED_INCOME_CATEGORIES.map((name) => ({ userId: user.id, name, type: TxnType.income })),
    ];
    await prisma.category.createMany({ data: categoryData });
    const categoriesCount = categoryData.length;

    // 3. Seed Budget Goal
    await prisma.budgetGoal.upsert({
      where: { userId: user.id },
      update: {
        monthlyExpenseLimitPaise: 6500000n, // ₹65,000 / month
        thresholdPercent: 80,
      },
      create: {
        userId: user.id,
        monthlyExpenseLimitPaise: 6500000n,
        thresholdPercent: 80,
      },
    });

    // 4. Seed Autopay Plans
    const rentPlan = await prisma.autopayPlan.create({
      data: {
        userId: user.id,
        name: 'Apartment Lease Transfer',
        type: TxnType.expense,
        amountPaise: 2500000n, // ₹25,000
        category: 'Housing',
        day: 1,
        description: 'Monthly residential lease bank transfer',
        active: true,
      },
    });

    const fiberPlan = await prisma.autopayPlan.create({
      data: {
        userId: user.id,
        name: 'Airtel Xstream Fiber Broadband',
        type: TxnType.expense,
        amountPaise: 117900n, // ₹1,179
        category: 'Utilities',
        day: 5,
        description: 'High-speed fiber optic internet bill',
        active: true,
      },
    });

    const sipPlan = await prisma.autopayPlan.create({
      data: {
        userId: user.id,
        name: 'Nifty 50 Index Fund SIP',
        type: TxnType.expense,
        amountPaise: 1500000n, // ₹15,000
        category: 'Investments',
        day: 10,
        description: 'Automated monthly wealth index investment',
        active: true,
      },
    });

    const netflixPlan = await prisma.autopayPlan.create({
      data: {
        userId: user.id,
        name: 'Netflix & Spotify Streaming',
        type: TxnType.expense,
        amountPaise: 89900n, // ₹899
        category: 'Entertainment',
        day: 15,
        description: 'Monthly digital streaming subscription bundle',
        active: true,
      },
    });

    const salaryPlan = await prisma.autopayPlan.create({
      data: {
        userId: user.id,
        name: 'Tech Mahindra Engineering Salary',
        type: TxnType.income,
        amountPaise: 11500000n, // ₹1,15,000
        category: 'Salary',
        day: 30,
        description: 'Primary tech employment payroll credit',
        active: true,
      },
    });

    const autopayPlansCount = 5;

    // 5. Seed 3 Months of Transactions (M-2, M-1, M)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Helper to format ISO Date without timezone shifts
    const makeDate = (monthsAgo: number, day: number): Date => {
      const targetDate = new Date(Date.UTC(currentYear, currentMonth - monthsAgo, day, 12, 0, 0));
      return targetDate;
    };

    const getPeriodStr = (monthsAgo: number): string => {
      const d = new Date(Date.UTC(currentYear, currentMonth - monthsAgo, 1));
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };

    const txns = [];

    // Loop across 3 months: 2 = M-2, 1 = M-1, 0 = current month M
    for (let m = 2; m >= 0; m--) {
      const period = getPeriodStr(m);

      // Monthly Autopay executions
      txns.push({
        userId: user.id,
        type: TxnType.expense,
        amountPaise: 2500000n,
        currency: 'INR',
        category: 'Housing',
        paymentMethod: PayMethod.bank_transfer,
        description: 'Apartment Lease Transfer',
        txnDate: makeDate(m, 1),
        anomaly: AnomalyState.none,
        autopayId: rentPlan.id,
        autopayPeriod: period,
      });

      txns.push({
        userId: user.id,
        type: TxnType.expense,
        amountPaise: 117900n,
        currency: 'INR',
        category: 'Utilities',
        paymentMethod: PayMethod.upi,
        description: 'Airtel Xstream Fiber Broadband',
        txnDate: makeDate(m, 5),
        anomaly: AnomalyState.none,
        autopayId: fiberPlan.id,
        autopayPeriod: period,
      });

      txns.push({
        userId: user.id,
        type: TxnType.expense,
        amountPaise: 1500000n,
        currency: 'INR',
        category: 'Investments',
        paymentMethod: PayMethod.net_banking,
        description: 'Nifty 50 Index Fund SIP',
        txnDate: makeDate(m, 10),
        anomaly: AnomalyState.none,
        autopayId: sipPlan.id,
        autopayPeriod: period,
      });

      txns.push({
        userId: user.id,
        type: TxnType.expense,
        amountPaise: 89900n,
        currency: 'INR',
        category: 'Entertainment',
        paymentMethod: PayMethod.credit_card,
        description: 'Netflix & Spotify Streaming',
        txnDate: makeDate(m, 15),
        anomaly: AnomalyState.none,
        autopayId: netflixPlan.id,
        autopayPeriod: period,
      });

      txns.push({
        userId: user.id,
        type: TxnType.income,
        amountPaise: 11500000n,
        currency: 'INR',
        category: 'Salary',
        paymentMethod: PayMethod.bank_transfer,
        description: 'Tech Mahindra Engineering Salary',
        txnDate: makeDate(m, 28),
        anomaly: AnomalyState.none,
        autopayId: salaryPlan.id,
        autopayPeriod: period,
      });

      // Realistic Discretionary & Everyday Transactions per month
      txns.push(
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 245000n, // ₹2,450
          currency: 'INR',
          category: 'Groceries',
          paymentMethod: PayMethod.upi,
          description: 'Nature Basket Weekly Organic Supplies',
          txnDate: makeDate(m, 3),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 85000n, // ₹850
          currency: 'INR',
          category: 'Food & Dining',
          paymentMethod: PayMethod.credit_card,
          description: 'Third Wave Coffee Roasters & Bagel',
          txnDate: makeDate(m, 6),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 55000n, // ₹550
          currency: 'INR',
          category: 'Transportation',
          paymentMethod: PayMethod.upi,
          description: 'Uber Comfort ride to Tech Park',
          txnDate: makeDate(m, 8),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 142000n, // ₹1,420
          currency: 'INR',
          category: 'Groceries',
          paymentMethod: PayMethod.upi,
          description: 'Blinkit Instant Fresh Produce & Dairy',
          txnDate: makeDate(m, 12),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 280000n, // ₹2,800
          currency: 'INR',
          category: 'Food & Dining',
          paymentMethod: PayMethod.credit_card,
          description: 'Dinner at Smoke House Deli with colleagues',
          txnDate: makeDate(m, 17),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 250000n, // ₹2,500
          currency: 'INR',
          category: 'Transportation',
          paymentMethod: PayMethod.debit_card,
          description: 'Indian Oil Fuel Refill (Petrol)',
          txnDate: makeDate(m, 19),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 185000n, // ₹1,850
          currency: 'INR',
          category: 'Groceries',
          paymentMethod: PayMethod.upi,
          description: 'Zepto Instant Grocery Pantry Restock',
          txnDate: makeDate(m, 22),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 125000n, // ₹1,250
          currency: 'INR',
          category: 'Healthcare',
          paymentMethod: PayMethod.upi,
          description: 'Apollo Pharmacy Prescription Medicines',
          txnDate: makeDate(m, 24),
          anomaly: AnomalyState.none,
        },
        {
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 349900n, // ₹3,499
          currency: 'INR',
          category: 'Shopping',
          paymentMethod: PayMethod.credit_card,
          description: 'Amazon Electronics (Ergonomic Keyboard)',
          txnDate: makeDate(m, 26),
          anomaly: AnomalyState.none,
        },
      );

      // Month-specific distinct transactions
      if (m === 2) {
        // Month M-2 additional freelance income
        txns.push({
          userId: user.id,
          type: TxnType.income,
          amountPaise: 3500000n, // ₹35,000
          currency: 'INR',
          category: 'Freelance',
          paymentMethod: PayMethod.bank_transfer,
          description: 'Next.js Frontend Architecture Consulting Milestone 1',
          txnDate: makeDate(m, 14),
          anomaly: AnomalyState.none,
        });
      } else if (m === 1) {
        // Month M-1 outlier / anomaly spend
        txns.push({
          userId: user.id,
          type: TxnType.expense,
          amountPaise: 1890000n, // ₹18,900
          currency: 'INR',
          category: 'Shopping',
          paymentMethod: PayMethod.credit_card,
          description: 'Apple Authorized Service - Screen Panel Replacement',
          txnDate: makeDate(m, 20),
          anomaly: AnomalyState.flagged,
          anomalyZ: 3.25,
        });
        txns.push({
          userId: user.id,
          type: TxnType.income,
          amountPaise: 2250000n, // ₹22,500
          currency: 'INR',
          category: 'Freelance',
          paymentMethod: PayMethod.bank_transfer,
          description: 'Next.js Frontend Architecture Milestone 2 Completion',
          txnDate: makeDate(m, 25),
          anomaly: AnomalyState.none,
        });
      } else if (m === 0) {
        // Month M (current month) cashback / refund
        txns.push({
          userId: user.id,
          type: TxnType.income,
          amountPaise: 120000n, // ₹1,200
          currency: 'INR',
          category: 'Refunds',
          paymentMethod: PayMethod.upi,
          description: 'Amazon Returned Item Refund Credit',
          txnDate: makeDate(m, 11),
          anomaly: AnomalyState.none,
        });
      }
    }

    await prisma.transaction.createMany({ data: txns });
    const transactionsCount = txns.length;

    const result: SeedResult = {
      userId: user.id,
      userEmail: user.email || email,
      categoriesCount,
      autopayPlansCount,
      transactionsCount,
      budgetGoalSet: true,
    };

    return result;
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}

// Standalone execution entrypoint when run via CLI `npx tsx prisma/seed.ts`
const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  seedDatabase()
    .then((res) => {
      // Safe CLI output format
      process.stdout.write(
        `Database successfully seeded for ${res.userEmail} (ID: ${res.userId})\n` +
          `  - Categories:   ${res.categoriesCount}\n` +
          `  - AutopayPlans: ${res.autopayPlansCount}\n` +
          `  - Transactions: ${res.transactionsCount}\n` +
          `  - Budget Goal:  Set (₹65,000 / month @ 80%)\n`,
      );
      process.exit(0);
    })
    .catch((err) => {
      process.stderr.write(`Error during database seeding: ${err instanceof Error ? err.stack : String(err)}\n`);
      process.exit(1);
    });
}
