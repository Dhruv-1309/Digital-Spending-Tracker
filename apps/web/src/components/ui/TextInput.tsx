import React, { forwardRef } from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hasError?: boolean;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  containerClassName?: string;
  showCharCount?: boolean;
}

/**
 * TextInput Primitive (SPEC Section 4 & 5)
 * Label above the field (never floating), 44px tall, radius 10,
 * line-strong border, focus ring, and danger border with shake on error.
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    error,
    hasError = false,
    helperText,
    leftAddon,
    rightAddon,
    id,
    disabled = false,
    className = '',
    containerClassName = '',
    showCharCount = false,
    onBlur,
    onChange,
    ...props
  },
  ref
) {
  const isInvalid = Boolean(error) || hasError;
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const currentLength = typeof props.value === 'string' ? props.value.length : 0;

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
        {leftAddon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-3">
            {leftAddon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={isInvalid}
          aria-describedby={error ? errorId : undefined}
          onBlur={onBlur}
          onChange={onChange}
          className={`h-[44px] w-full rounded-btn bg-surface px-3.5 text-sm font-sans text-ink placeholder:text-ink-3 border transition-[border-color,box-shadow,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-surface-2 ${borderStyles} ${
            leftAddon ? 'pl-10' : ''
          } ${rightAddon ? 'pr-10' : ''} ${className}`}
          {...props}
        />

        {rightAddon && (
          <div className="absolute right-3.5 flex items-center text-ink-3">
            {rightAddon}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between min-h-[16px]">
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
        ) : (
          <span />
        )}

        {props.maxLength && (showCharCount || currentLength >= props.maxLength * 0.8) && (
          <span
            className={`text-xs font-mono ml-auto ${
              currentLength >= props.maxLength ? 'text-danger font-semibold' : 'text-ink-3'
            }`}
            data-testid="char-count"
          >
            {currentLength}/{props.maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

export default TextInput;
