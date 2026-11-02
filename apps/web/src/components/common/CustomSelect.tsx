import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, CheckIcon } from './icons';

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
  const [opensUpward, setOpensUpward] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isPlaceholder = !selectedOption || selectedOption.value === '';
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpensUpward(spaceBelow < 220 && rect.top > 220);
    }
    setIsOpen(true);
  };

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
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
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
    onChange(optionValue);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    optionValue: string,
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(optionValue);
      closeDropdown();
      triggerRef.current?.focus();
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
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = optionsRef.current?.querySelector<HTMLDivElement>('.custom-option');
      first?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const all = optionsRef.current?.querySelectorAll<HTMLDivElement>('.custom-option');
      if (all && all.length > 0) all[all.length - 1].focus();
    } else if (e.key === 'Escape') {
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative custom-select-wrapper w-full ${isOpen ? 'open' : ''} ${
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
        className="hidden"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div
        ref={triggerRef}
        className={`custom-select-trigger flex items-center justify-between h-11 px-3.5 bg-surface border rounded-btn text-body-sm font-sans transition-colors cursor-pointer select-none ${
          hasError
            ? 'border-danger'
            : isOpen
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-line-strong hover:border-ink/50'
        } ${disabled ? 'opacity-45 cursor-not-allowed bg-surface-2' : ''}`}
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`truncate ${isPlaceholder ? 'text-ink-3 placeholder' : 'text-ink font-medium'}`}>
          {displayText}
        </span>
        <div className={`custom-select-arrow transition-transform duration-fast shrink-0 ml-2 text-ink-3 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon size={18} />
        </div>
      </div>

      {isOpen && (
        <div
          ref={optionsRef}
          className={`custom-options absolute z-50 w-full bg-surface border border-line rounded-card shadow-warm-2 py-1 max-h-60 overflow-y-auto animate-fadeIn ${
            opensUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          role="listbox"
        >
          {options
            .filter((opt) => !(opt.value === '' && options.length > 1))
            .map((opt) => {
              const isSelected = opt.value === value;

              return (
                <div
                  key={opt.value}
                  className={`custom-option flex items-center justify-between h-10 px-3.5 text-body-sm cursor-pointer outline-none transition-colors duration-fast ${
                    isSelected
                      ? 'bg-accent-tint text-accent font-semibold selected'
                      : 'text-ink hover:bg-surface-2 focus:bg-surface-2'
                  }`}
                  tabIndex={0}
                  data-value={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={(e) => handleOptionClick(e, opt.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, opt.value)}
                >
                  <span className="option-text truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="text-accent shrink-0 ml-2">
                      <CheckIcon size={16} strokeWidth={2.5} />
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
