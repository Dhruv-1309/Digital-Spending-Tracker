import { describe, it, expect } from 'vitest';
import { rupeesToPaise, paiseToRupees, formatPaise } from '../src/currency/paise.js';

describe('paise currency utilities', () => {
  it('converts rupees to integer paise accurately', () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(100.5)).toBe(10050);
    expect(rupeesToPaise(100.55)).toBe(10055);
    expect(rupeesToPaise(100.555)).toBe(10056); // Rounds to nearest paise
    expect(rupeesToPaise(0)).toBe(0);
    expect(rupeesToPaise(-50.25)).toBe(-5025);
    expect(rupeesToPaise(NaN)).toBe(0);
    expect(rupeesToPaise(Infinity)).toBe(0);
  });

  it('converts integer paise to rupees accurately', () => {
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(10050)).toBe(100.5);
    expect(paiseToRupees(10055)).toBe(100.55);
    expect(paiseToRupees(0)).toBe(0);
    expect(paiseToRupees(-5025)).toBe(-50.25);
    expect(paiseToRupees(BigInt(10000))).toBe(100);
    expect(paiseToRupees(NaN)).toBe(0);
  });

  it('formats paise into Indian currency notation', () => {
    expect(formatPaise(10000000)).toBe('₹1,00,000');
    expect(formatPaise(123456789)).toBe('₹12,34,567.89');
    expect(formatPaise(5000)).toBe('₹50');
    expect(formatPaise(-250000)).toBe('-₹2,500');
    expect(formatPaise(10000, { showFraction: true })).toBe('₹100.00');
  });

  it('eliminates floating-point addition drift (0.10 + 0.20 === 0.30)', () => {
    // Standard JS float addition produces 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);

    // Integer paise conversion eliminates binary drift
    const sumPaise = rupeesToPaise(0.1) + rupeesToPaise(0.2);
    expect(sumPaise).toBe(30);
    expect(paiseToRupees(sumPaise)).toBe(0.3);
  });

  it('handles extreme bounds up to 10 Crore (100,000,000 rupees) with exact paise fidelity (QA-2)', () => {
    const tenCrore = 100000000;
    const paise = rupeesToPaise(tenCrore);
    expect(paise).toBe(10000000000); // 10 billion paise
    expect(paiseToRupees(paise)).toBe(tenCrore);
    expect(formatPaise(paise)).toBe('₹10,00,00,000');

    // 1 paise (0.01 rupee)
    expect(rupeesToPaise(0.01)).toBe(1);
    expect(paiseToRupees(1)).toBe(0.01);
    expect(formatPaise(1, { showFraction: true })).toBe('₹0.01');
  });
});
