import React, { forwardRef } from 'react';
import { formatIndianGrouping, parseIndianGrouping } from './formatIndianGrouping';

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
 * inputmode decimal, tabular figures, and accepts pasted values with or without commas.
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
    ...props
  },
  ref
) {
  const isInvalid = Boolean(error) || hasError;
  const inputId = id || (label ? `amount-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;

  const displayValue = formatIndianGrouping(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^\d.,]/g, '');
    const formatted = formatIndianGrouping(cleaned);
    const numeric = parseIndianGrouping(formatted);
    onChange(formatted, numeric);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleaned = pastedText.replace(/[^\d.,]/g, '');
    const formatted = formatIndianGrouping(cleaned);
    const numeric = parseIndianGrouping(formatted);
    onChange(formatted, numeric);
  };

  const borderStyles = isInvalid
    ? 'border-danger focus:border-danger focus:ring-danger'
    : 'border-line-strong hover:border-ink-2 focus:border-accent focus:ring-accent';

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
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          aria-invalid={isInvalid}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 w-full rounded-btn bg-surface pl-9 pr-3.5 text-[20px] font-semibold text-ink placeholder:text-ink-3 tabular-nums border transition-[border-color,box-shadow,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-surface-2 ${borderStyles} ${className}`}
          {...props}
        />
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
      ) : null}
    </div>
  );
});

export default AmountInput;
