import React, { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { CalendarDayIcon, ChevronDownIcon } from '../icons';
import { EASING } from '../../ui/motion';

export interface DayOfMonthPickerProps {
  value: number | string; // 1-31, 'last', or ''
  onChange: (value: number | string) => void;
  label?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * DayOfMonthPicker Primitive (SPEC Section 5)
 * 7-column grid of 40px cells for Autopay recurring date selection.
 * Selected day animates a filled circle with scale 0.8 to 1.
 * Separate "Last Day" toggle row below.
 */
export function DayOfMonthPicker({
  value,
  onChange,
  label,
  hasError = false,
  errorMessage,
  disabled = false,
  className = '',
}: DayOfMonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isLastDay = value === 31 || value === '31' || value === 'last';
  const numericDay = typeof value === 'number' ? value : parseInt(String(value), 10);
  const hasValidDay = !isNaN(numericDay) && numericDay >= 1 && numericDay <= 31;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen, closeDropdown]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  const handleDaySelect = (day: number) => {
    onChange(day);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleLastDaySelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('last');
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    closeDropdown();
    triggerRef.current?.focus();
  };

  const formatDisplay = () => {
    if (value === 'last' || (value === 31 && isLastDay)) {
      return 'Last day of month';
    }
    if (hasValidDay) {
      const day = numericDay;
      const s = ['th', 'st', 'nd', 'rd'];
      const v = day % 100;
      const ord = s[(v - 20) % 10] || s[v] || s[0];
      return `${day}${ord} of the month`;
    }
    return 'Select day of month (1-31)';
  };

  const isInvalid = hasError || Boolean(errorMessage);
  const borderStyles = isInvalid
    ? 'border-danger focus:border-danger focus:ring-danger'
    : 'border-line-strong hover:border-ink-2 focus:border-accent focus:ring-accent';

  return (
    <div ref={wrapperRef} className={`relative flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-sm font-medium text-ink select-none">{label}</label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label || 'Select day of month'}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className={`h-[44px] w-full rounded-btn bg-surface px-3.5 flex items-center justify-between text-sm font-sans text-ink border transition-[border-color,box-shadow,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-surface-2 ${borderStyles}`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className="text-ink-2 shrink-0">
            <CalendarDayIcon size={18} />
          </span>
          <span className={!value ? 'text-ink-3' : 'text-ink font-normal'}>
            {formatDisplay()}
          </span>
        </span>

        <span
          className={`shrink-0 ml-2 text-ink-3 transition-transform duration-base ${
            isOpen ? 'rotate-180 text-ink' : ''
          }`}
        >
          <ChevronDownIcon size={18} />
        </span>
      </button>

      {/* Dropdown 7-column Calendar Panel */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            role="dialog"
            aria-label="Day of month selector"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
              duration: 0.16,
              exit: { duration: 0.11, ease: EASING.in },
              ease: EASING.out,
            }}
            className="absolute z-50 left-0 top-full mt-1.5 w-72 sm:w-80 rounded-card bg-surface border border-line shadow-2 p-3.5 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-line">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                Select Day of Month
              </span>
              {value !== '' && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-ink-3 hover:text-danger transition-colors duration-fast"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-3 mb-1">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="py-1">
                  {wd}
                </span>
              ))}
            </div>

            {/* 7-column grid of 40px cells */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isSelected = String(value) === String(day) && value !== 'last';
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    className={`relative w-9 h-10 sm:w-10 sm:h-10 rounded-btn text-xs font-sans flex items-center justify-center transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-ink hover:bg-surface-2'
                    }`}
                  >
                    {/* Animated filled circle */}
                    {isSelected && (
                      <m.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.16, ease: EASING.out }}
                        className="absolute inset-1 rounded-full bg-accent -z-0"
                      />
                    )}
                    <span className="relative z-10">{day}</span>
                  </button>
                );
              })}
            </div>

            {/* Separate Last Day toggle row below */}
            <div className="pt-2 border-t border-line">
              <button
                type="button"
                onClick={handleLastDaySelect}
                className={`w-full h-10 px-3.5 rounded-btn text-xs font-medium flex items-center justify-between border transition-all duration-fast ${
                  isLastDay
                    ? 'bg-accent-tint border-accent text-accent font-semibold'
                    : 'bg-surface border-line text-ink hover:bg-surface-2'
                }`}
              >
                <span>Last Day of Month (28th–31st automatically)</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isLastDay ? 'border-accent bg-accent' : 'border-line-strong'
                  }`}
                >
                  {isLastDay && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {errorMessage && (
        <span role="alert" className="text-xs text-danger font-medium transition-opacity duration-fast">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

export default DayOfMonthPicker;
