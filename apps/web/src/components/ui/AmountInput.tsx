import React, { forwardRef, useMemo } from 'react';
import { formatIndianGrouping, parseIndianGrouping } from './formatIndianGrouping';
import { containsMathExpression, evaluateMathExpression } from '@moneytracker/shared';

export interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onChange: (formattedValue: string, numericValue: number) => void;
  label?: string;
  error?: string;
  hasError?: boolean;
  helperText?: string;
  containerClassName?: string;
}

/**
 * AmountInput Primitive (SPEC Section 3 & 5)
 * 20px typography, ₹ prefix, live Indian grouping as you type (1,25,000),
 * in-line arithmetic calculator (supports +, -, *, /, x, X, and parentheses with live preview badge),
 * tabular figures, and accepts pasted values with or without commas/math expressions.
 */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  {
    value,
    onChange,
    label,
    error,
    hasError = false,
    helperText,
    id,
    disabled = false,
    className = '',
    containerClassName = '',
    placeholder = '0',
    onBlur,
    onKeyDown,
    ...props
  },
  ref
) {
  const isInvalid = Boolean(error) || hasError;
  const inputId = id || (label ? `amount-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;

  const valueStr = value !== undefined && value !== null ? String(value) : '';
  const isMathExpr = containsMathExpression(valueStr);

  // If typing an arithmetic expression, don't strip operators with formatIndianGrouping
  const displayValue = isMathExpr ? valueStr : formatIndianGrouping(value);

  // Live evaluation of math expression for badge preview
  const mathResult = useMemo(() => {
    if (!isMathExpr) return null;
    return evaluateMathExpression(valueStr);
  }, [isMathExpr, valueStr]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, dots, commas, math operators (+, -, *, /, x, X, (, )), and spaces
    const cleaned = raw.replace(/[^0-9.,+\-*/xX()\s]/g, '');

    if (containsMathExpression(cleaned)) {
      const evalRes = evaluateMathExpression(cleaned);
      if (evalRes.isValid && evalRes.result !== null) {
        // Report both raw expression for typing and resolved numeric value in real-time
        onChange(cleaned, evalRes.result);
      } else {
        onChange(cleaned, 0);
      }
    } else {
      const formatted = formatIndianGrouping(cleaned);
      const numeric = parseIndianGrouping(formatted);
      onChange(formatted, numeric);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleaned = pastedText.replace(/[^0-9.,+\-*/xX()\s]/g, '');

    if (containsMathExpression(cleaned)) {
      const evalRes = evaluateMathExpression(cleaned);
      if (evalRes.isValid && evalRes.result !== null) {
        onChange(cleaned, evalRes.result);
      } else {
        onChange(cleaned, 0);
      }
    } else {
      const formatted = formatIndianGrouping(cleaned);
      const numeric = parseIndianGrouping(formatted);
      onChange(formatted, numeric);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // When leaving the field, if there is a valid math expression, resolve it to final formatted amount
    if (containsMathExpression(valueStr)) {
      const evalRes = evaluateMathExpression(valueStr);
      if (evalRes.isValid && evalRes.result !== null && evalRes.result >= 0) {
        const formatted = formatIndianGrouping(evalRes.result);
        onChange(formatted, evalRes.result);
      }
    }
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Pressing '=' or 'Enter' resolves the expression immediately
    if (e.key === '=' || (e.key === 'Enter' && containsMathExpression(valueStr))) {
      if (containsMathExpression(valueStr)) {
        const evalRes = evaluateMathExpression(valueStr);
        if (evalRes.isValid && evalRes.result !== null && evalRes.result >= 0) {
          e.preventDefault();
          const formatted = formatIndianGrouping(evalRes.result);
          onChange(formatted, evalRes.result);
          return;
        }
      }
    }
    onKeyDown?.(e);
  };

  const borderStyles = isInvalid
    ? 'border-danger focus:border-danger focus:ring-danger'
    : 'border-line-strong hover:border-ink-2 focus:border-accent focus:ring-accent';

  // Make room for the preview badge if an evaluated result is present
  const rightPadding = mathResult?.isValid ? 'pr-28' : 'pr-3.5';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-danger text-xs">*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center w-full transition-transform ${isInvalid ? 'animate-shake' : ''}`}
      >
        <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-2 font-display text-xl select-none">
          ₹
        </div>

        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="text"
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-invalid={isInvalid}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 w-full rounded-btn bg-surface pl-9 ${rightPadding} text-[20px] font-semibold text-ink placeholder:text-ink-3 tabular-nums border transition-[border-color,box-shadow,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-surface-2 ${borderStyles} ${className}`}
          {...props}
        />

        {/* Live Calculation Preview Badge */}
        {mathResult?.isValid && mathResult.result !== null && (
          <div
            data-testid="math-preview-badge"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-semibold text-primary tabular-nums"
            title="Calculated Total"
          >
            <span className="text-primary/70 font-mono text-[11px]">=</span>
            <span>₹{formatIndianGrouping(mathResult.result)}</span>
          </div>
        )}
      </div>

      {error ? (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-danger font-medium transition-opacity duration-fast"
        >
          {error}
        </span>
      ) : helperText ? (
        <span className="text-xs text-ink-3">{helperText}</span>
      ) : isMathExpr && mathResult?.isValid ? (
        <span className="text-[11px] text-ink-3">Press Enter or = to apply calculation</span>
      ) : null}
    </div>
  );
});

export default AmountInput;
