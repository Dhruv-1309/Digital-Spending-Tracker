import { describe, it, expect } from 'vitest';
import {
  containsMathExpression,
  evaluateMathExpression,
} from '../src/calculations/mathEvaluator';

describe('mathEvaluator', () => {
  describe('containsMathExpression', () => {
    it('detects operators in inputs', () => {
      expect(containsMathExpression('100 + 200')).toBe(true);
      expect(containsMathExpression('50*2')).toBe(true);
      expect(containsMathExpression('50 x 2')).toBe(true);
      expect(containsMathExpression('50 X 2')).toBe(true);
      expect(containsMathExpression('100 - 50')).toBe(true);
      expect(containsMathExpression('100/2')).toBe(true);
      expect(containsMathExpression('(100 + 50)')).toBe(true);
      expect(containsMathExpression('100+')).toBe(true);
    });

    it('returns false for plain numbers', () => {
      expect(containsMathExpression('1200')).toBe(false);
      expect(containsMathExpression('1,25,000')).toBe(false);
      expect(containsMathExpression('0.00')).toBe(false);
      expect(containsMathExpression('')).toBe(false);
    });
  });

  describe('evaluateMathExpression', () => {
    it('evaluates addition correctly', () => {
      const res = evaluateMathExpression('100 + 200 + 300');
      expect(res.isValid).toBe(true);
      expect(res.result).toBe(600);
    });

    it('evaluates subtraction correctly', () => {
      const res = evaluateMathExpression('1000 - 250 - 50');
      expect(res.isValid).toBe(true);
      expect(res.result).toBe(700);
    });

    it('evaluates multiplication correctly with * and x', () => {
      expect(evaluateMathExpression('50 * 3').result).toBe(150);
      expect(evaluateMathExpression('50 x 3').result).toBe(150);
      expect(evaluateMathExpression('50 X 3').result).toBe(150);
    });

    it('evaluates division correctly', () => {
      expect(evaluateMathExpression('500 / 2').result).toBe(250);
      expect(evaluateMathExpression('100 / 4').result).toBe(25);
    });

    it('respects operator precedence (* and / before + and -)', () => {
      expect(evaluateMathExpression('10 + 20 * 3').result).toBe(70);
      expect(evaluateMathExpression('100 - 20 / 2').result).toBe(90);
    });

    it('supports parentheses for custom grouping', () => {
      expect(evaluateMathExpression('(10 + 20) * 3').result).toBe(90);
      expect(evaluateMathExpression('100 / (2 + 3)').result).toBe(20);
    });

    it('handles commas in numbers (Indian and standard)', () => {
      expect(evaluateMathExpression('1,500 + 2,500').result).toBe(4000);
      expect(evaluateMathExpression('1,25,000 + 75,000').result).toBe(200000);
    });

    it('handles decimal numbers and rounds float precision', () => {
      expect(evaluateMathExpression('10.50 + 20.25').result).toBe(30.75);
      expect(evaluateMathExpression('0.1 + 0.2').result).toBe(0.3);
    });

    it('handles unary minus / plus', () => {
      expect(evaluateMathExpression('-50 + 100').result).toBe(50);
      expect(evaluateMathExpression('+100 + 50').result).toBe(150);
    });

    it('returns isValid: false for incomplete expressions while user is typing', () => {
      expect(evaluateMathExpression('100 +').isValid).toBe(false);
      expect(evaluateMathExpression('100 *').isValid).toBe(false);
      expect(evaluateMathExpression('(100 + 50').isValid).toBe(false);
    });

    it('returns isValid: false for division by zero', () => {
      const res = evaluateMathExpression('100 / 0');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Division by zero');
    });

    it('returns isValid: false for invalid characters', () => {
      expect(evaluateMathExpression('100 + abc').isValid).toBe(false);
    });
  });
});
