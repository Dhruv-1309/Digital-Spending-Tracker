import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

export interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  hasError?: boolean;
  id?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CustomDatePicker({
  value,
  onChange,
  hasError = false,
  id = 'date',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const selectedDate = parseDate(value);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDropdown();
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    if ('key' in e) e.preventDefault();

    if (!isOpen) {
      const parsed = parseDate(value);
      if (parsed) {
        setViewDate(new Date(parsed));
      }
    }
    setIsOpen((prev) => !prev);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideDirection('left');
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setTimeout(() => setSlideDirection(null), 160);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideDirection('right');
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setTimeout(() => setSlideDirection(null), 160);
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${year}-${mm}-${dd}`);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    handleSelectDate(today.getFullYear(), today.getMonth(), today.getDate());
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
    closeDropdown();
    triggerRef.current?.focus();
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isSameDay = (d1: Date | null, y: number, m: number, d: number) =>
    d1 !== null &&
    d1.getFullYear() === y &&
    d1.getMonth() === m &&
    d1.getDate() === d;

  interface DayCell {
    day: number;
    month: number;
    year: number;
    isOtherMonth: boolean;
  }

  const days: DayCell[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i -= 1) {
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    days.push({
      day: daysInPrevMonth - i,
      month: prevM,
      year: prevY,
      isOtherMonth: true,
    });
  }

  for (let i = 1; i <= daysInCurrentMonth; i += 1) {
    days.push({
      day: i,
      month,
      year,
      isOtherMonth: false,
    });
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i += 1) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    days.push({
      day: i,
      month: nextM,
      year: nextY,
      isOtherMonth: true,
    });
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

  return (
    <div
      ref={wrapperRef}
      className={`relative custom-datepicker-wrapper w-full ${hasError ? 'has-error' : ''}`}
      id="datePickerWrapper"
    >
      <div
        ref={triggerRef}
        id="datePickerTrigger"
        className={`datepicker-trigger flex items-center justify-between h-11 px-3.5 bg-surface border rounded-btn text-body-sm font-sans transition-colors cursor-pointer select-none ${
          hasError
            ? 'border-danger'
            : isOpen
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-line-strong hover:border-ink/50'
        } ${isOpen ? 'active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Open date picker"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={handleToggle}
        onKeyDown={handleToggle}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon size={18} className="text-ink-3 shrink-0" />
          <span
            className={`datepicker-display truncate ${!selectedDate ? 'text-ink-3 placeholder' : 'text-ink font-medium'}`}
            id="dateDisplay"
          >
            {formatDisplay()}
          </span>
        </div>
        <div className={`datepicker-arrow text-ink-3 shrink-0 transition-transform duration-fast ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon size={18} />
        </div>
      </div>

      <input type="hidden" id={id} value={value} required />

      {isOpen && (
        <div
          id="datePickerDropdown"
          className="datepicker-dropdown absolute z-50 top-full mt-1.5 left-0 w-80 bg-surface border border-line rounded-card shadow-warm-2 p-4 animate-fadeIn"
        >
          {/* Quick chips: Today, Yesterday */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-line">
            <span className="text-caption text-ink-3 font-medium mr-1">Quick:</span>
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1 rounded-chip text-caption font-medium bg-surface-2 text-ink-2 hover:bg-accent-tint hover:text-accent transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleSelectYesterday}
              className="px-2.5 py-1 rounded-chip text-caption font-medium bg-surface-2 text-ink-2 hover:bg-accent-tint hover:text-accent transition-colors"
            >
              Yesterday
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="datepicker-header flex items-center justify-between mb-3">
            <button
              type="button"
              className="datepicker-nav prev p-1.5 rounded-btn hover:bg-surface-2 text-ink-2 transition-colors"
              id="prevMonth"
              aria-label="Previous month"
              onClick={handlePrevMonth}
            >
              <ChevronLeftIcon size={18} />
            </button>
            <div className="datepicker-month-year font-display font-semibold text-body text-ink">
              <span id="currentMonth">{MONTH_NAMES[month]}</span>{' '}
              <span id="currentYear">{year}</span>
            </div>
            <button
              type="button"
              className="datepicker-nav next p-1.5 rounded-btn hover:bg-surface-2 text-ink-2 transition-colors"
              id="nextMonth"
              aria-label="Next month"
              onClick={handleNextMonth}
            >
              <ChevronRightIcon size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="datepicker-weekdays grid grid-cols-7 text-center text-caption font-medium text-ink-3 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div
            id="datepickerDays"
            className={`datepicker-days grid grid-cols-7 gap-1 transition-transform duration-base ${
              slideDirection === 'left'
                ? '-translate-x-2'
                : slideDirection === 'right'
                ? 'translate-x-2'
                : 'translate-x-0'
            }`}
          >
            {days.map((cell, idx) => {
              const isToday = isSameDay(today, cell.year, cell.month, cell.day);
              const isSelected = isSameDay(
                selectedDate,
                cell.year,
                cell.month,
                cell.day,
              );

              let dayClasses =
                'datepicker-day relative h-9 w-9 mx-auto flex items-center justify-center rounded-btn text-body-sm font-medium tabular-nums transition-colors';
              if (cell.isOtherMonth) {
                dayClasses += ' text-ink-3/40 other-month hover:bg-surface-2';
              } else if (isSelected) {
                dayClasses += ' bg-accent text-white font-semibold selected shadow-warm-1';
              } else {
                dayClasses += ' text-ink hover:bg-surface-2';
              }

              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                  type="button"
                  className={dayClasses}
                  data-year={cell.year}
                  data-month={cell.month}
                  data-day={cell.day}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDate(cell.year, cell.month, cell.day);
                  }}
                >
                  {cell.day}
                  {/* Today dot indicator */}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-accent rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="datepicker-footer flex justify-between items-center mt-3 pt-3 border-t border-line">
            <button
              type="button"
              className="datepicker-btn clear text-caption font-medium text-ink-3 hover:text-danger transition-colors"
              id="clearDate"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="datepicker-btn today text-caption font-semibold text-accent hover:underline transition-colors"
              id="todayBtn"
              onClick={handleSelectToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
