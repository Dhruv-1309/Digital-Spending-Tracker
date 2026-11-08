import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  children?: React.ReactNode;
}

export function Icon({
  size = 20,
  strokeWidth = 2,
  className = '',
  children,
  'aria-hidden': ariaHidden = true,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export default Icon;
