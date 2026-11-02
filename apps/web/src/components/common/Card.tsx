import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
}

export function Card({ children, isInteractive = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-surface border border-line rounded-card shadow-warm-1 overflow-hidden ${
        isInteractive ? 'interactive-card cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MetricCardProps {
  label: string;
  figure: string | number;
  delta?: {
    text: string;
    type?: 'income' | 'danger' | 'neutral';
  };
  secondaryText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  figure,
  delta,
  secondaryText,
  icon,
  className = '',
}: MetricCardProps) {
  return (
    <Card className={`p-6 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-body-sm font-medium text-ink-2">{label}</span>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-display text-page-title font-semibold text-ink tabular-nums">
          {figure}
        </span>
        {delta && (
          <span
            className={`px-2 py-0.5 rounded-chip text-caption font-medium tabular-nums ${
              delta.type === 'income'
                ? 'bg-income-tint text-income'
                : delta.type === 'danger'
                ? 'bg-danger-tint text-danger'
                : 'bg-surface-2 text-ink-2'
            }`}
          >
            {delta.text}
          </span>
        )}
      </div>

      {secondaryText && <p className="mt-2 text-caption text-ink-3">{secondaryText}</p>}
    </Card>
  );
}
