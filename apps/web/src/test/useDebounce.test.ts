import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce hook (PERF-4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('debounces rapid updates and only emits latest value after delay', () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: 'a' },
    });

    expect(result.current).toBe('a');

    // Type rapidly
    rerender({ val: 'ab' });
    rerender({ val: 'abc' });
    rerender({ val: 'abcd' });

    // Value should still be 'a' before delay
    expect(result.current).toBe('a');

    // Advance halfway (150ms)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('a');

    // Advance remaining time (150ms)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('abcd');
  });

  it('resets immediately when value is cleared to empty string', () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: 'active search' },
    });

    expect(result.current).toBe('active search');

    // Clear search
    rerender({ val: '' });

    // Should clear immediately without waiting 300ms
    expect(result.current).toBe('');
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { rerender, unmount } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: 'start' },
    });

    rerender({ val: 'next' });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
