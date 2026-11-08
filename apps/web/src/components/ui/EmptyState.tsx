import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Default Warm Palette SVG Illustration (Haikei fluid geometry)
 * Rendered inline to guarantee zero broken images, zero network lag, and instant rendering.
 */
function DefaultWarmIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="none"
      width="120"
      height="120"
      className="w-28 h-28 object-contain"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="empty-state-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6EBFB" />
          <stop offset="100%" stopColor="#F3EEE6" />
        </linearGradient>
      </defs>
      {/* Background organic blob */}
      <path
        d="M100 25C145 25 178 58 178 100C178 142 143 175 100 175C57 175 22 142 22 100C22 58 55 25 100 25Z"
        fill="#F3EEE6"
      />
      {/* Layered fluid shape */}
      <path
        d="M110 40C150 48 165 80 160 115C155 150 125 165 95 160C65 155 40 130 45 95C50 60 70 32 110 40Z"
        fill="url(#empty-state-grad)"
      />
      {/* Central surface circle */}
      <circle cx="100" cy="100" r="32" fill="#FFFFFF" stroke="#E6DFD3" strokeWidth="2" />
      {/* Geometric emblem in accent tint */}
      <rect
        x="88"
        y="88"
        width="24"
        height="24"
        rx="6"
        fill="#2A4FD6"
        fillOpacity="0.12"
        stroke="#2A4FD6"
        strokeWidth="2"
      />
      <path
        d="M96 100H104M100 96V104"
        stroke="#2A4FD6"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
