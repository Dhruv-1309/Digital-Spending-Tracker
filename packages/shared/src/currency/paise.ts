/**
 * MoneyTracker Currency & Paise Utilities
 * v3.0 represents all money as integer paise (1 Rupee = 100 Paise)
 * to eliminate floating-point rounding errors.
 */

export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || !isFinite(rupees)) {
    return 0;
  }
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number | bigint): number {
  const p = typeof paise === 'bigint' ? Number(paise) : paise;
  if (isNaN(p) || !isFinite(p)) {
    return 0;
  }
  return p / 100;
}

/**
 * Format an integer paise amount into Indian Rupee string: e.g. ₹1,23,456 or ₹1,23,456.50
 */
export function formatPaise(paise: number | bigint, options?: { showFraction?: boolean }): string {
  const rupees = paiseToRupees(paise);
  const isNegative = rupees < 0;
  const absVal = Math.abs(rupees);
  const showFraction = options?.showFraction ?? (absVal % 1 !== 0);

  const parts = absVal.toFixed(showFraction ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian Numbering System: last 3 digits, then groups of 2 digits
  if (integerPart.length > 3) {
    const last3 = integerPart.substring(integerPart.length - 3);
    const rest = integerPart.substring(0, integerPart.length - 3);
    integerPart = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }

  const formatted = showFraction && decimalPart !== undefined
    ? `${integerPart}.${decimalPart}`
    : integerPart;

  return `${isNegative ? '-' : ''}₹${formatted}`;
}
