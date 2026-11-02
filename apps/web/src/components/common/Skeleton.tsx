import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'chip' | 'btn' | 'card' | 'full';
}

export function Skeleton({
  width,
  height,
  rounded = 'btn',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const roundedClass = {
    chip: 'rounded-chip',
    btn: 'rounded-btn',
    card: 'rounded-card',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`relative overflow-hidden bg-surface-2 ${roundedClass} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 bg-surface border border-line rounded-card space-y-4 shadow-warm-1 ${className}`}>
      <Skeleton width="40%" height={16} />
      <Skeleton width="70%" height={32} />
      <Skeleton width="50%" height={12} />
    </div>
  );
}

export function SkeletonTableRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-between p-4 bg-surface border-b border-line gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton width={36} height={36} rounded="full" />
        <div className="space-y-1.5">
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <Skeleton width={90} height={20} />
    </div>
  );
}
