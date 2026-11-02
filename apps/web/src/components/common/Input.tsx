import React, { useState } from 'react';

function formatIndianGrouping(val: string): string {
  const clean = val.replace(/[^\d.]/g, '');
  const parts = clean.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1].slice(0, 2)}` : '';

  if (!integerPart) return decimalPart ? `0${decimalPart}` : '';

  const lastThree = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);
  if (otherDigits !== '') {
    integerPart = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  return integerPart + decimalPart;
}

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      hint,
      id,
      className = '',
      leftAddon,
      rightAddon,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [touched, setTouched] = useState(false);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
    };

    const hasError = Boolean(error);
    const shouldShake = hasError && touched;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-caption font-medium text-ink-2 select-none">
            {label}
          </label>
        )}
        <div
          className={`relative flex items-center h-11 w-full bg-surface border rounded-btn transition-colors ${
            hasError
              ? 'border-danger focus-within:border-danger'
              : 'border-line-strong hover:border-line-strong/80 focus-within:border-accent'
          } ${shouldShake ? 'animate-shake' : ''}`}
        >
          {leftAddon && <div className="pl-3.5 pr-1 flex items-center text-ink-3">{leftAddon}</div>}
          <input
            ref={ref}
            id={id}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`w-full h-full px-3.5 bg-transparent text-body-sm text-ink placeholder:text-ink-3 outline-none disabled:bg-surface-2 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightAddon && <div className="pr-3.5 pl-1 flex items-center text-ink-3">{rightAddon}</div>}
        </div>
        {hasError ? (
          <span className="text-caption text-danger font-normal">{error}</span>
        ) : hint ? (
          <span className="text-caption text-ink-3 font-normal">{hint}</span>
        ) : null}
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';

export interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number | string) => void;
  label?: string;
  error?: string;
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, label, error, id, className = '', ...props }, ref) => {
    const displayVal = value !== '' && value !== undefined && value !== null
      ? formatIndianGrouping(String(value))
      : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const formatted = formatIndianGrouping(raw);
      const numeric = parseFloat(formatted.replace(/,/g, ''));
      onChange(isNaN(numeric) ? '' : numeric);
    };

    const hasError = Boolean(error);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-caption font-medium text-ink-2 select-none">
            {label}
          </label>
        )}
        <div
          className={`relative flex items-center h-14 w-full bg-surface border rounded-btn transition-colors px-4 ${
            hasError
              ? 'border-danger focus-within:border-danger'
              : 'border-line-strong hover:border-line-strong/80 focus-within:border-accent'
          }`}
        >
          <span className="text-section-title font-display font-semibold text-ink-2 mr-2 select-none">
            ₹
          </span>
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={displayVal}
            onChange={handleChange}
            className={`w-full h-full bg-transparent text-section-title font-display font-semibold text-ink placeholder:text-ink-3 outline-none tabular-nums ${className}`}
            {...props}
          />
        </div>
        {hasError && <span className="text-caption text-danger font-normal">{error}</span>}
      </div>
    );
  },
);

AmountInput.displayName = 'AmountInput';
