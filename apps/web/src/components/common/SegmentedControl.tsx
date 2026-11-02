import React, { useRef, useEffect, useState } from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const activeIndex = options.findIndex((opt) => opt.value === value);

  useEffect(() => {
    if (containerRef.current && activeIndex !== -1) {
      const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-segment]');
      const activeButton = buttons[activeIndex];
      if (activeButton) {
        setIndicatorStyle({
          left: activeButton.offsetLeft,
          width: activeButton.offsetWidth,
        });
      }
    }
  }, [activeIndex, options]);

  const heightClass = size === 'sm' ? 'h-8 p-0.5' : 'h-10 p-1';
  const textClass = size === 'sm' ? 'text-caption py-1 px-3' : 'text-body-sm py-1.5 px-4';

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative inline-flex items-center bg-surface-2 border border-line rounded-btn ${heightClass} ${className}`}
    >
      {/* Sliding Active Pill */}
      {indicatorStyle.width > 0 && (
        <div
          className="absolute top-1 bottom-1 bg-surface rounded-[8px] shadow-warm-1 transition-all duration-base ease-standard pointer-events-none"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
            left: 0,
          }}
        />
      )}

      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            data-segment={opt.value}
            role="tab"
            aria-selected={isSelected}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 font-medium transition-colors duration-fast rounded-[8px] select-none ${textClass} ${
              isSelected ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {opt.icon && <span className="inline-flex shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
