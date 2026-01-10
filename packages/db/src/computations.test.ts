import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createComputation,
  getComputation,
  getComputationsByUser,
  updateResultProgress,
  updateResultComplete,
  findCompletedResult,
} from './computations';
import { connectDb, closeDb, getDb } from './client';

describe('Computations', () => {
  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clear the computations collection before each test
    const db = getDb();
    await db.collection('computations').deleteMany({});
  });

  describe('createComputation', () => {
    it('creates a computation with correct structure', async () => {
      const id = await createComputation('user123', 10, 5, 'classic');
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(24); // ObjectId hex string length
    });

    it('creates 4 result entries for each operation', async () => {
      const id = await createComputation('user123', 10, 5, 'classic');
      const computation = await getComputation(id);
      
      expect(computation?.results).toHaveLength(4);
      expect(computation?.results.map(r => r.operation)).toEqual([
        'add', 'subtract', 'multiply', 'divide'
      ]);
    });

    it('initializes all results with pending status and 0 progress', async () => {
      const id = await createComputation('user123', 10, 5, 'classic');
      const computation = await getComputation(id);
      
      for (const result of computation!.results) {
        expect(result.status).toBe('pending');
        expect(result.progress).toBe(0);
        expect(result.result).toBeNull();
        expect(result.error).toBeNull();
        expect(result.completedAt).toBeNull();
      }
    });

    it('stores mode correctly', async () => {
      const classicId = await createComputation('user123', 10, 5, 'classic');
      const aiId = await createComputation('user123', 10, 5, 'ai');
      
      const classicComp = await getComputation(classicId);
      const aiComp = await getComputation(aiId);
      
      expect(classicComp?.mode).toBe('classic');
      expect(aiComp?.mode).toBe('ai');
    });

    it('stores createdAt and updatedAt timestamps', async () => {
      const before = new Date();
      const id = await createComputation('user123', 10, 5, 'classic');
      const after = new Date();
      
      const computation = await getComputation(id);
      
      expect(computation?.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(computation?.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(computation?.updatedAt).toEqual(computation?.createdAt);
    });
  });

  describe('getComputation', () => {
    it('retrieves computation by ID', async () => {
      const id = await createComputation('user123', 42, 17, 'classic');
      const computation = await getComputation(id);
      
      expect(computation).toBeDefined();
      expect(computation?._id).toBe(id);
      expect(computation?.a).toBe(42);
      expect(computation?.b).toBe(17);
      expect(computation?.userId).toBe('user123');
    });

    it('returns null for non-existent ID', async () => {
      const computation = await getComputation('507f1f77bcf86cd799439011');
      expect(computation).toBeNull();
    });
  });

  describe('getComputationsByUser', () => {
    it('returns computations for specific user', async () => {
      await createComputation('user1', 1, 1, 'classic');
      await createComputation('user1', 2, 2, 'classic');
      await createComputation('user2', 3, 3, 'classic');
      
      const { computations } = await getComputationsByUser('user1');
      
      expect(computations).toHaveLength(2);
      expect(computations.every(c => c.userId === 'user1')).toBe(true);
    });

    it('sorts by createdAt descending', async () => {
      await createComputation('user1', 1, 1, 'classic');
      await new Promise(r => setTimeout(r, 10));
      await createComputation('user1', 2, 2, 'classic');
      await new Promise(r => setTimeout(r, 10));
      await createComputation('user1', 3, 3, 'classic');
      
      const { computations } = await getComputationsByUser('user1');
      
      expect(computations[0]?.a).toBe(3);
      expect(computations[1]?.a).toBe(2);
      expect(computations[2]?.a).toBe(1);
    });

    it('respects limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await createComputation('user1', i, i, 'classic');
      }
      
      const { computations, hasMore } = await getComputationsByUser('user1', 3);
      
      expect(computations).toHaveLength(3);
      expect(hasMore).toBe(true);
    });

    it('respects skip parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await createComputation('user1', i, i, 'classic');
      }
      
      const { computations } = await getComputationsByUser('user1', 20, 2);
      
      expect(computations).toHaveLength(3);
    });

    it('returns total count', async () => {
      for (let i = 0; i < 5; i++) {
        await createComputation('user1', i, i, 'classic');
      }
      
      const { total } = await getComputationsByUser('user1', 2);
      
      expect(total).toBe(5);
    });

    it('returns hasMore=false when no more items', async () => {
      await createComputation('user1', 1, 1, 'classic');
      await createComputation('user1', 2, 2, 'classic');
      
      const { hasMore } = await getComputationsByUser('user1', 10);
      
      expect(hasMore).toBe(false);
    });
  });

  describe('updateResultProgress', () => {
    it('updates progress for specific operation', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      
      await updateResultProgress(id, 'add', 50);
      
      const computation = await getComputation(id);
      const addResult = computation?.results.find(r => r.operation === 'add');
      
      expect(addResult?.progress).toBe(50);
      expect(addResult?.status).toBe('processing');
    });

    it('sets computation status to processing', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      
      await updateResultProgress(id, 'multiply', 25);
      
      const computation = await getComputation(id);
      expect(computation?.status).toBe('processing');
    });

    it('updates only the targeted operation', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      
      await updateResultProgress(id, 'add', 75);
      
      const computation = await getComputation(id);
      const otherResults = computation?.results.filter(r => r.operation !== 'add');
      
      for (const result of otherResults!) {
        expect(result.progress).toBe(0);
        expect(result.status).toBe('pending');
      }
    });
  });

  describe('updateResultComplete', () => {
    it('completes result with success', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      
      await updateResultComplete(id, 'add', 15, null);
      
      const computation = await getComputation(id);
      const addResult = computation?.results.find(r => r.operation === 'add');
      
      expect(addResult?.progress).toBe(100);
      expect(addResult?.result).toBe(15);
      expect(addResult?.status).toBe('completed');
      expect(addResult?.error).toBeNull();
      expect(addResult?.completedAt).toBeInstanceOf(Date);
    });

    it('completes result with error', async () => {
      const id = await createComputation('user1', 10, 0, 'classic');
      
      await updateResultComplete(id, 'divide', null, 'Division by zero');
      
      const computation = await getComputation(id);
      const divideResult = computation?.results.find(r => r.operation === 'divide');
      
      expect(divideResult?.progress).toBe(100);
      expect(divideResult?.result).toBeNull();
      expect(divideResult?.status).toBe('failed');
      expect(divideResult?.error).toBe('Division by zero');
    });

    it('sets computation status to completed when all results done', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      
      await updateResultComplete(id, 'add', 15, null);
      await updateResultComplete(id, 'subtract', 5, null);
      await updateResultComplete(id, 'multiply', 50, null);
      await updateResultComplete(id, 'divide', 2, null);
      
      const computation = await getComputation(id);
      expect(computation?.status).toBe('completed');
    });

    it('sets computation status to completed even with failed results', async () => {
      const id = await createComputation('user1', 10, 0, 'classic');
      
      await updateResultComplete(id, 'add', 10, null);
      await updateResultComplete(id, 'subtract', 10, null);
      await updateResultComplete(id, 'multiply', 0, null);
      await updateResultComplete(id, 'divide', null, 'Division by zero');
      
      const computation = await getComputation(id);
      expect(computation?.status).toBe('completed');
    });
  });

  describe('findCompletedResult', () => {
    it('finds completed result matching a, b, mode, operation', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      await updateResultComplete(id, 'add', 15, null);
      
      const result = await findCompletedResult(10, 5, 'classic', 'add');
      
      expect(result).toBeDefined();
      expect(result?.result).toBe(15);
      expect(result?.error).toBeNull();
    });

    it('returns null when no matching result exists', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      await updateResultComplete(id, 'add', 15, null);
      
      // Different values
      const result = await findCompletedResult(20, 10, 'classic', 'add');
      
      expect(result).toBeNull();
    });

    it('returns null when operation not completed', async () => {
      const id = await createComputation('user1', 10, 5, 'classic');
      await updateResultProgress(id, 'add', 50);
      
      const result = await findCompletedResult(10, 5, 'classic', 'add');
      
      expect(result).toBeNull();
    });

    it('distinguishes between modes', async () => {
      const classicId = await createComputation('user1', 10, 5, 'classic');
      await updateResultComplete(classicId, 'add', 15, null);
      
      // Should not find AI mode result
      const aiResult = await findCompletedResult(10, 5, 'ai', 'add');
      expect(aiResult).toBeNull();
      
      // Should find classic mode result
      const classicResult = await findCompletedResult(10, 5, 'classic', 'add');
      expect(classicResult?.result).toBe(15);
    });

    it('returns failed result with error', async () => {
      const id = await createComputation('user1', 10, 0, 'classic');
      await updateResultComplete(id, 'divide', null, 'Division by zero');
      
      const result = await findCompletedResult(10, 0, 'classic', 'divide');
      
      expect(result?.result).toBeNull();
      expect(result?.error).toBe('Division by zero');
    });
  });
});
