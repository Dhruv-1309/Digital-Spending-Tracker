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

export const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password12',
  'password123',
  'pass1234',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'admin',
  'admin123',
  'admin1234',
  'welcome',
  'welcome1',
  'welcome123',
  'moneytracker',
  'moneytracker123',
  'letmein',
  'letmein123',
  'iloveyou',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'master',
  'shadow',
  'superman',
  'trustno1',
  'secret',
  'secret123',
  '111111',
  '000000',
  '123123',
  '123321',
  'sunshine',
  'princess',
  'charlie',
]);

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 (empty) to 4 (strong)
  strengthLabel: 'Very Weak' | 'Weak' | 'Medium' | 'Strong';
  error?: string;
  isBlacklisted?: boolean;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || typeof password !== 'string' || password.length === 0) {
    return {
      isValid: false,
      score: 0,
      strengthLabel: 'Very Weak',
      error: 'Please enter a password',
    };
  }

  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalized)) {
    return {
      isValid: false,
      score: 1,
      strengthLabel: 'Very Weak',
      error: 'This password is too common and easily guessed. Please choose a stronger password.',
      isBlacklisted: true,
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      score: 1,
      strengthLabel: 'Weak',
      error: 'Password must be at least 8 characters long',
    };
  }

  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (!hasDigit && !hasSpecial) {
    return {
      isValid: false,
      score: 2,
      strengthLabel: 'Weak',
      error: 'Password must contain at least one number or special character',
    };
  }

  // Calculate score between 2 and 4
  let score = 2;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  if (password.length >= 10 && (hasDigit || hasSpecial)) {
    score += 1;
  }
  if (password.length >= 12 && hasLower && hasUpper && hasDigit && hasSpecial) {
    score = 4;
  } else if (password.length >= 8 && hasLower && hasUpper && (hasDigit || hasSpecial) && score < 4) {
    score = Math.min(4, score + 1);
  }

  const strengthLabel = score >= 4 ? 'Strong' : score >= 3 ? 'Medium' : 'Weak';

  return {
    isValid: true,
    score,
    strengthLabel,
  };
}
