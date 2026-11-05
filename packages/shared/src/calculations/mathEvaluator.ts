export interface MathEvaluationResult {
  isValid: boolean;
  result: number | null;
  error?: string;
}

/**
 * Checks if the string contains arithmetic operators indicating a math expression.
 * Returns true if +, -, *, /, x, X, or parentheses are present.
 */
export function containsMathExpression(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return /[+\-*xX/()]/.test(input);
}

/**
 * Safely evaluates an arithmetic expression without using eval().
 * Supports:
 * - Numbers with commas and decimals (e.g. "1,250.50")
 * - Addition (+), Subtraction (-)
 * - Multiplication (*, x, X), Division (/)
 * - Parentheses ( )
 * - Operator precedence (multiplication and division before addition and subtraction)
 * - Safe rounding to 2 decimal places for financial calculations
 */
export function evaluateMathExpression(input: string): MathEvaluationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, result: null, error: 'Empty expression' };
  }

  // Pre-clean: replace x and X with *
  const sanitized = input.replace(/[xX]/g, '*').trim();
  if (!sanitized) {
    return { isValid: false, result: null, error: 'Empty expression' };
  }

  // Check for invalid characters (only digits, ., ,, +, -, *, /, (, ), and spaces are allowed)
  if (/[^0-9.,+\-*/()\s]/.test(sanitized)) {
    return { isValid: false, result: null, error: 'Invalid characters in expression' };
  }

  // Tokenize
  const tokens: Array<{ type: 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN'; value: string | number }> = [];
  let i = 0;
  while (i < sanitized.length) {
    const ch = sanitized[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    // Number (digits, commas, decimal point)
    if (/[0-9.,]/.test(ch)) {
      let numStr = '';
      while (i < sanitized.length && /[0-9.,]/.test(sanitized[i])) {
        if (sanitized[i] !== ',') {
          numStr += sanitized[i];
        }
        i++;
      }
      const num = parseFloat(numStr);
      if (isNaN(num)) {
        return { isValid: false, result: null, error: `Invalid number: ${numStr}` };
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    return { isValid: false, result: null, error: `Unexpected character: ${ch}` };
  }

  if (tokens.length === 0) {
    return { isValid: false, result: null, error: 'Empty expression' };
  }

  // Recursive descent parser
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume() {
    return tokens[pos++];
  }

  function parseExpression(): number {
    let left = parseTerm();

    while (pos < tokens.length) {
      const token = peek();
      if (token && token.type === 'OP' && (token.value === '+' || token.value === '-')) {
        consume();
        const right = parseTerm();
        if (token.value === '+') {
          left = left + right;
        } else {
          left = left - right;
        }
      } else {
        break;
      }
    }

    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();

    while (pos < tokens.length) {
      const token = peek();
      if (token && token.type === 'OP' && (token.value === '*' || token.value === '/')) {
        consume();
        const right = parseFactor();
        if (token.value === '*') {
          left = left * right;
        } else {
          if (right === 0) {
            throw new Error('Division by zero');
          }
          left = left / right;
        }
      } else {
        break;
      }
    }

    return left;
  }

  function parseFactor(): number {
    const token = peek();
    if (!token) {
      throw new Error('Incomplete expression');
    }

    // Unary plus or minus
    if (token.type === 'OP' && (token.value === '+' || token.value === '-')) {
      consume();
      const factor = parseFactor();
      return token.value === '-' ? -factor : factor;
    }

    if (token.type === 'NUMBER') {
      consume();
      return token.value as number;
    }

    if (token.type === 'LPAREN') {
      consume();
      const val = parseExpression();
      const close = peek();
      if (!close || close.type !== 'RPAREN') {
        throw new Error('Missing closing parenthesis');
      }
      consume();
      return val;
    }

    throw new Error('Please check calculation format');
  }

  try {
    const value = parseExpression();
    if (pos < tokens.length) {
      return { isValid: false, result: null, error: 'Please check calculation format' };
    }
    if (!isFinite(value) || isNaN(value)) {
      return { isValid: false, result: null, error: 'Calculation resulted in an invalid number' };
    }
    // Round to 2 decimal places to eliminate floating point issues (e.g. 0.1 + 0.2 = 0.3)
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return { isValid: true, result: rounded };
  } catch (err: any) {
    return { isValid: false, result: null, error: err.message || 'Calculation error' };
  }
}
