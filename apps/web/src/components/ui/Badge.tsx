import React from 'react';
import { getCategoryBadgeColor, type CategoryPalette } from './categoryColors';

export type BadgeVariant = 'category' | 'income' | 'warning' | 'danger' | 'neutral' | 'accent';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  category?: string;
  variant?: BadgeVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Badge Primitive (SPEC Section 3 & 5)
 * Pill shape, 12 px text, with category-hash color assignment or system variants.
 */
export function Badge({
  category,
  variant = 'category',
  children,
  icon,
  className = '',
  style,
  ...props
}: BadgeProps) {
  let badgeStyle: React.CSSProperties = {};

  if (category || variant === 'category') {
    const palette: CategoryPalette = getCategoryBadgeColor(
      category || (typeof children === 'string' ? children : '')
    );
    badgeStyle = {
      backgroundColor: palette.tint,
      color: palette.ink,
      ...style,
    };
  } else if (variant === 'income') {
    badgeStyle = {
      backgroundColor: 'var(--income-tint)',
      color: 'var(--income)',
      ...style,
    };
  } else if (variant === 'warning') {
    badgeStyle = {
      backgroundColor: 'var(--warning-tint)',
      color: 'var(--warning)',
      ...style,
    };
  } else if (variant === 'danger') {
    badgeStyle = {
      backgroundColor: 'var(--danger-tint)',
      color: 'var(--danger)',
      ...style,
    };
  } else if (variant === 'accent') {
    badgeStyle = {
      backgroundColor: 'var(--accent-tint)',
      color: 'var(--accent)',
      ...style,
    };
  } else {
    // neutral
    badgeStyle = {
      backgroundColor: 'var(--surface-2)',
      color: 'var(--ink-2)',
      ...style,
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-medium tracking-tight whitespace-nowrap transition-colors duration-fast ${className}`}
      style={badgeStyle}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children ?? category}</span>
    </span>
  );
}

export default Badge;
