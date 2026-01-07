import type { OperationType } from '@mathstream/shared';

export function calculateClassic(
  operation: OperationType,
  a: number,
  b: number
): { result: number | null; error: string | null } {
  switch (operation) {
    case 'add':
      return { result: a + b, error: null };
    case 'subtract':
      return { result: a - b, error: null };
    case 'multiply':
      return { result: a * b, error: null };
    case 'divide':
      if (b === 0) return { result: null, error: 'Division by zero' };
      return { result: a / b, error: null };
    default:
      return { result: null, error: 'Unknown operation' };
  }
}

