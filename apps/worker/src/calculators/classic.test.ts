import { describe, it, expect } from 'vitest';
import { roundIfDecimal, calculateClassic } from './classic';

describe('roundIfDecimal', () => {
  it('preserves integers', () => {
    expect(roundIfDecimal(42)).toBe(42);
    expect(roundIfDecimal(0)).toBe(0);
    expect(roundIfDecimal(-100)).toBe(-100);
  });

  it('rounds decimals to 6 places', () => {
    expect(roundIfDecimal(3.14159265359)).toBe(3.141593);
    expect(roundIfDecimal(0.1234567890)).toBe(0.123457);
  });

  it('preserves short decimals', () => {
    expect(roundIfDecimal(3.14)).toBe(3.14);
    expect(roundIfDecimal(0.5)).toBe(0.5);
  });

  it('handles negative decimals', () => {
    expect(roundIfDecimal(-3.14159265359)).toBe(-3.141593);
  });
});

describe('calculateClassic', () => {
  describe('addition', () => {
    it('adds two positive numbers', () => {
      const result = calculateClassic('add', 10, 5);
      expect(result).toEqual({ result: 15, error: null });
    });

    it('adds negative numbers', () => {
      const result = calculateClassic('add', -10, -5);
      expect(result).toEqual({ result: -15, error: null });
    });

    it('adds mixed sign numbers', () => {
      const result = calculateClassic('add', 10, -5);
      expect(result).toEqual({ result: 5, error: null });
    });

    it('adds decimal numbers', () => {
      const result = calculateClassic('add', 0.1, 0.2);
      expect(result.result).toBeCloseTo(0.3, 5);
      expect(result.error).toBeNull();
    });

    it('adds zero', () => {
      const result = calculateClassic('add', 42, 0);
      expect(result).toEqual({ result: 42, error: null });
    });
  });

  describe('subtraction', () => {
    it('subtracts two positive numbers', () => {
      const result = calculateClassic('subtract', 10, 5);
      expect(result).toEqual({ result: 5, error: null });
    });

    it('subtracts negative numbers', () => {
      const result = calculateClassic('subtract', -10, -5);
      expect(result).toEqual({ result: -5, error: null });
    });

    it('subtracts mixed sign numbers', () => {
      const result = calculateClassic('subtract', 10, -5);
      expect(result).toEqual({ result: 15, error: null });
    });

    it('subtracts decimal numbers', () => {
      const result = calculateClassic('subtract', 10.5, 3.2);
      expect(result.result).toBeCloseTo(7.3, 5);
    });

    it('subtracts to negative result', () => {
      const result = calculateClassic('subtract', 5, 10);
      expect(result).toEqual({ result: -5, error: null });
    });
  });

  describe('multiplication', () => {
    it('multiplies two positive numbers', () => {
      const result = calculateClassic('multiply', 6, 7);
      expect(result).toEqual({ result: 42, error: null });
    });

    it('multiplies negative numbers', () => {
      const result = calculateClassic('multiply', -3, -4);
      expect(result).toEqual({ result: 12, error: null });
    });

    it('multiplies mixed sign numbers', () => {
      const result = calculateClassic('multiply', 5, -3);
      expect(result).toEqual({ result: -15, error: null });
    });

    it('multiplies by zero', () => {
      const result = calculateClassic('multiply', 100, 0);
      expect(result).toEqual({ result: 0, error: null });
    });

    it('multiplies decimal numbers', () => {
      const result = calculateClassic('multiply', 2.5, 4);
      expect(result).toEqual({ result: 10, error: null });
    });

    it('handles large numbers', () => {
      const result = calculateClassic('multiply', 1000000, 1000000);
      expect(result).toEqual({ result: 1000000000000, error: null });
    });
  });

  describe('division', () => {
    it('divides two positive numbers', () => {
      const result = calculateClassic('divide', 20, 4);
      expect(result).toEqual({ result: 5, error: null });
    });

    it('divides negative numbers', () => {
      const result = calculateClassic('divide', -20, -4);
      expect(result).toEqual({ result: 5, error: null });
    });

    it('divides mixed sign numbers', () => {
      const result = calculateClassic('divide', 20, -4);
      expect(result).toEqual({ result: -5, error: null });
    });

    it('handles division with decimal result', () => {
      const result = calculateClassic('divide', 10, 3);
      expect(result.result).toBeCloseTo(3.333333, 5);
      expect(result.error).toBeNull();
    });

    it('returns error for division by zero', () => {
      const result = calculateClassic('divide', 10, 0);
      expect(result).toEqual({ result: null, error: 'Division by zero' });
    });

    it('divides zero by non-zero', () => {
      const result = calculateClassic('divide', 0, 5);
      expect(result).toEqual({ result: 0, error: null });
    });
  });

  describe('edge cases', () => {
    it('returns error for unknown operation', () => {
      const result = calculateClassic('power' as any, 2, 3);
      expect(result).toEqual({ result: null, error: 'Unknown operation' });
    });

    it('handles very small decimals', () => {
      // Note: roundIfDecimal rounds to 6 decimal places, so very small numbers get rounded
      const result = calculateClassic('add', 0.000001, 0.000002);
      expect(result.result).toBeCloseTo(0.000003, 6);
    });

    it('handles very large numbers', () => {
      const result = calculateClassic('add', Number.MAX_SAFE_INTEGER, 1);
      expect(result.result).toBe(Number.MAX_SAFE_INTEGER + 1);
    });
  });
});
