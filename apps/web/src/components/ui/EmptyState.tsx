import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Default Warm Palette SVG Illustration
 */
function DefaultWarmIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-ink-3"
    >
      <circle cx="60" cy="60" r="50" fill="var(--surface-2)" />
      <path
        d="M40 70C40 58.9543 48.9543 50 60 50C71.0457 50 80 58.9543 80 70H40Z"
        fill="var(--accent-tint)"
      />
      <circle cx="60" cy="42" r="10" fill="var(--line-strong)" />
      <rect x="48" y="74" width="24" height="4" rx="2" fill="var(--line)" />
    </svg>
  );
}

/**
 * EmptyState Primitive (SPEC Section 5)
 * Slot for warm palette SVG illustration, clear headline, single explanatory sentence,
 * and primary action button (e.g. "Add your first transaction").
 */
export function EmptyState({
  title,
  description,
  illustration,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-card bg-surface border border-line shadow-1 max-w-lg mx-auto ${className}`}
    >
      <div className="mb-5 flex items-center justify-center">
        {illustration || <DefaultWarmIllustration />}
      </div>

      <h3 className="font-display text-lg sm:text-xl font-semibold text-ink mb-1.5">
        {title}
      </h3>

      <p className="text-sm text-ink-2 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action && <div className="inline-flex items-center justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
