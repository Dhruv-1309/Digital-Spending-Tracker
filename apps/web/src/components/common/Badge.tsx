import React from 'react';

const CATEGORY_PALETTE = [
  { name: 'terracotta', bg: '#F3DCD2', ink: '#8A3A1F' },
  { name: 'olive', bg: '#E8EBCF', ink: '#55601A' },
  { name: 'teal', bg: '#D7ECE9', ink: '#1E5F58' },
  { name: 'rose', bg: '#F5DCE3', ink: '#8A2A47' },
  { name: 'sand', bg: '#EFE3CB', ink: '#7A5A12' },
  { name: 'sky', bg: '#DCE8F5', ink: '#245A8C' },
  { name: 'moss', bg: '#DDEBD9', ink: '#2F6A32' },
  { name: 'slate', bg: '#E3E6EA', ink: '#3C4654' },
];

function getCategoryColor(categoryName: string) {
  if (!categoryName) return CATEGORY_PALETTE[7];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = (hash << 5) - hash + categoryName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
}

export interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const { bg, ink } = getCategoryColor(category);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium tracking-wide select-none ${className}`}
      style={{ backgroundColor: bg, color: ink }}
    >
      {category}
    </span>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'income' | 'warning' | 'danger';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const variantStyles = {
    neutral: 'bg-surface-2 text-ink-2 border border-line',
    accent: 'bg-accent-tint text-accent border border-accent/20',
    income: 'bg-income-tint text-income border border-income/20',
    warning: 'bg-warning-tint text-warning border border-warning/20',
    danger: 'bg-danger-tint text-danger border border-danger/20',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium select-none ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}
