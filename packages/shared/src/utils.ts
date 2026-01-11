import { OperationType, type Result } from './schemas';

/**
 * All supported mathematical operations.
 * Derived from the OperationType zod enum.
 */
export const OPERATIONS = OperationType.options;

/**
 * Calculates the total progress from an array of results.
 * Returns the average progress across all 4 operations, rounded to the nearest integer.
 */
export function calculateTotalProgress(results: Pick<Result, 'progress'>[]): number {
  return Math.round(results.reduce((sum, r) => sum + r.progress, 0) / 4);
}
