import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

export interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  hasError?: boolean;
  className?: string;
  disabled?: boolean;
}

const defaultIcons: Record<string, string> = {
  income: 'arrow-up',
  expense: 'arrow-down',
  overall: 'chart-line',
  monthly: 'calendar-alt',
  yearly: 'calendar',
  cash: 'money-bill-wave',
  card: 'credit-card',
  bank_transfer: 'university',
  upi: 'mobile-alt',
  wallet: 'wallet',
  other: 'ellipsis-h',
  default: 'tag',
};

export function CustomSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select',
  hasError = false,
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isPlaceholder = !selectedOption || selectedOption.value === '';
  const displayText = selectedOption ? selectedOption.label : placeholder;

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

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      setTimeout(() => {
        const firstOption = optionsRef.current?.querySelector<HTMLDivElement>('.custom-option');
        firstOption?.focus();
      }, 50);
    } else if (e.key === 'Escape') {
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  const handleOptionClick = (
    e: React.MouseEvent<HTMLDivElement>,
    optionValue: string,
  ) => {
    e.stopPropagation();

    // Create ripple effect
    const element = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    onChange(optionValue);

    setTimeout(() => {
      closeDropdown();
      triggerRef.current?.focus();
    }, 150);
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    optionValue: string,
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(optionValue);
      setTimeout(() => {
        closeDropdown();
        triggerRef.current?.focus();
      }, 150);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = e.currentTarget;
      const next = current.nextElementSibling as HTMLDivElement | null;
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = e.currentTarget;
      const prev = current.previousElementSibling as HTMLDivElement | null;
      if (prev) {
        prev.focus();
      } else {
        triggerRef.current?.focus();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  const getIconClass = (opt: SelectOption) => {
    if (opt.icon) return opt.icon;
    return defaultIcons[opt.value] || defaultIcons.default;
  };

  return (
    <div
      ref={wrapperRef}
      className={`custom-select-wrapper ${isOpen ? 'open' : ''} ${
        hasError ? 'has-error' : ''
      } ${className}`}
    >
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div
        ref={triggerRef}
        className="custom-select-trigger"
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={isPlaceholder ? 'placeholder' : ''}>
          {displayText}
        </span>
        <div className="custom-select-arrow" />
      </div>

      <div
        ref={optionsRef}
        className="custom-options"
        role="listbox"
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        {options
          .filter((opt) => !(opt.value === '' && options.length > 1))
          .map((opt) => {
            const isSelected = opt.value === value;
            const iconClass = getIconClass(opt);

            return (
              <div
                key={opt.value}
                className={`custom-option ${isSelected ? 'selected' : ''}`}
                tabIndex={isOpen ? 0 : -1}
                data-value={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={(e) => handleOptionClick(e, opt.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, opt.value)}
              >
                <span className="option-icon">
                  <span className="option-icon-symbol" data-icon={iconClass} />
                </span>
                <span className="option-text">{opt.label}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
