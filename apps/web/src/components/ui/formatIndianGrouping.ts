/**
 * Indian Numbering System Digit Grouping Utilities (SPEC Section 3 & 5)
 * Groups figures as 1,25,000 (last 3 digits, then every 2 digits).
 */

/**
 * Formats a number or string into the Indian numbering system digit grouping:
 * e.g. 125000 -> "1,25,000", 12345678 -> "1,23,45,678"
 * Preserves decimal points and decimals if present.
 * Accepts input with or without commas (e.g. pasted "1,25,000" or "125000").
 */
export function formatIndianGrouping(value: string | number): string {
  if (value === '' || value === null || value === undefined) return '';

  const str = String(value).trim();
  if (str === '') return '';

  // Remove existing commas
  const clean = str.replace(/,/g, '');

  // Handle optional leading negative sign
  const isNegative = clean.startsWith('-');
  const unsigned = isNegative ? clean.slice(1) : clean;

  // Split integer and decimal parts
  const parts = unsigned.split('.');
  const integerPart = parts[0].replace(/\D/g, '');
  const decimalPart = parts.length > 1 ? parts.slice(1).join('').replace(/\D/g, '') : null;
  const hasTrailingDot = parts.length > 1 && decimalPart === '';

  if (integerPart === '' && decimalPart === null && !hasTrailingDot) {
    return isNegative ? '-' : '';
  }

  // Format integer part with Indian grouping (3 digits at end, then groups of 2)
  let formattedInteger = '';
  if (integerPart.length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.slice(-3);
    const remaining = integerPart.slice(0, -3);
    const groupedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInteger = `${groupedRemaining},${lastThree}`;
  }

  // If input was just a dot or had no integer part before dot
  if (formattedInteger === '' && (decimalPart !== null || hasTrailingDot)) {
    formattedInteger = '0';
  }

  let result = (isNegative ? '-' : '') + formattedInteger;
  if (hasTrailingDot) {
    result += '.';
  } else if (decimalPart !== null) {
    result += `.${decimalPart}`;
  }

  return result;
}

/**
 * Parses an Indian-grouped string into a clean numeric number.
 * Returns 0 if invalid or empty.
 */
export function parseIndianGrouping(value: string | number): number {
  if (value === '' || value === null || value === undefined) return 0;
  const clean = String(value).replace(/,/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
