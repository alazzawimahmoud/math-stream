import { connectDb } from '@mathstream/db';

let dbConnected = false;

/**
 * Ensures the database connection is established.
 * Safe to call multiple times - only connects once.
 */
export async function ensureDbConnection(): Promise<void> {
  if (!dbConnected) {
    await connectDb();
    dbConnected = true;
  }
}
