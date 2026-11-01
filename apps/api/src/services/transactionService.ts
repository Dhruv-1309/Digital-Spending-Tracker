import {
  transactionRepository,
  type CreateTransactionRepoInput,
  type ListTransactionsFilter,
} from '../repositories/transactionRepository.js';
import {
  exportTransactionsCsv,
  exportTransactionsJson,
} from '@moneytracker/shared';
import { autopayRepository } from '../repositories/autopayRepository.js';
import { budgetRepository } from '../repositories/budgetRepository.js';

export class TransactionService {
  async listTransactions(userId: string, filter: ListTransactionsFilter) {
    return transactionRepository.listTransactions(userId, filter);
  }

  async createTransaction(userId: string, input: CreateTransactionRepoInput) {
    return transactionRepository.createTransaction(userId, input);
  }

  async updateTransaction(
    userId: string,
    id: string,
    input: Partial<CreateTransactionRepoInput>,
  ) {
    return transactionRepository.updateTransaction(userId, id, input);
  }

  async deleteTransaction(userId: string, id: string) {
    return transactionRepository.softDeleteTransaction(userId, id);
  }

  async importBatch(userId: string, rows: any[]) {
    return transactionRepository.importBatch(userId, rows);
  }

  async exportCsv(userId: string, filter: ListTransactionsFilter, format: 'csv-detailed' | 'csv-basic') {
    const { items } = await transactionRepository.listTransactions(userId, {
      ...filter,
      page: 1,
      pageSize: 100000,
    });
    return exportTransactionsCsv(items, format);
  }

  async exportJson(userId: string) {
    const [{ items: transactions }, { plans: autopays }, budgetGoal] = await Promise.all([
      transactionRepository.listTransactions(userId, { page: 1, pageSize: 100000 }),
      autopayRepository.listAutopayPlans(userId),
      budgetRepository.getBudgetGoal(userId),
    ]);

    return exportTransactionsJson({
      transactions,
      autopays,
      budgetGoal: budgetGoal || { monthlyExpenseLimit: 0, thresholdPercent: 80 },
    });
  }

  async getAnomalies(userId: string) {
    return transactionRepository.getFlaggedAnomalies(userId);
  }

  async approveAnomaly(userId: string, id: string) {
    return transactionRepository.approveAnomaly(userId, id);
  }
}

export const transactionService = new TransactionService();
