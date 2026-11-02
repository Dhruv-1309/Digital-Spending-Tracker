import React, { useRef, useLayoutEffect, useState } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

/**
 * Spinner for Button loading state.
 */
function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/**
 * Button Primitive (SPEC Section 4 & 5)
 * Variants: primary, secondary, ghost, danger.
 * Sizes: md (40px) and lg (44px).
 * Features: width-locking loading state, 45% opacity disabled state,
 * hover elevation and active press animations.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [lockedWidth, setLockedWidth] = useState<number | undefined>(undefined);

  // Lock the button width before transitioning to loading so it never resizes
  useLayoutEffect(() => {
    if (loading && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setLockedWidth(rect.width);
      }
    } else if (!loading) {
      setLockedWidth(undefined);
    }
  }, [loading]);

  const isDisabled = disabled || loading;

  // Base styles
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium font-sans select-none rounded-btn transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2';

  // Hover and active motion: disabled when isDisabled is true
  const motionStyles = isDisabled
    ? 'opacity-45 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer active:scale-[0.98] active:duration-75 [@media(hover:hover)]:hover:-translate-y-[1px] [@media(hover:hover)]:hover:shadow-2';

  // Variant styles
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-accent text-white border border-transparent shadow-1 [@media(hover:hover)]:hover:bg-accent/95',
    secondary:
      'bg-surface text-ink border border-line-strong shadow-1 [@media(hover:hover)]:hover:bg-surface-2',
    ghost:
      'bg-transparent text-ink border border-transparent [@media(hover:hover)]:hover:bg-surface-2',
    danger:
      'bg-danger text-white border border-transparent shadow-1 [@media(hover:hover)]:hover:bg-danger/90',
  };

  // Size styles: md is 40px (h-10), lg is 44px (h-11)
  const sizeStyles: Record<ButtonSize, string> = {
    md: 'h-10 px-4 text-sm gap-2 min-w-[40px]',
    lg: 'h-11 px-5 text-base gap-2.5 min-w-[44px]',
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={isDisabled}
      aria-busy={loading}
      style={{
        ...(lockedWidth !== undefined ? { width: `${lockedWidth}px`, minWidth: `${lockedWidth}px` } : {}),
        ...style,
      }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${motionStyles} ${className}`}
      {...props}
    >
      {/* Loading spinner overlay */}
      {loading && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-label="Loading"
        >
          <ButtonSpinner className={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-ink'} />
        </span>
      )}

      {/* Content wrapper: hidden visually when loading but preserves natural width */}
      <span
        className={`inline-flex items-center justify-center gap-2 ${loading ? 'invisible pointer-events-none' : 'visible'}`}
      >
        {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
      </span>
    </button>
  );
}

export default Button;
