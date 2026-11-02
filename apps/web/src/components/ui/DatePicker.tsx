import React, { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '../icons';
import { EASING } from '../../ui/motion';

export interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseISODate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
}

function formatISODate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * DatePicker Primitive (SPEC Section 4 & 5)
 * - Restyled with warm palette and rounded-card panel
 * - Month navigation slides grid 16px in travel direction
 * - Dot for today, accent fill for selected date
 * - Quick chips for Today and Yesterday
 * - Escape handling and focus return to trigger
 */
export function DatePicker({
  value,
  onChange,
  label,
  id = 'datepicker',
  hasError = false,
  errorMessage,
  disabled = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = parseISODate(value);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closePicker = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closePicker();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen, closePicker]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen) {
      const parsed = parseISODate(value);
      if (parsed) {
        setViewDate(parsed);
      }
    }
    setIsOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        const parsed = parseISODate(value);
        if (parsed) {
          setViewDate(parsed);
        }
      }
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      closePicker();
      triggerRef.current?.focus();
    }
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideDirection('left');
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideDirection('right');
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const iso = formatISODate(year, month, day);
    onChange(iso);
    closePicker();
    triggerRef.current?.focus();
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    handleSelectDate(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const handleSelectYesterday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    handleSelectDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    closePicker();
    triggerRef.current?.focus();
  };

  // Build calendar matrix (42 cells)
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const today = new Date();
  const isSameDay = (d: Date | null, y: number, m: number, day: number) =>
    d !== null && d.getFullYear() === y && d.getMonth() === m && d.getDate() === day;

  interface DayCell {
    day: number;
    month: number;
    year: number;
    isOtherMonth: boolean;
  }

  const days: DayCell[] = [];
  // Prev month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i -= 1) {
    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    days.push({ day: daysInPrevMonth - i, month: prevM, year: prevY, isOtherMonth: true });
  }
  // Current month
  for (let i = 1; i <= daysInCurrentMonth; i += 1) {
    days.push({ day: i, month: currentMonth, year: currentYear, isOtherMonth: false });
  }
  // Next month padding to 42
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i += 1) {
    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
    days.push({ day: i, month: nextM, year: nextY, isOtherMonth: true });
  }

  const formatDisplay = () => {
    if (!selectedDate) return 'Select Date';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isInvalid = hasError || Boolean(errorMessage);
  const borderStyles = isInvalid
    ? 'border-danger focus:border-danger focus:ring-danger'
    : 'border-line-strong hover:border-ink-2 focus:border-accent focus:ring-accent';

  return (
    <div ref={wrapperRef} className={`relative flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink select-none">
          {label}
        </label>
      )}

      {/* Hidden standard input for forms */}
      <input type="hidden" id={id} value={value} />

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label ? `${label}, ${formatDisplay()}` : formatDisplay()}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className={`h-[44px] w-full rounded-btn bg-surface px-3.5 flex items-center justify-between text-sm font-sans text-ink border transition-[border-color,box-shadow,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-surface-2 ${borderStyles}`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className="text-ink-2 shrink-0">
            <CalendarIcon size={18} />
          </span>
          <span className={!selectedDate ? 'text-ink-3' : 'text-ink font-normal'}>
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

      {/* Calendar Panel with Motion Exit Animation */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            role="dialog"
            aria-label="Calendar"
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
            {/* Quick Chips: Today and Yesterday */}
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-line">
              <span className="text-xs text-ink-3 font-medium">Quick:</span>
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-2.5 py-1 text-xs font-medium rounded-chip bg-surface-2 text-ink hover:bg-accent-tint hover:text-accent transition-colors duration-fast"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleSelectYesterday}
                className="px-2.5 py-1 text-xs font-medium rounded-chip bg-surface-2 text-ink hover:bg-accent-tint hover:text-accent transition-colors duration-fast"
              >
                Yesterday
              </button>
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="ml-auto px-2 py-1 text-xs text-ink-3 hover:text-danger transition-colors duration-fast"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Header: Month and Year + Nav */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-chip hover:bg-surface-2 text-ink-2 hover:text-ink transition-colors duration-fast"
              >
                <ChevronLeftIcon size={16} />
              </button>

              <div className="font-semibold text-sm text-ink font-display">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </div>

              <button
                type="button"
                aria-label="Next month"
                onClick={handleNextMonth}
                className="p-1.5 rounded-chip hover:bg-surface-2 text-ink-2 hover:text-ink transition-colors duration-fast"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-3 mb-1.5">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="py-1">
                  {wd}
                </span>
              ))}
            </div>

            {/* Calendar Days with Month-Slide Animation */}
            <div className="overflow-hidden">
              <m.div
                key={`${currentYear}-${currentMonth}`}
                initial={{ opacity: 0.6, x: slideDirection === 'right' ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.16, ease: EASING.out }}
                className="grid grid-cols-7 gap-1"
              >
                {days.map((cell, idx) => {
                  const isCurrentDay = isSameDay(today, cell.year, cell.month, cell.day);
                  const isSelected = isSameDay(selectedDate, cell.year, cell.month, cell.day);

                  let cellColor = 'text-ink hover:bg-surface-2';
                  if (cell.isOtherMonth) {
                    cellColor = 'text-ink-3/40 hover:bg-surface-2/60';
                  }
                  if (isSelected) {
                    cellColor = 'bg-accent text-white font-semibold hover:bg-accent';
                  }

                  return (
                    <button
                      key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                      type="button"
                      onClick={() => handleSelectDate(cell.year, cell.month, cell.day)}
                      className={`relative h-9 rounded-btn text-xs font-sans flex flex-col items-center justify-center transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${cellColor}`}
                    >
                      <span>{cell.day}</span>
                      {/* Today indicator dot */}
                      {isCurrentDay && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-accent absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </m.div>
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

export default DatePicker;
