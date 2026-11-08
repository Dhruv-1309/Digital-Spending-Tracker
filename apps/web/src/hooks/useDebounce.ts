import { useState, useEffect } from 'react';

/**
 * useDebounce hook
 * Debounces a fast-changing value (e.g. search query) by delayMs (default 300ms).
 * If the value is cleared (empty string, null, or undefined), updates immediately
 * so clear actions feel instantaneous.
 *
 * @param value The value to debounce
 * @param delayMs The debounce delay in milliseconds (default: 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // If empty or nullish, clear immediately without waiting
    if (value === '' || value === null || value === undefined) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
