import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

// Mock ioredis
vi.mock('ioredis', () => {
  const mockRedis = {
    quit: vi.fn().mockResolvedValue(undefined),
  };
  return {
    Redis: vi.fn(() => mockRedis),
    default: vi.fn(() => mockRedis),
  };
});

// Mock BullMQ
const mockQueue = {
  addBulk: vi.fn().mockResolvedValue([]),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('bullmq', () => ({
  Queue: vi.fn(() => mockQueue),
}));

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
const { getRedisConnection, getComputationQueue, addComputationJobs, closeQueue } = await import('./queue');
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

describe('Queue', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await closeQueue();
  });

  afterAll(async () => {
    await closeQueue();
  });

  describe('getRedisConnection', () => {
    it('creates connection with correct config', () => {
      const connection = getRedisConnection();
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', { maxRetriesPerRequest: null });
      expect(connection).toBeDefined();
    });

    it('returns singleton connection', () => {
      const conn1 = getRedisConnection();
      const conn2 = getRedisConnection();
      expect(conn1).toBe(conn2);
      expect(Redis).toHaveBeenCalledTimes(1);
    });
  });

  describe('getComputationQueue', () => {
    it('creates queue with correct name', () => {
      const queue = getComputationQueue();
      expect(Queue).toHaveBeenCalledWith('mathstream-computations', expect.any(Object));
      expect(queue).toBeDefined();
    });

    it('returns singleton queue', () => {
      const q1 = getComputationQueue();
      const q2 = getComputationQueue();
      expect(q1).toBe(q2);
      expect(Queue).toHaveBeenCalledTimes(1);
    });
  });

  describe('addComputationJobs', () => {
    it('adds 4 jobs (one per operation)', async () => {
      await addComputationJobs('comp-123', 10, 5, 'classic');

      expect(mockQueue.addBulk).toHaveBeenCalledTimes(1);
      const jobs = mockQueue.addBulk.mock.calls[0]![0];
      expect(jobs).toHaveLength(4);
    });

    it('creates jobs with correct operation names', async () => {
      await addComputationJobs('comp-123', 10, 5, 'classic');

      const jobs = mockQueue.addBulk.mock.calls[0]![0];
      const operationNames = jobs.map((j: { name: string }) => j.name);
      expect(operationNames).toEqual(['add', 'subtract', 'multiply', 'divide']);
    });

    it('includes correct data in each job', async () => {
      await addComputationJobs('comp-456', 20, 10, 'ai');

      const jobs = mockQueue.addBulk.mock.calls[0]![0];
      for (const job of jobs) {
        expect(job.data.computationId).toBe('comp-456');
        expect(job.data.a).toBe(20);
        expect(job.data.b).toBe(10);
        expect(job.data.mode).toBe('ai');
      }
    });

    it('includes useCache flag when provided', async () => {
      await addComputationJobs('comp-789', 15, 3, 'classic', true);

      const jobs = mockQueue.addBulk.mock.calls[0]![0];
      for (const job of jobs) {
        expect(job.data.useCache).toBe(true);
      }
    });

    it('defaults useCache to false', async () => {
      await addComputationJobs('comp-999', 15, 3, 'classic');

      const jobs = mockQueue.addBulk.mock.calls[0]![0];
      for (const job of jobs) {
        expect(job.data.useCache).toBe(false);
      }
    });
  });

  describe('closeQueue', () => {
    it('closes queue and connection', async () => {
      // Access queue and connection to initialize them
      getComputationQueue();
      getRedisConnection();

      await closeQueue();

      expect(mockQueue.close).toHaveBeenCalled();
    });

    it('handles multiple close calls', async () => {
      getComputationQueue();
      await closeQueue();
      await closeQueue(); // Should not throw
    });
  });
});
