import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarIcon, ChevronDownIcon } from './icons';

export interface AutopayDayPickerProps {
  value: number | string; // 1-31 or ''
  onChange: (value: number | string) => void;
  hasError?: boolean;
}

export function AutopayDayPicker({
  value,
  onChange,
  hasError = false,
}: AutopayDayPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLastDay = value === 31 || value === '31' || value === 'last';

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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange('');
      return;
    }

    let num = parseInt(raw, 10);
    if (isNaN(num)) {
      onChange('');
      return;
    }
    if (num < 1) num = 1;
    if (num > 31) num = 31;
    onChange(num);
  };

  const handleDaySelect = (day: number) => {
    onChange(day);
    closeDropdown();
  };

  const handleLastDaySelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(31);
    closeDropdown();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    closeDropdown();
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative autopay-day-picker-wrapper w-full ${hasError ? 'has-error' : ''}`}
    >
      <div
        className={`autopay-day-input-container flex items-center h-11 px-3.5 bg-surface border rounded-btn transition-colors ${
          hasError
            ? 'border-danger'
            : isOpen
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-line-strong hover:border-ink/50'
        }`}
      >
        <CalendarIcon size={18} className="text-ink-3 mr-2 shrink-0" />
        <input
          ref={inputRef}
          type="number"
          id="autopayDay"
          min="1"
          max="31"
          placeholder="Select day (1-31)"
          value={value === '' ? '' : value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-transparent text-body-sm font-medium text-ink outline-none placeholder:text-ink-3 tabular-nums"
        />
        <button
          type="button"
          className="autopay-day-toggle text-ink-3 hover:text-ink transition-transform duration-fast ml-2"
          id="autopayDayToggle"
          aria-label="Toggle day selector"
          onClick={handleToggle}
        >
          <div className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'}>
            <ChevronDownIcon size={18} />
          </div>
        </button>
      </div>

      {isOpen && (
        <div
          id="autopayDayCalendar"
          className="autopay-day-calendar absolute z-50 top-full mt-1.5 left-0 w-80 bg-surface border border-line rounded-card shadow-warm-2 p-4 animate-fadeIn"
        >
          <div className="autopay-day-calendar-header flex items-center justify-between pb-2 mb-2 border-b border-line">
            <span className="font-display text-body-sm font-semibold text-ink">Select Day of Month</span>
            <span className="text-caption text-ink-3">1 to 31</span>
          </div>

          <div className="autopay-day-weekdays grid grid-cols-7 text-center text-caption font-medium text-ink-3 mb-2">
            <span>SU</span>
            <span>MO</span>
            <span>TU</span>
            <span>WE</span>
            <span>TH</span>
            <span>FR</span>
            <span>SA</span>
          </div>

          <div className="autopay-day-grid grid grid-cols-7 gap-1" id="autopayDayGrid">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const isSelected = String(value) === String(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={`autopay-day-btn h-10 w-10 flex items-center justify-center rounded-btn text-body-sm font-medium tabular-nums transition-all ${
                    isSelected
                      ? 'bg-accent text-white font-semibold scale-100 shadow-warm-1 selected'
                      : 'text-ink hover:bg-surface-2'
                  }`}
                  data-day={day}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDaySelect(day);
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="autopay-day-calendar-footer flex items-center justify-between mt-3 pt-3 border-t border-line">
            <button
              type="button"
              className="autopay-clear-btn text-caption font-medium text-ink-3 hover:text-danger transition-colors"
              id="autopayClearBtn"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className={`autopay-last-day-btn px-3 py-1 rounded-chip text-caption font-semibold transition-colors ${
                isLastDay
                  ? 'bg-accent text-white selected shadow-warm-1'
                  : 'bg-surface-2 text-ink hover:bg-accent-tint hover:text-accent'
              }`}
              id="autopayLastDayBtn"
              onClick={handleLastDaySelect}
            >
              Last Day of Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
