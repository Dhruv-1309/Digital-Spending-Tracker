import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

/**
 * SegmentedControl Primitive (SPEC Section 4 & 5)
 * Sliding indicator via translateX (200ms standard ease),
 * arrow-key navigation, role="radiogroup", and accessible focus rings.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  disabled = false,
  className = '',
  id,
  name,
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; height: number }>({
    left: 0,
    width: 0,
    height: 0,
  });
  // Update sliding indicator position
  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
      });
    }
  }, [value]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0) return;

    const currentIndex = options.findIndex((opt) => opt.value === value);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = options.length - 1;
    }

    if (nextIndex !== currentIndex && options[nextIndex]) {
      const nextVal = options[nextIndex].value;
      onChange(nextVal);

      // Focus the newly active button
      setTimeout(() => {
        const nextEl = containerRef.current?.querySelector<HTMLButtonElement>(`[data-value="${nextVal}"]`);
        nextEl?.focus();
      }, 0);
    }
  };

  const heightClass = size === 'sm' ? 'h-9 p-0.5' : 'h-11 p-1';
  const textClass = size === 'sm' ? 'text-xs px-3' : 'text-sm px-4';

  return (
    <div
      ref={containerRef}
      id={id}
      role="radiogroup"
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center bg-surface-2 rounded-btn select-none border border-line ${heightClass} ${
        disabled ? 'opacity-45 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Sliding indicator */}
      {indicatorStyle.width > 0 && (
        <div
          aria-hidden="true"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            transitionProperty: 'transform, width',
            transitionDuration: 'var(--dur-base)',
            transitionTimingFunction: 'var(--ease-standard)',
          }}
          className="absolute top-1 bottom-1 left-0 rounded-btn bg-surface shadow-1 border border-line-strong/40 pointer-events-none"
        />
      )}

      {/* Option items */}
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            name={name}
            data-value={option.value}
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 h-full font-medium font-sans rounded-btn transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${textClass} ${
              isSelected ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {option.icon && <span className="inline-flex shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
