import React from 'react';
import { RefreshCwIcon } from './icons';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium font-sans select-none rounded-btn transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2';

    const sizeClasses = {
      sm: 'h-8 px-3 text-caption gap-1.5',
      md: 'h-10 sm:h-10 max-sm:h-11 px-4 text-body-sm gap-2',
      lg: 'h-12 px-6 text-body gap-2.5',
    }[size];

    const variantClasses = {
      primary:
        'bg-accent text-white border border-transparent interactive-btn disabled:bg-accent/45 disabled:text-white/80 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
      secondary:
        'bg-surface text-ink border border-line-strong interactive-btn hover:border-ink hover:bg-surface-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
      ghost:
        'bg-transparent text-ink border border-transparent hover:bg-surface-2 active:bg-surface-2/80 disabled:opacity-45 disabled:cursor-not-allowed',
      danger:
        'bg-danger text-white border border-transparent interactive-btn hover:bg-danger/90 disabled:bg-danger/45 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    }[variant];

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <RefreshCwIcon size={size === 'sm' ? 14 : 16} className="animate-spin" />
            <span className="opacity-80">Loading...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
