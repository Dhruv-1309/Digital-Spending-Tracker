import { vi } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import type { User, Transaction, Category, AutopayPlan, BudgetGoal, IdempotencyKey } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export class InMemoryDb {
  users: User[] = [];
  transactions: Transaction[] = [];
  categories: Category[] = [];
  autopayPlans: AutopayPlan[] = [];
  budgetGoals: BudgetGoal[] = [];
  idempotencyKeys: IdempotencyKey[] = [];

  clear() {
    this.users = [];
    this.transactions = [];
    this.categories = [];
    this.autopayPlans = [];
    this.budgetGoals = [];
    this.idempotencyKeys = [];
  }
}

export const inMemoryDb = new InMemoryDb();

export function setupInMemoryPrisma() {
  inMemoryDb.clear();

  // 1. User
  vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
    if (args.where?.firebaseUid) {
      return inMemoryDb.users.find((u) => u.firebaseUid === args.where.firebaseUid) || null;
    }
    if (args.where?.id) {
      return inMemoryDb.users.find((u) => u.id === args.where.id) || null;
    }
    return null;
  });

  vi.spyOn(prisma.user, 'create').mockImplementation(async (args: any) => {
    const user: User = {
      id: args.data.id || randomUUID(),
      firebaseUid: args.data.firebaseUid,
      email: args.data.email ?? null,
      displayName: args.data.displayName ?? null,
      authMethod: args.data.authMethod || 'password',
      timezone: args.data.timezone || 'Asia/Kolkata',
      createdAt: new Date(),
      lastSignIn: new Date(),
    };
    inMemoryDb.users.push(user);
    return user;
  });

  vi.spyOn(prisma.user, 'update').mockImplementation(async (args: any) => {
    const user = inMemoryDb.users.find((u) => u.id === args.where.id);
    if (!user) throw new Error('User not found');
    if (args.data.displayName !== undefined) user.displayName = args.data.displayName;
    if (args.data.timezone !== undefined) user.timezone = args.data.timezone;
    if (args.data.lastSignIn !== undefined) user.lastSignIn = args.data.lastSignIn;
    return user;
  });

  vi.spyOn(prisma.user, 'upsert').mockImplementation(async (args: any) => {
    let user = inMemoryDb.users.find(
      (u) =>
        (args.where.firebaseUid && u.firebaseUid === args.where.firebaseUid) ||
        (args.where.id && u.id === args.where.id),
    );
    if (user) {
      if (args.update.displayName !== undefined) user.displayName = args.update.displayName;
      if (args.update.email !== undefined) user.email = args.update.email;
      if (args.update.timezone !== undefined) user.timezone = args.update.timezone;
      if (args.update.lastSignIn !== undefined) user.lastSignIn = args.update.lastSignIn;
    } else {
      user = {
        id: args.create.id || randomUUID(),
        firebaseUid: args.create.firebaseUid,
        email: args.create.email ?? null,
        displayName: args.create.displayName ?? null,
        authMethod: args.create.authMethod || 'password',
        timezone: args.create.timezone || 'Asia/Kolkata',
        createdAt: new Date(),
        lastSignIn: new Date(),
      };
      inMemoryDb.users.push(user);
    }
    return user;
  });

  vi.spyOn(prisma.user, 'delete').mockImplementation(async (args: any) => {
    const idx = inMemoryDb.users.findIndex((u) => u.id === args.where.id);
    if (idx === -1) throw new Error('User not found');
    const [deleted] = inMemoryDb.users.splice(idx, 1);
    // Cascade delete
    inMemoryDb.transactions = inMemoryDb.transactions.filter((t) => t.userId !== deleted.id);
    inMemoryDb.categories = inMemoryDb.categories.filter((c) => c.userId !== deleted.id);
    inMemoryDb.autopayPlans = inMemoryDb.autopayPlans.filter((p) => p.userId !== deleted.id);
    inMemoryDb.budgetGoals = inMemoryDb.budgetGoals.filter((b) => b.userId !== deleted.id);
    inMemoryDb.idempotencyKeys = inMemoryDb.idempotencyKeys.filter((k) => k.userId !== deleted.id);
    return deleted;
  });

  // 2. Transaction
  vi.spyOn(prisma.transaction, 'create').mockImplementation(async (args: any) => {
    const txn: Transaction = {
      id: args.data.id || randomUUID(),
      userId: args.data.userId,
      type: args.data.type,
      amountPaise: BigInt(args.data.amountPaise),
      currency: args.data.currency || 'INR',
      category: args.data.category,
      paymentMethod: args.data.paymentMethod,
      description: args.data.description || null,
      txnDate: args.data.txnDate,
      anomaly: args.data.anomaly || 'none',
      anomalyZ: args.data.anomalyZ ?? null,
      autopayId: args.data.autopayId ?? null,
      autopayPeriod: args.data.autopayPeriod ?? null,
      importHash: args.data.importHash ?? null,
      legacyId: args.data.legacyId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    inMemoryDb.transactions.push(txn);
    return txn;
  });

  vi.spyOn(prisma.transaction, 'findFirst').mockImplementation(async (args: any) => {
    return (
      inMemoryDb.transactions.find((t) => {
        if (args.where.id && t.id !== args.where.id) return false;
        if (args.where.userId && t.userId !== args.where.userId) return false;
        if (args.where.deletedAt === null && t.deletedAt !== null) return false;
        if (args.where.importHash && t.importHash !== args.where.importHash) return false;
        if (args.where.legacyId && t.legacyId !== args.where.legacyId) return false;
        return true;
      }) || null
    );
  });

  vi.spyOn(prisma.transaction, 'findMany').mockImplementation(async (args: any = {}) => {
    let items = inMemoryDb.transactions.filter((t) => {
      if (args.where?.userId && t.userId !== args.where.userId) return false;
      if (args.where?.deletedAt === null && t.deletedAt !== null) return false;
      if (args.where?.deletedAt?.gt && (!t.deletedAt || t.deletedAt <= args.where.deletedAt.gt)) return false;
      if (args.where?.deletedAt?.lt && (!t.deletedAt || t.deletedAt >= args.where.deletedAt.lt)) return false;
      if (args.where?.updatedAt?.gt && t.updatedAt <= args.where.updatedAt.gt) return false;
      if (args.where?.type && t.type !== args.where.type) return false;
      if (args.where?.category?.equals && t.category.toLowerCase() !== args.where.category.equals.toLowerCase()) return false;
      if (args.where?.category && typeof args.where.category === 'string' && t.category !== args.where.category) return false;
      if (args.where?.anomaly && t.anomaly !== args.where.anomaly) return false;
      if (args.where?.txnDate?.gte && t.txnDate < args.where.txnDate.gte) return false;
      if (args.where?.txnDate?.lte && t.txnDate > args.where.txnDate.lte) return false;
      if (args.where?.OR) {
        const matches = args.where.OR.some((cond: any) => {
          if (cond.category?.contains) {
            return t.category.toLowerCase().includes(cond.category.contains.toLowerCase());
          }
          if (cond.description?.contains) {
            return (t.description || '').toLowerCase().includes(cond.description.contains.toLowerCase());
          }
          return false;
        });
        if (!matches) return false;
      }
      return true;
    });

    if (args.orderBy?.txnDate === 'asc') {
      items.sort((a, b) => a.txnDate.getTime() - b.txnDate.getTime());
    } else {
      items.sort((a, b) => b.txnDate.getTime() - a.txnDate.getTime());
    }

    if (args.skip) {
      items = items.slice(args.skip);
    }
    if (args.take) {
      items = items.slice(0, args.take);
    }

    return items;
  });

  vi.spyOn(prisma.transaction, 'count').mockImplementation(async (args: any = {}) => {
    const list = await (prisma.transaction.findMany as any)(args);
    return list.length;
  });

  vi.spyOn(prisma.transaction, 'update').mockImplementation(async (args: any) => {
    const txn = inMemoryDb.transactions.find((t) => t.id === args.where.id);
    if (!txn) throw new Error('Transaction not found');
    if (args.data.type) txn.type = args.data.type;
    if (args.data.amountPaise !== undefined) txn.amountPaise = args.data.amountPaise;
    if (args.data.category) txn.category = args.data.category;
    if (args.data.paymentMethod) txn.paymentMethod = args.data.paymentMethod;
    if (args.data.description !== undefined) txn.description = args.data.description;
    if (args.data.txnDate) txn.txnDate = args.data.txnDate;
    if (args.data.anomaly) txn.anomaly = args.data.anomaly;
    if (args.data.deletedAt !== undefined) txn.deletedAt = args.data.deletedAt;
    txn.updatedAt = new Date();
    return txn;
  });

  vi.spyOn(prisma.transaction, 'updateMany').mockImplementation(async (args: any) => {
    let count = 0;
    inMemoryDb.transactions.forEach((t) => {
      if (args.where.userId && t.userId !== args.where.userId) return;
      if (args.where.deletedAt === null && t.deletedAt !== null) return;
      if (args.where.category && t.category !== args.where.category) return;
      if (args.data.importHash) t.importHash = args.data.importHash;
      count += 1;
    });
    return { count };
  });

  vi.spyOn(prisma.transaction, 'deleteMany').mockImplementation(async (args: any) => {
    const beforeCount = inMemoryDb.transactions.length;
    inMemoryDb.transactions = inMemoryDb.transactions.filter((t) => {
      if (args.where?.deletedAt?.lt && t.deletedAt && t.deletedAt < args.where.deletedAt.lt) {
        return false;
      }
      return true;
    });
    return { count: beforeCount - inMemoryDb.transactions.length };
  });

  // 3. Category
  vi.spyOn(prisma.category, 'findMany').mockImplementation(async (args: any) => {
    return inMemoryDb.categories.filter((c) => c.userId === args.where?.userId);
  });

  vi.spyOn(prisma.category, 'findUnique').mockImplementation(async (args: any) => {
    const target = args.where.userId_type_name;
    return (
      inMemoryDb.categories.find(
        (c) =>
          c.userId === target.userId &&
          c.type === target.type &&
          c.name.toLowerCase() === target.name.toLowerCase(),
      ) || null
    );
  });

  vi.spyOn(prisma.category, 'findFirst').mockImplementation(async (args: any) => {
    return (
      inMemoryDb.categories.find(
        (c) => c.id === args.where.id && c.userId === args.where.userId,
      ) || null
    );
  });

  vi.spyOn(prisma.category, 'create').mockImplementation(async (args: any) => {
    const category: Category = {
      id: args.data.id || randomUUID(),
      userId: args.data.userId,
      type: args.data.type,
      name: args.data.name,
    };
    inMemoryDb.categories.push(category);
    return category;
  });

  vi.spyOn(prisma.category, 'delete').mockImplementation(async (args: any) => {
    const idx = inMemoryDb.categories.findIndex((c) => c.id === args.where.id);
    if (idx === -1) throw new Error('Category not found');
    const [deleted] = inMemoryDb.categories.splice(idx, 1);
    return deleted;
  });

  vi.spyOn(prisma.category, 'upsert').mockImplementation(async (args: any) => {
    const { userId, name, type } = args.where.userId_name_type;
    let cat = inMemoryDb.categories.find(
      (c) => c.userId === userId && c.name.toLowerCase() === name.toLowerCase() && c.type === type,
    );
    if (!cat) {
      cat = {
        id: args.create.id || randomUUID(),
        userId,
        name: args.create.name,
        type: args.create.type,
      };
      inMemoryDb.categories.push(cat);
    }
    return cat;
  });

  vi.spyOn(prisma.category, 'count').mockImplementation(async (args: any = {}) => {
    const list = await (prisma.category.findMany as any)(args);
    return list.length;
  });

  // 4. AutopayPlan
  vi.spyOn(prisma.autopayPlan, 'findMany').mockImplementation(async (args: any = {}) => {
    let list = inMemoryDb.autopayPlans.filter((p) => {
      if (args.where?.userId && p.userId !== args.where.userId) return false;
      if (args.where?.deletedAt === null && p.deletedAt !== null) return false;
      if (args.where?.active !== undefined && p.active !== args.where.active) return false;
      if (args.where?.updatedAt?.gt && p.updatedAt <= args.where.updatedAt.gt) return false;
      if (args.where?.deletedAt?.gt && (!p.deletedAt || p.deletedAt <= args.where.deletedAt.gt)) return false;
      return true;
    });

    if (args.orderBy?.day === 'asc') {
      list.sort((a, b) => a.day - b.day);
    } else if (args.orderBy?.day === 'desc') {
      list.sort((a, b) => b.day - a.day);
    }

    if (args.skip !== undefined || args.take !== undefined) {
      const skip = args.skip || 0;
      const take = args.take !== undefined ? args.take : list.length;
      list = list.slice(skip, skip + take);
    }

    return list;
  });

  vi.spyOn(prisma.autopayPlan, 'findFirst').mockImplementation(async (args: any) => {
    return (
      inMemoryDb.autopayPlans.find((p) => {
        if (args.where.id && p.id !== args.where.id) return false;
        if (args.where.userId && p.userId !== args.where.userId) return false;
        if (args.where.name && p.name !== args.where.name) return false;
        if (args.where.day && p.day !== args.where.day) return false;
        if (args.where.deletedAt === null && p.deletedAt !== null) return false;
        return true;
      }) || null
    );
  });

  vi.spyOn(prisma.autopayPlan, 'count').mockImplementation(async (args: any = {}) => {
    const list = await (prisma.autopayPlan.findMany as any)(args);
    return list.length;
  });

  vi.spyOn(prisma.autopayPlan, 'findUnique').mockImplementation(async (args: any) => {
    return inMemoryDb.autopayPlans.find((p) => p.id === args.where.id) || null;
  });

  vi.spyOn(prisma.autopayPlan, 'create').mockImplementation(async (args: any) => {
    const plan: AutopayPlan = {
      id: args.data.id || randomUUID(),
      userId: args.data.userId,
      name: args.data.name,
      type: args.data.type,
      amountPaise: BigInt(args.data.amountPaise),
      currency: args.data.currency || 'INR',
      category: args.data.category,
      day: args.data.day,
      description: args.data.description || null,
      active: args.data.active ?? true,
      lastProcessedMonth: null,
      legacyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    inMemoryDb.autopayPlans.push(plan);
    return plan;
  });

  vi.spyOn(prisma.autopayPlan, 'update').mockImplementation(async (args: any) => {
    const plan = inMemoryDb.autopayPlans.find((p) => p.id === args.where.id);
    if (!plan) throw new Error('Autopay plan not found');
    if (args.data.name !== undefined) plan.name = args.data.name;
    if (args.data.type !== undefined) plan.type = args.data.type;
    if (args.data.amountPaise !== undefined) plan.amountPaise = args.data.amountPaise;
    if (args.data.category !== undefined) plan.category = args.data.category;
    if (args.data.day !== undefined) plan.day = args.data.day;
    if (args.data.description !== undefined) plan.description = args.data.description;
    if (args.data.active !== undefined) plan.active = args.data.active;
    if (args.data.lastProcessedMonth !== undefined) plan.lastProcessedMonth = args.data.lastProcessedMonth;
    if (args.data.deletedAt !== undefined) plan.deletedAt = args.data.deletedAt;
    plan.updatedAt = new Date();
    return plan;
  });

  vi.spyOn(prisma.autopayPlan, 'deleteMany').mockImplementation(async (args: any) => {
    const beforeCount = inMemoryDb.autopayPlans.length;
    inMemoryDb.autopayPlans = inMemoryDb.autopayPlans.filter((p) => {
      if (args.where?.deletedAt?.lt && p.deletedAt && p.deletedAt < args.where.deletedAt.lt) {
        return false;
      }
      return true;
    });
    return { count: beforeCount - inMemoryDb.autopayPlans.length };
  });

  // 5. BudgetGoal
  vi.spyOn(prisma.budgetGoal, 'findUnique').mockImplementation(async (args: any) => {
    return inMemoryDb.budgetGoals.find((b) => b.userId === args.where.userId) || null;
  });

  vi.spyOn(prisma.budgetGoal, 'upsert').mockImplementation(async (args: any) => {
    let goal = inMemoryDb.budgetGoals.find((b) => b.userId === args.where.userId);
    if (goal) {
      goal.monthlyExpenseLimitPaise = args.update.monthlyExpenseLimitPaise;
      goal.thresholdPercent = args.update.thresholdPercent;
      goal.updatedAt = new Date();
    } else {
      goal = {
        userId: args.create.userId,
        monthlyExpenseLimitPaise: args.create.monthlyExpenseLimitPaise,
        thresholdPercent: args.create.thresholdPercent,
        updatedAt: new Date(),
      };
      inMemoryDb.budgetGoals.push(goal);
    }
    return goal;
  });

  // 6. IdempotencyKey
  vi.spyOn(prisma.idempotencyKey, 'findUnique').mockImplementation(async (args: any) => {
    const { userId, key } = args.where.userId_key;
    return inMemoryDb.idempotencyKeys.find((k) => k.userId === userId && k.key === key) || null;
  });

  vi.spyOn(prisma.idempotencyKey, 'upsert').mockImplementation(async (args: any) => {
    const { userId, key } = args.where.userId_key;
    let item = inMemoryDb.idempotencyKeys.find((k) => k.userId === userId && k.key === key);
    if (item) {
      item.requestHash = args.update.requestHash;
      item.responseStatus = args.update.responseStatus;
      item.responseBody = args.update.responseBody;
    } else {
      item = {
        userId,
        key,
        requestHash: args.create.requestHash,
        responseStatus: args.create.responseStatus,
        responseBody: args.create.responseBody,
        createdAt: new Date(),
      };
      inMemoryDb.idempotencyKeys.push(item);
    }
    return item;
  });

  vi.spyOn(prisma.idempotencyKey, 'deleteMany').mockImplementation(async (args: any) => {
    const beforeCount = inMemoryDb.idempotencyKeys.length;
    inMemoryDb.idempotencyKeys = inMemoryDb.idempotencyKeys.filter((k) => {
      if (args.where?.createdAt?.lt && k.createdAt < args.where.createdAt.lt) {
        return false;
      }
      return true;
    });
    return { count: beforeCount - inMemoryDb.idempotencyKeys.length };
  });

  // 7. $transaction
  vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
    if (typeof callback === 'function') {
      return callback(prisma);
    }
    return Promise.all(callback);
  });
}
