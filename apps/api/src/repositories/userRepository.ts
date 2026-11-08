import { prisma } from '../db/prisma.js';
import type { User } from '@prisma/client';

export class UserRepository {
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { firebaseUid },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
    firebaseUid: string;
    email?: string | null;
    displayName?: string | null;
    authMethod: string;
    timezone?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        displayName: data.displayName,
        authMethod: data.authMethod,
        timezone: data.timezone || 'Asia/Kolkata',
      },
    });
  }

  async updateUser(
    id: string,
    data: { displayName?: string; timezone?: string },
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateLastSignIn(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastSignIn: new Date() },
    });
  }

  async deleteUserCascade(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Cascades automatically to categories, autopay_plans, transactions, budget_goals, idempotency_keys
      await tx.user.delete({
        where: { id },
      });
    });
  }
}

export const userRepository = new UserRepository();
