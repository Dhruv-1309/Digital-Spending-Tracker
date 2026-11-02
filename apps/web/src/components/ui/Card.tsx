import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Card Primitive (SPEC Section 4 & 5)
 * Surface background, 1px line border, 16px radius (rounded-card), shadow-1.
 * Only interactive cards receive hover motion:
 * border to line-strong, translateY(-2px), shadow-1 -> shadow-2 (200ms).
 */
export function Card({
  interactive = false,
  children,
  className = '',
  onClick,
  ...props
}: CardProps) {
  const isClickable = interactive || Boolean(onClick);

  const baseStyles = 'bg-surface border border-line rounded-card shadow-1 p-5 transition-[border-color,box-shadow,transform] duration-base';
  const interactiveStyles = isClickable
    ? 'cursor-pointer [@media(hover:hover)]:hover:border-line-strong [@media(hover:hover)]:hover:-translate-y-[2px] [@media(hover:hover)]:hover:shadow-2 active:scale-[0.99] active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
    : '';

  return (
    <div
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      onClick={onClick}
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
