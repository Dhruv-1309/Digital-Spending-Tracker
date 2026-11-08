export interface TransactionFormInput {
  amount: number | string;
  type: string;
  date: string;
  category: string;
  paymentMethod: string;
}

export interface AutopayFormInput {
  name: string;
  amount: number | string;
  type: string;
  category: string;
  day: number | string;
}

export interface BudgetGoalInput {
  monthlyLimit: number | string;
  thresholdPercent: number | string;
}

export function validateTransactionForm(input: TransactionFormInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const amount = Number(input.amount);

  if (!input.amount || isNaN(amount) || amount <= 0) {
    errors.amount = 'Please enter an amount greater than 0';
  }

  if (!input.type || (input.type !== 'income' && input.type !== 'expense')) {
    errors.type = 'Please select whether this is an income or an expense';
  }

  if (!input.date) {
    errors.date = 'Please select a date';
  }

  if (!input.category || input.category.trim() === '') {
    errors.category = 'Please select a category';
  }

  if (!input.paymentMethod || input.paymentMethod.trim() === '') {
    errors.paymentMethod = 'Please select a payment method';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateAutopayForm(input: AutopayFormInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const amount = Number(input.amount);
  const day = Number(input.day);

  if (!input.name || input.name.trim() === '') {
    errors.name = 'Please enter a payment name';
  }

  if (!input.amount || isNaN(amount) || amount <= 0) {
    errors.amount = 'Please enter an amount greater than 0';
  }

  if (!input.type || (input.type !== 'income' && input.type !== 'expense')) {
    errors.type = 'Please select whether this is an income or an expense';
  }

  if (!input.category || input.category.trim() === '') {
    errors.category = 'Please select a category';
  }

  if (!input.day || isNaN(day) || day < 1 || day > 31) {
    errors.day = 'Please choose a day between 1 and 31';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBudgetGoalForm(input: BudgetGoalInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const limit = Number(input.monthlyLimit);
  const threshold = Number(input.thresholdPercent);

  if (isNaN(limit) || limit < 0) {
    errors.monthlyLimit = 'Please enter a monthly limit of 0 or greater';
  }

  if (isNaN(threshold) || threshold < 1 || threshold > 100) {
    errors.thresholdPercent = 'Please enter an alert threshold between 1% and 100%';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export {
  COMMON_PASSWORDS,
  validatePassword,
  type PasswordValidationResult,
} from '@moneytracker/shared';
