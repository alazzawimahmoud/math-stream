import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { connectDb, getDb, closeDb } from './client';

describe('Database Client', () => {
  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Reset the connection state between tests
    await closeDb();
  });

  describe('connectDb', () => {
    it('establishes a connection and returns db instance', async () => {
      const db = await connectDb();
      expect(db).toBeDefined();
      expect(db.databaseName).toBeDefined();
    });

    it('returns same instance on subsequent calls', async () => {
      const db1 = await connectDb();
      const db2 = await connectDb();
      expect(db1).toBe(db2);
    });
  });

  describe('getDb', () => {
    it('throws error when not connected', () => {
      expect(() => getDb()).toThrow('Database not connected');
    });

    it('returns db instance after connection', async () => {
      await connectDb();
      const db = getDb();
      expect(db).toBeDefined();
    });
  });

  describe('closeDb', () => {
    it('closes connection and resets state', async () => {
      await connectDb();
      await closeDb();
      expect(() => getDb()).toThrow('Database not connected');
    });

    it('handles multiple close calls gracefully', async () => {
      await connectDb();
      await closeDb();
      await closeDb(); // Should not throw
      expect(() => getDb()).toThrow('Database not connected');
    });
  });
});
