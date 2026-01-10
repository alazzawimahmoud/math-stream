import { describe, it, expect, beforeEach, afterAll, vi, beforeAll } from 'vitest';
import type { Computation } from '@mathstream/shared';

// Mock ioredis with ioredis-mock
vi.mock('ioredis', async () => {
  const RedisMock = (await import('ioredis-mock')).default;
  return {
    Redis: RedisMock,
    default: RedisMock,
  };
});

// Mock getConfig
vi.mock('@mathstream/shared', async () => {
  const actual = await vi.importActual('@mathstream/shared');
  return {
    ...actual,
    getConfig: () => ({
      REDIS_URL: 'redis://localhost:6379',
    }),
  };
});

// Import after mocking
const {
  getCachedComputation,
  cacheComputation,
  invalidateCache,
  getCachedResult,
  cacheResult,
  closeCache,
} = await import('./cache');

describe('Cache', () => {
  beforeEach(async () => {
    // Close and reset cache before each test
    await closeCache();
  });

  afterAll(async () => {
    await closeCache();
  });

  describe('getCachedComputation', () => {
    it('returns null for cache miss', async () => {
      const result = await getCachedComputation('nonexistent-id');
      expect(result).toBeNull();
    });

    it('returns parsed computation with restored dates', async () => {
      const computation: Computation = {
        _id: 'test-id-123',
        userId: 'user123',
        a: 10,
        b: 5,
        mode: 'classic',
        status: 'completed',
        results: [
          { operation: 'add', progress: 100, result: 15, status: 'completed', error: null, completedAt: new Date('2024-01-01') },
          { operation: 'subtract', progress: 100, result: 5, status: 'completed', error: null, completedAt: new Date('2024-01-01') },
          { operation: 'multiply', progress: 100, result: 50, status: 'completed', error: null, completedAt: new Date('2024-01-01') },
          { operation: 'divide', progress: 100, result: 2, status: 'completed', error: null, completedAt: new Date('2024-01-01') },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      await cacheComputation(computation);
      const cached = await getCachedComputation('test-id-123');

      expect(cached).toBeDefined();
      expect(cached?._id).toBe('test-id-123');
      expect(cached?.createdAt).toBeInstanceOf(Date);
      expect(cached?.updatedAt).toBeInstanceOf(Date);
      expect(cached?.results[0]?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('cacheComputation', () => {
    it('only caches completed computations', async () => {
      const pendingComputation: Computation = {
        _id: 'pending-id',
        userId: 'user123',
        a: 10,
        b: 5,
        mode: 'classic',
        status: 'pending',
        results: [
          { operation: 'add', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
          { operation: 'subtract', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
          { operation: 'multiply', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
          { operation: 'divide', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await cacheComputation(pendingComputation);
      const cached = await getCachedComputation('pending-id');

      expect(cached).toBeNull();
    });

    it('caches completed computation', async () => {
      const completedComputation: Computation = {
        _id: 'completed-id',
        userId: 'user123',
        a: 10,
        b: 5,
        mode: 'classic',
        status: 'completed',
        results: [
          { operation: 'add', progress: 100, result: 15, status: 'completed', error: null, completedAt: new Date() },
          { operation: 'subtract', progress: 100, result: 5, status: 'completed', error: null, completedAt: new Date() },
          { operation: 'multiply', progress: 100, result: 50, status: 'completed', error: null, completedAt: new Date() },
          { operation: 'divide', progress: 100, result: 2, status: 'completed', error: null, completedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await cacheComputation(completedComputation);
      const cached = await getCachedComputation('completed-id');

      expect(cached).toBeDefined();
      expect(cached?._id).toBe('completed-id');
    });
  });

  describe('invalidateCache', () => {
    it('removes entry from cache', async () => {
      const computation: Computation = {
        _id: 'to-invalidate',
        userId: 'user123',
        a: 10,
        b: 5,
        mode: 'classic',
        status: 'completed',
        results: [
          { operation: 'add', progress: 100, result: 15, status: 'completed', error: null, completedAt: new Date() },
          { operation: 'subtract', progress: 100, result: 5, status: 'completed', error: null, completedAt: new Date() },
          { operation: 'multiply', progress: 100, result: 50, status: 'completed', error: null, completedAt: new Date() },
          { operation: 'divide', progress: 100, result: 2, status: 'completed', error: null, completedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await cacheComputation(computation);
      let cached = await getCachedComputation('to-invalidate');
      expect(cached).toBeDefined();

      await invalidateCache('to-invalidate');
      cached = await getCachedComputation('to-invalidate');
      expect(cached).toBeNull();
    });
  });

  describe('getCachedResult', () => {
    it('returns null for cache miss', async () => {
      const result = await getCachedResult(100, 200, 'classic', 'add');
      expect(result).toBeNull();
    });

    it('returns cached result', async () => {
      await cacheResult(10, 5, 'classic', 'add', 15, null);
      const cached = await getCachedResult(10, 5, 'classic', 'add');

      expect(cached).toBeDefined();
      expect(cached?.result).toBe(15);
      expect(cached?.error).toBeNull();
    });
  });

  describe('cacheResult', () => {
    it('stores result with correct key format', async () => {
      await cacheResult(10, 5, 'classic', 'multiply', 50, null);
      
      // Verify by retrieving
      const cached = await getCachedResult(10, 5, 'classic', 'multiply');
      expect(cached?.result).toBe(50);
    });

    it('stores error result', async () => {
      await cacheResult(10, 0, 'classic', 'divide', null, 'Division by zero');
      
      const cached = await getCachedResult(10, 0, 'classic', 'divide');
      expect(cached?.result).toBeNull();
      expect(cached?.error).toBe('Division by zero');
    });

    it('distinguishes between modes', async () => {
      await cacheResult(10, 5, 'classic', 'add', 15, null);
      await cacheResult(10, 5, 'ai', 'add', 15, null);

      const classicCached = await getCachedResult(10, 5, 'classic', 'add');
      const aiCached = await getCachedResult(10, 5, 'ai', 'add');

      expect(classicCached?.result).toBe(15);
      expect(aiCached?.result).toBe(15);
    });

    it('distinguishes between operations', async () => {
      await cacheResult(10, 5, 'classic', 'add', 15, null);
      await cacheResult(10, 5, 'classic', 'subtract', 5, null);

      const addCached = await getCachedResult(10, 5, 'classic', 'add');
      const subCached = await getCachedResult(10, 5, 'classic', 'subtract');

      expect(addCached?.result).toBe(15);
      expect(subCached?.result).toBe(5);
    });
  });

  describe('closeCache', () => {
    it('handles close gracefully', async () => {
      // First access to create connection
      await getCachedComputation('some-id');
      
      // Close should not throw
      await expect(closeCache()).resolves.not.toThrow();
    });

    it('handles multiple close calls', async () => {
      await getCachedComputation('some-id');
      await closeCache();
      await expect(closeCache()).resolves.not.toThrow();
    });
  });
});
