import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  getDaySuffix,
  formatDateDisplay,
  formatCalendarDate,
  getLocalDateString,
} from '../src/calculations/formatters.js';

describe('formatters', () => {
  it('formatCurrency formats Indian Rupee correctly', () => {
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(500)).toBe('₹500');
    expect(formatCurrency(1250.5)).toBe('₹1,250.50');
    expect(formatCurrency(100000)).toBe('₹1,00,000');
    expect(formatCurrency(NaN)).toBe('₹0');
  });

  it('getDaySuffix handles 1st, 2nd, 3rd, 4th, 11th, etc.', () => {
    expect(getDaySuffix(1)).toBe('st');
    expect(getDaySuffix(2)).toBe('nd');
    expect(getDaySuffix(3)).toBe('rd');
    expect(getDaySuffix(4)).toBe('th');
    expect(getDaySuffix(11)).toBe('th');
    expect(getDaySuffix(12)).toBe('th');
    expect(getDaySuffix(13)).toBe('th');
    expect(getDaySuffix(21)).toBe('st');
    expect(getDaySuffix(22)).toBe('nd');
    expect(getDaySuffix(23)).toBe('rd');
    expect(getDaySuffix(31)).toBe('st');
  });

  it('formatDateDisplay returns formatted date string or fallback', () => {
    expect(formatDateDisplay('')).toBe('Select Date');
    expect(formatDateDisplay('2026-10-17')).toBe('Sat, 17 Oct 2026');
  });

  describe('timezone consistency & calendar boundary parsing [CORE-4]', () => {
    it('getLocalDateString returns YYYY-MM-DD in local time without UTC offset drift', () => {
      const d = new Date(2026, 3, 15); // April 15, 2026 local
      expect(getLocalDateString(d)).toBe('2026-04-15');

      const dMidnight = new Date(2026, 0, 1, 0, 0, 0); // Jan 1, 2026 local midnight
      expect(getLocalDateString(dMidnight)).toBe('2026-01-01');
    });

    it('formatCalendarDate produces identical output regardless of international client timezone', () => {
      // Midnight boundary cases:
      expect(formatCalendarDate('2026-04-15')).toBe('Wed, 15 Apr 2026');
      expect(formatCalendarDate('2026-01-01')).toBe('Thu, 1 Jan 2026');
      expect(formatCalendarDate('2026-12-31')).toBe('Thu, 31 Dec 2026');

      // Leap day:
      expect(formatCalendarDate('2024-02-29')).toBe('Thu, 29 Feb 2024');

      // Non-leap February end:
      expect(formatCalendarDate('2025-02-28')).toBe('Fri, 28 Feb 2025');

      // Option formatting variants:
      expect(formatCalendarDate('2026-04-15', { includeWeekday: false, includeYear: false })).toBe('15 Apr');
      expect(formatCalendarDate('2026-04-15', { includeWeekday: false, includeYear: true })).toBe('15 Apr 2026');
      expect(formatCalendarDate('2026-04-15', { monthFormat: 'long' })).toBe('Wed, 15 April 2026');

      // ISO string with T00:00:00:
      expect(formatCalendarDate('2026-04-15T00:00:00.000Z')).toBe('Wed, 15 Apr 2026');
    });
  });
});
