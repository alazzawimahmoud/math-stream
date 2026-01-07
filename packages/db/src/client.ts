import { MongoClient, Db } from 'mongodb';
import { getConfig } from '@mathstream/shared';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db) return db;
  
  const { MONGODB_URL } = getConfig();
  client = new MongoClient(MONGODB_URL);
  await client.connect();
  db = client.db();
  
  console.log('Connected to MongoDB');
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
