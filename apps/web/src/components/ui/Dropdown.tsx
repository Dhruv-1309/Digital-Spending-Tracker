import React, { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ChevronDownIcon, CheckIcon } from '../icons';
import { EASING } from '../../ui/motion';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Dropdown Primitive (SPEC Section 4 & 5)
 * Replaces CustomSelect look with design tokens:
 * - 40px options with surface-2 hover
 * - Check icon on selected option
 * - 180° chevron rotation
 * - Opens upward when there is no space below
 * - Keyboard behavior: ArrowDown, ArrowUp, Home, End, Type-ahead, Escape
 * - Focus return to trigger on close
 * - Exit animation with Motion (AnimatePresence + m.div)
 */
export function Dropdown({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select',
  hasError = false,
  errorMessage,
  className = '',
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [typeAheadBuffer, setTypeAheadBuffer] = useState('');
  const typeAheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isPlaceholder = !selectedOption || selectedOption.value === '';
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Check viewport position to open upward if there is no space below
  const updatePlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(options.length * 40 + 16, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, [options.length]);

  // Handle outside clicks
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
    if (!isOpen) {
      updatePlacement();
      setIsOpen(true);
    } else {
      closeDropdown();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        updatePlacement();
        setIsOpen(true);
      } else {
        closeDropdown();
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        updatePlacement();
        setIsOpen(true);
      }
      setTimeout(() => {
        const optionEls = optionsRef.current?.querySelectorAll<HTMLDivElement>('[role="option"]');
        if (optionEls && optionEls.length > 0) {
          const selectedIdx = options.findIndex((opt) => opt.value === value);
          const targetIdx = selectedIdx >= 0 ? selectedIdx : 0;
          optionEls[targetIdx]?.focus();
        }
      }, 50);
    } else if (e.key === 'Escape') {
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, optionValue: string, index: number) => {
    const optionEls = optionsRef.current?.querySelectorAll<HTMLDivElement>('[role="option"]');
    if (!optionEls) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionSelect(optionValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, optionEls.length - 1);
      optionEls[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        triggerRef.current?.focus();
      } else {
        optionEls[index - 1]?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      optionEls[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      optionEls[optionEls.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      triggerRef.current?.focus();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Type-ahead navigation
      e.preventDefault();
      const newBuffer = typeAheadBuffer + e.key.toLowerCase();
      setTypeAheadBuffer(newBuffer);

      if (typeAheadTimerRef.current) clearTimeout(typeAheadTimerRef.current);
      typeAheadTimerRef.current = setTimeout(() => setTypeAheadBuffer(''), 500);

      const matchIdx = options.findIndex((opt) => opt.label.toLowerCase().startsWith(newBuffer));
      if (matchIdx !== -1 && optionEls[matchIdx]) {
        optionEls[matchIdx]?.focus();
      }
    }
  };

  const inputId = id || (label ? `dropdown-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const isInvalid = hasError || Boolean(errorMessage);

  const borderStyles = isInvalid
    ? 'border-danger focus:border-danger focus:ring-danger'
    : 'border-line-strong hover:border-ink-2 focus:border-accent focus:ring-accent';

  return (
    <div ref={wrapperRef} className={`relative flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink select-none">
          {label}
        </label>
      )}

      {/* Hidden standard select for form serialisation & testing accessibility */}
      <select
        id={inputId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className={`h-[44px] w-full rounded-btn bg-surface px-3.5 flex items-center justify-between text-sm font-sans text-ink border transition-[border-color,box-shadow,background-color] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-surface-2 ${borderStyles}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="inline-flex shrink-0">{selectedOption.icon}</span>}
          <span className={isPlaceholder ? 'text-ink-3' : 'text-ink font-normal'}>{displayText}</span>
        </span>

        <span
          className={`shrink-0 ml-2 text-ink-3 transition-transform duration-base ${
            isOpen ? 'rotate-180 text-ink' : ''
          }`}
        >
          <ChevronDownIcon size={18} />
        </span>
      </button>

      {/* Dropdown Options Panel with Motion Exit Animation */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            ref={optionsRef}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={selectedOption ? `opt-${selectedOption.value}` : undefined}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
              duration: 0.16,
              exit: { duration: 0.11, ease: EASING.in },
              ease: EASING.out,
            }}
            style={{
              transformOrigin: openUpward ? 'bottom center' : 'top center',
            }}
            className={`absolute z-50 left-0 right-0 max-h-60 overflow-y-auto rounded-btn bg-surface border border-line shadow-2 p-1 focus:outline-none ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  id={`opt-${option.value}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => handleOptionSelect(option.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option.value, idx)}
                  className={`h-10 px-3 flex items-center justify-between rounded-btn text-sm font-sans cursor-pointer select-none transition-colors duration-fast focus-visible:outline-none focus-visible:bg-surface-2 ${
                    isSelected
                      ? 'bg-accent-tint text-accent font-medium'
                      : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon && <span className="inline-flex shrink-0">{option.icon}</span>}
                    <span>{option.label}</span>
                  </span>

                  {isSelected && (
                    <span className="text-accent shrink-0 ml-2">
                      <CheckIcon size={16} />
                    </span>
                  )}
                </div>
              );
            })}
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

export default Dropdown;
