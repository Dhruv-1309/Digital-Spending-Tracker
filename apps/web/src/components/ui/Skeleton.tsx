import React from 'react';

export type SkeletonVariant = 'text' | 'rectangular' | 'circular' | 'card';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Skeleton Primitive (SPEC Section 4 & 5)
 * Surface-2 blocks matching the final layout size with a warm shimmer sweep (1.4s linear).
 * Shimmer is disabled under prefers-reduced-motion.
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  let variantStyles = 'rounded-btn';
  if (variant === 'circular') {
    variantStyles = 'rounded-full shrink-0';
  } else if (variant === 'text') {
    variantStyles = 'rounded-chip h-4 my-1 w-full';
  } else if (variant === 'card') {
    variantStyles = 'rounded-card h-32 w-full p-4 border border-line';
  }

  const customStyle: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      role="status"
      aria-label="Loading content"
      style={customStyle}
      className={`animate-shimmer ${variantStyles} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
