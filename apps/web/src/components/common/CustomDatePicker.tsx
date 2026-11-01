import React, { useState, useRef, useEffect, useCallback } from 'react';

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

  // Parse initial date
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

  // Close on outside click
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

  // Handle keyboard Escape
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
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${year}-${mm}-${dd}`);

    setTimeout(() => {
      closeDropdown();
      triggerRef.current?.focus();
    }, 150);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    handleSelectDate(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setTimeout(() => {
      closeDropdown();
      triggerRef.current?.focus();
    }, 150);
  };

  // Generate calendar days
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

  // Previous month padding days
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

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i += 1) {
    days.push({
      day: i,
      month,
      year,
      isOtherMonth: false,
    });
  }

  // Next month padding days to complete 6 rows (42 days)
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
      className={`custom-datepicker-wrapper ${hasError ? 'has-error' : ''}`}
      id="datePickerWrapper"
    >
      <div
        ref={triggerRef}
        id="datePickerTrigger"
        className={`datepicker-trigger ${isOpen ? 'active' : ''} ${
          hasError ? 'has-error' : ''
        }`}
        role="button"
        tabIndex={0}
        aria-label="Open date picker"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={handleToggle}
        onKeyDown={handleToggle}
      >
        <i className="fas fa-calendar-alt" />
        <span
          className={`datepicker-display ${!selectedDate ? 'placeholder' : ''}`}
          id="dateDisplay"
        >
          {formatDisplay()}
        </span>
        <i className="fas fa-chevron-down datepicker-arrow" />
      </div>

      <input type="hidden" id={id} value={value} required />

      <div
        id="datePickerDropdown"
        className={`datepicker-dropdown ${isOpen ? 'open' : ''}`}
      >
        <div className="datepicker-header">
          <button
            type="button"
            className="datepicker-nav prev"
            id="prevMonth"
            aria-label="Previous month"
            onClick={handlePrevMonth}
          >
            <i className="fas fa-chevron-left" />
          </button>
          <div className="datepicker-month-year">
            <span id="currentMonth">{MONTH_NAMES[month]}</span>{' '}
            <span id="currentYear">{year}</span>
          </div>
          <button
            type="button"
            className="datepicker-nav next"
            id="nextMonth"
            aria-label="Next month"
            onClick={handleNextMonth}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        <div className="datepicker-weekdays">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        <div className="datepicker-days" id="datepickerDays">
          {days.map((cell, idx) => {
            const isToday = isSameDay(today, cell.year, cell.month, cell.day);
            const isSelected = isSameDay(
              selectedDate,
              cell.year,
              cell.month,
              cell.day,
            );

            let dayClasses = 'datepicker-day';
            if (cell.isOtherMonth) dayClasses += ' other-month';
            if (isToday) dayClasses += ' today';
            if (isSelected) dayClasses += ' selected';

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
              </button>
            );
          })}
        </div>

        <div className="datepicker-footer">
          <button
            type="button"
            className="datepicker-btn clear"
            id="clearDate"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            type="button"
            className="datepicker-btn today"
            id="todayBtn"
            onClick={handleSelectToday}
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}
