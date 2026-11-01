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
    errors.amount = 'Please enter a valid amount greater than 0';
  }

  if (!input.type || (input.type !== 'income' && input.type !== 'expense')) {
    errors.type = 'Please select a valid transaction type';
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
    errors.amount = 'Please enter a valid amount greater than 0';
  }

  if (!input.type || (input.type !== 'income' && input.type !== 'expense')) {
    errors.type = 'Please select recurring type';
  }

  if (!input.category || input.category.trim() === '') {
    errors.category = 'Please select a category';
  }

  if (!input.day || isNaN(day) || day < 1 || day > 31) {
    errors.day = 'Please select a valid day between 1 and 31';
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
    errors.monthlyLimit = 'Please enter a valid limit';
  }

  if (isNaN(threshold) || threshold < 1 || threshold > 100) {
    errors.thresholdPercent = 'Threshold must be between 1% and 100%';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
