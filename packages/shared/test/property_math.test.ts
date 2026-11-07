import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { rupeesToPaise, paiseToRupees, formatPaise } from '../src/currency/paise.js';
import { getClampedDueDay } from '../src/calculations/autopay.js';

describe('Property-based randomized tests with fast-check (QA-12)', () => {
  it('integer paise round-trip idempotency across 10,000 random integer paise amounts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }), // ±1 Crore in paise
        (paise) => {
          const rupees = paiseToRupees(paise);
          const convertedPaise = rupeesToPaise(rupees);
          expect(convertedPaise).toBe(paise);
        },
      ),
      { numRuns: 10000 },
    );
  });

  it('2-decimal rupee amounts round-trip without floating-point drift across 10,000 runs', () => {
    // Generate valid 2-decimal rupee amounts by generating integer cents / 100
    fc.assert(
      fc.property(
        fc.integer({ min: -10_000_000, max: 10_000_000 }),
        (cents) => {
          const rupees = cents / 100;
          const paise = rupeesToPaise(rupees);
          const roundTripRupees = paiseToRupees(paise);
          expect(roundTripRupees).toBe(rupees);
          expect(Number.isInteger(paise)).toBe(true);
        },
      ),
      { numRuns: 10000 },
    );
  });

  it('addition in integer paise guarantees zero floating-point accumulation across 10,000 pairs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5_000_000, max: 5_000_000 }),
        fc.integer({ min: -5_000_000, max: 5_000_000 }),
        (centsA, centsB) => {
          const rupeesA = centsA / 100;
          const rupeesB = centsB / 100;
          const expectedSum = (centsA + centsB) / 100;

          const sumPaise = rupeesToPaise(rupeesA) + rupeesToPaise(rupeesB);
          const actualSum = paiseToRupees(sumPaise);

          expect(actualSum).toBe(expectedSum);
          expect(Number.isInteger(sumPaise)).toBe(true);
        },
      ),
      { numRuns: 10000 },
    );
  });

  it('formatPaise handles any integer paise amount deterministically without error across 10,000 values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }),
        (paise) => {
          const formatted = formatPaise(paise);
          expect(typeof formatted).toBe('string');
          expect(formatted.startsWith('-₹') || formatted.startsWith('₹')).toBe(true);
        },
      ),
      { numRuns: 10000 },
    );
  });

  it('getClampedDueDay always returns a valid calendar day within target month bounds across 10,000 runs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 31 }),       // target day
        fc.integer({ min: 1970, max: 2100 }),  // year
        fc.integer({ min: 0, max: 11 }),       // month (0-11 zero-indexed)
        (targetDay, year, monthZeroIndexed) => {
          const clamped = getClampedDueDay(targetDay, year, monthZeroIndexed);

          // Clamped day must be at least 1 and at most targetDay
          expect(clamped).toBeGreaterThanOrEqual(1);
          expect(clamped).toBeLessThanOrEqual(targetDay);

          // February checks (monthZeroIndexed === 1)
          if (monthZeroIndexed === 1) {
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
            const maxFeb = isLeap ? 29 : 28;
            expect(clamped).toBeLessThanOrEqual(maxFeb);
            if (targetDay >= maxFeb) {
              expect(clamped).toBe(maxFeb);
            }
          }

          // 30-day months: April (3), June (5), September (8), November (10)
          if ([3, 5, 8, 10].includes(monthZeroIndexed)) {
            expect(clamped).toBeLessThanOrEqual(30);
            if (targetDay >= 30) {
              expect(clamped).toBe(30);
            }
          }

          // 31-day months: Jan (0), Mar (2), May (4), Jul (6), Aug (7), Oct (9), Dec (11)
          if ([0, 2, 4, 6, 7, 9, 11].includes(monthZeroIndexed)) {
            expect(clamped).toBe(targetDay);
          }
        },
      ),
      { numRuns: 10000 },
    );
  });
});
