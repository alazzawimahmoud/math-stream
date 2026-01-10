import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getUserPreferences, updateUserPreferences } from './users';
import { connectDb, closeDb, getDb } from './client';

describe('Users', () => {
  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    const db = getDb();
    await db.collection('users').deleteMany({});
  });

  describe('getUserPreferences', () => {
    it('returns default preferences for new user', async () => {
      const preferences = await getUserPreferences('newuser');
      
      expect(preferences).toEqual({
        enableResultReuse: false,
      });
    });

    it('returns saved preferences for existing user', async () => {
      const db = getDb();
      await db.collection('users').insertOne({
        userId: 'existinguser',
        preferences: { enableResultReuse: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const preferences = await getUserPreferences('existinguser');
      
      expect(preferences.enableResultReuse).toBe(true);
    });

    it('returns defaults when user document exists but has no preferences', async () => {
      const db = getDb();
      await db.collection('users').insertOne({
        userId: 'usernoprefs',
        createdAt: new Date(),
      });
      
      const preferences = await getUserPreferences('usernoprefs');
      
      expect(preferences).toEqual({
        enableResultReuse: false,
      });
    });

    it('returns default for missing enableResultReuse in preferences', async () => {
      const db = getDb();
      await db.collection('users').insertOne({
        userId: 'partialuser',
        preferences: {},
        createdAt: new Date(),
      });
      
      const preferences = await getUserPreferences('partialuser');
      
      expect(preferences.enableResultReuse).toBe(false);
    });
  });

  describe('updateUserPreferences', () => {
    it('creates user document if not exists (upsert)', async () => {
      const result = await updateUserPreferences('newuser', {
        enableResultReuse: true,
      });
      
      expect(result.enableResultReuse).toBe(true);
      
      // Verify it's in the database
      const db = getDb();
      const doc = await db.collection('users').findOne({ userId: 'newuser' });
      expect(doc?.preferences.enableResultReuse).toBe(true);
    });

    it('updates existing user preferences', async () => {
      // First create
      await updateUserPreferences('user1', { enableResultReuse: false });
      
      // Then update
      const result = await updateUserPreferences('user1', { enableResultReuse: true });
      
      expect(result.enableResultReuse).toBe(true);
    });

    it('merges partial updates with existing preferences', async () => {
      // Set initial preference
      await updateUserPreferences('user2', { enableResultReuse: true });
      
      // Update with empty object (should keep existing)
      const result = await updateUserPreferences('user2', {});
      
      expect(result.enableResultReuse).toBe(true);
    });

    it('returns updated preferences', async () => {
      const result = await updateUserPreferences('user3', {
        enableResultReuse: true,
      });
      
      expect(result).toEqual({
        enableResultReuse: true,
      });
    });

    it('sets updatedAt timestamp', async () => {
      const before = new Date();
      await updateUserPreferences('user4', { enableResultReuse: true });
      const after = new Date();
      
      const db = getDb();
      const doc = await db.collection('users').findOne({ userId: 'user4' });
      
      expect(doc?.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(doc?.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('sets createdAt only on first insert', async () => {
      await updateUserPreferences('user5', { enableResultReuse: false });
      
      const db = getDb();
      const firstDoc = await db.collection('users').findOne({ userId: 'user5' });
      const firstCreatedAt = firstDoc?.createdAt;
      
      // Wait a bit and update
      await new Promise(r => setTimeout(r, 10));
      await updateUserPreferences('user5', { enableResultReuse: true });
      
      const secondDoc = await db.collection('users').findOne({ userId: 'user5' });
      
      expect(secondDoc?.createdAt.getTime()).toBe(firstCreatedAt?.getTime());
    });
  });
});
