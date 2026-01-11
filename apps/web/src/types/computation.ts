import type { Computation } from '@mathstream/shared';

/**
 * Represents a real-time computation update from SSE.
 * This type mirrors the ComputationUpdate from @mathstream/cache
 * but is safe to use in client-side code.
 */
export interface ComputationUpdate {
  computationId: string;
  status: Computation['status'];
  results: Computation['results'];
  totalProgress: number;
}
