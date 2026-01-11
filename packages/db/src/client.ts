import { MongoClient, Db } from 'mongodb';
import { getConfig, createNamedLogger } from '@mathstream/shared';

const logger = createNamedLogger('db');

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Gets or creates the shared MongoClient instance.
 * This allows other modules to reuse the same connection pool.
 */
export function getMongoClient(): MongoClient {
  if (!client) {
    const { MONGODB_URL } = getConfig();
    client = new MongoClient(MONGODB_URL);
  }
  return client;
}

export async function connectDb(): Promise<Db> {
  if (db) return db;
  
  const mongoClient = getMongoClient();
  await mongoClient.connect();
  db = mongoClient.db();
  
  logger.info('Connected to MongoDB');
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
