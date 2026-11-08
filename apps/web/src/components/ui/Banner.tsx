import React from 'react';
import { AlertTriangleIcon, AlertCircleIcon, InfoIcon, CheckCircleIcon, XIcon } from '../icons';

export type BannerVariant = 'warning' | 'danger' | 'info' | 'success';

export interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  message: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<
  BannerVariant,
  { bg: string; border: string; text: string; defaultIcon: React.ReactNode }
> = {
  warning: {
    bg: 'bg-warning-tint',
    border: 'border-l-warning',
    text: 'text-warning',
    defaultIcon: <AlertTriangleIcon size={18} className="text-warning shrink-0" />,
  },
  danger: {
    bg: 'bg-danger-tint',
    border: 'border-l-danger',
    text: 'text-danger',
    defaultIcon: <AlertCircleIcon size={18} className="text-danger shrink-0" />,
  },
  info: {
    bg: 'bg-accent-tint',
    border: 'border-l-accent',
    text: 'text-accent',
    defaultIcon: <InfoIcon size={18} className="text-accent shrink-0" />,
  },
  success: {
    bg: 'bg-income-tint',
    border: 'border-l-income',
    text: 'text-income',
    defaultIcon: <CheckCircleIcon size={18} className="text-income shrink-0" />,
  },
};

/**
 * Banner Primitive (SPEC Section 4 & 5)
 * Surface tint, 4px solid accent left edge, message, and action buttons.
 * Used for Anomaly Banner and System alerts.
 */
export function Banner({
  variant = 'warning',
  title,
  message,
  icon,
  actions,
  onDismiss,
  className = '',
}: BannerProps) {
  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`relative w-full rounded-btn border-l-4 p-4 shadow-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${current.bg} ${current.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon || current.defaultIcon}</span>
        <div className="flex flex-col gap-0.5 text-sm font-sans text-ink">
          {title && <span className="font-semibold">{title}</span>}
          <div className="text-ink-2">{message}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {actions}
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={onDismiss}
            className="p-1 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2/60 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <XIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Banner;
