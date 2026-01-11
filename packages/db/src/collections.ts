/**
 * Centralized collection names for the MongoDB database.
 * Using constants prevents typos and makes refactoring easier.
 */
export const COLLECTIONS = {
  COMPUTATIONS: 'computations',
  USERS: 'users',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
