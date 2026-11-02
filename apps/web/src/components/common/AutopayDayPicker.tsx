import React, { useState, useRef, useEffect, useCallback } from 'react';

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
      className={`autopay-day-picker-wrapper ${hasError ? 'has-error' : ''}`}
    >
      <div className="autopay-day-input-container">
        <i className="fas fa-calendar-day" />
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
        />
        <button
          type="button"
          className="autopay-day-toggle"
          id="autopayDayToggle"
          aria-label="Toggle day selector"
          onClick={handleToggle}
        >
          <i className="fas fa-chevron-down" />
        </button>
      </div>

      <div
        id="autopayDayCalendar"
        className={`autopay-day-calendar ${isOpen ? 'active' : ''}`}
      >
        <div className="autopay-day-calendar-header">
          <span>Select Day of Month</span>
        </div>
        <div className="autopay-day-weekdays">
          <span>SU</span>
          <span>MO</span>
          <span>TU</span>
          <span>WE</span>
          <span>TH</span>
          <span>FR</span>
          <span>SA</span>
        </div>
        <div className="autopay-day-grid" id="autopayDayGrid">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isSelected = String(value) === String(day);
            return (
              <button
                key={day}
                type="button"
                className={`autopay-day-btn ${isSelected ? 'selected' : ''}`}
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
        <div className="autopay-day-calendar-footer">
          <button
            type="button"
            className="autopay-clear-btn"
            id="autopayClearBtn"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            type="button"
            className={`autopay-last-day-btn ${isLastDay ? 'selected' : ''}`}
            id="autopayLastDayBtn"
            onClick={handleLastDaySelect}
          >
            Last Day
          </button>
        </div>
      </div>
    </div>
  );
}
