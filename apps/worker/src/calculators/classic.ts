import type { OperationType } from '@mathstream/shared';

export function roundIfDecimal(value: number): number {
  if (!Number.isInteger(value)) {
    return parseFloat(value.toFixed(6));
  }
  return value;
}

export function calculateClassic(
  operation: OperationType,
  a: number,
  b: number
): { result: number | null; error: string | null } {
  switch (operation) {
    case 'add':
      return { result: roundIfDecimal(a + b), error: null };
    case 'subtract':
      return { result: roundIfDecimal(a - b), error: null };
    case 'multiply':
      return { result: roundIfDecimal(a * b), error: null };
    case 'divide':
      if (b === 0) return { result: null, error: 'Division by zero' };
      return { result: roundIfDecimal(a / b), error: null };
    default:
      return { result: null, error: 'Unknown operation' };
  }
}

