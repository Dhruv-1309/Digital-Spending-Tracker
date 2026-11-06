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

export interface BudgetGoalFormInput {
  monthlyLimit: number | string;
  thresholdPercent: number | string;
}

export const MAX_AMOUNT_RUPEES = 100_000_000; // ₹10 Crore

export function validateAmount(amount: number | string): { isValid: boolean; error?: string } {
  if (amount === undefined || amount === null || amount === '') {
    return { isValid: false, error: 'Please enter an amount greater than 0' };
  }

  // Reject scientific / exponent notation (e.g. 1e5, 1E+6)
  if (typeof amount === 'string' && /[eE]/.test(amount)) {
    return { isValid: false, error: 'Exponent notation is not allowed' };
  }

  const num = Number(amount);
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return { isValid: false, error: 'Please enter an amount greater than 0' };
  }

  if (num > MAX_AMOUNT_RUPEES) {
    return { isValid: false, error: 'Amount cannot exceed ₹10,00,00,000 (10 Crore)' };
  }

  // Enforce at most 2 decimal places for fractional rupee amounts
  const str = String(amount).trim();
  const decimalParts = str.split('.');
  if (decimalParts.length === 2 && decimalParts[1].length > 2) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  return { isValid: true };
}

export function validateTransactionForm(input: TransactionFormInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const amountValidation = validateAmount(input.amount);
  if (!amountValidation.isValid && amountValidation.error) {
    errors.amount = amountValidation.error;
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
  const day = Number(input.day);

  if (!input.name || input.name.trim() === '') {
    errors.name = 'Please enter a payment name';
  }

  const amountValidation = validateAmount(input.amount);
  if (!amountValidation.isValid && amountValidation.error) {
    errors.amount = amountValidation.error;
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

export function validateBudgetGoalForm(input: BudgetGoalFormInput): {
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
