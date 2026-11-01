import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  getDaySuffix,
  formatDateDisplay,
} from '../lib/formatters';

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
    expect(formatDateDisplay('2026-10-17')).toContain('17 Oct 2026');
  });
});
