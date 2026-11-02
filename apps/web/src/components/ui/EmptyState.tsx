import React from 'react';
import emptyShapeUrl from '../../assets/art/empty-shape.svg';

export interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Default Warm Palette SVG Illustration using empty-shape.svg
 */
function DefaultWarmIllustration() {
  return (
    <img
      src={emptyShapeUrl}
      alt=""
      width="120"
      height="120"
      className="w-28 h-28 object-contain"
      aria-hidden="true"
    />
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
