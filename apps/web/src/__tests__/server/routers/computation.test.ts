import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// Mock all dependencies
const mockConnectDb = vi.fn();
const mockCreateComputation = vi.fn();
const mockGetComputation = vi.fn();
const mockGetComputationsByUser = vi.fn();
const mockGetUserPreferences = vi.fn();

vi.mock('@mathstream/db', () => ({
  connectDb: mockConnectDb,
  createComputation: mockCreateComputation,
  getComputation: mockGetComputation,
  getComputationsByUser: mockGetComputationsByUser,
  getUserPreferences: mockGetUserPreferences,
}));

const mockAddComputationJobs = vi.fn();
vi.mock('@mathstream/queue', () => ({
  addComputationJobs: mockAddComputationJobs,
}));

const mockGetCachedComputation = vi.fn();
const mockCacheComputation = vi.fn();
vi.mock('@mathstream/cache', () => ({
  getCachedComputation: mockGetCachedComputation,
  cacheComputation: mockCacheComputation,
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Import after mocks
const { computationRouter } = await import('@/server/routers/computation');
import { createContext } from '@/server/trpc';

// Helper to create a caller with session
function createTestCaller(userId: string | null = 'test-user-123') {
  const ctx = {
    session: userId ? { user: { id: userId, name: 'Test User', email: 'test@example.com' } } : null,
  };
  return computationRouter.createCaller(ctx as any);
}

describe('computationRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectDb.mockResolvedValue(undefined);
    mockGetUserPreferences.mockResolvedValue({ enableResultReuse: false });
  });

  describe('create mutation', () => {
    it('creates computation with correct params', async () => {
      const mockComputation = {
        _id: 'comp-123',
        userId: 'test-user-123',
        a: 10,
        b: 5,
        mode: 'classic',
        status: 'pending',
        results: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockCreateComputation.mockResolvedValueOnce('comp-123');
      mockGetComputation.mockResolvedValueOnce(mockComputation);

      const caller = createTestCaller();
      const result = await caller.create({ a: 10, b: 5, mode: 'classic' });

      expect(mockCreateComputation).toHaveBeenCalledWith('test-user-123', 10, 5, 'classic');
      expect(result._id).toBe('comp-123');
    });

    it('adds jobs to queue with user preferences', async () => {
      mockCreateComputation.mockResolvedValueOnce('comp-456');
      mockGetComputation.mockResolvedValueOnce({
        _id: 'comp-456',
        userId: 'test-user-123',
        a: 20,
        b: 10,
        mode: 'ai',
        status: 'pending',
        results: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockGetUserPreferences.mockResolvedValueOnce({ enableResultReuse: true });

      const caller = createTestCaller();
      await caller.create({ a: 20, b: 10, mode: 'ai' });

      expect(mockAddComputationJobs).toHaveBeenCalledWith('comp-456', 20, 10, 'ai', true);
    });

    it('returns full computation object', async () => {
      const mockComputation = {
        _id: 'comp-789',
        userId: 'test-user-123',
        a: 5,
        b: 3,
        mode: 'classic',
        status: 'pending',
        results: [
          { operation: 'add', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreateComputation.mockResolvedValueOnce('comp-789');
      mockGetComputation.mockResolvedValueOnce(mockComputation);

      const caller = createTestCaller();
      const result = await caller.create({ a: 5, b: 3, mode: 'classic' });

      expect(result).toMatchObject({
        _id: 'comp-789',
        a: 5,
        b: 3,
        mode: 'classic',
      });
    });

    it('requires authentication', async () => {
      const caller = createTestCaller(null);

      await expect(caller.create({ a: 10, b: 5, mode: 'classic' })).rejects.toThrow(TRPCError);
    });
  });

  describe('getStatus query', () => {
    it('returns from cache when available', async () => {
      const cachedComputation = {
        _id: 'cached-id',
        userId: 'test-user-123',
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
      mockGetCachedComputation.mockResolvedValueOnce(cachedComputation);

      const caller = createTestCaller();
      const result = await caller.getStatus({ id: 'cached-id' });

      expect(mockGetCachedComputation).toHaveBeenCalledWith('cached-id');
      expect(result.fromCache).toBe(true);
      expect(mockGetComputation).not.toHaveBeenCalled();
    });

    it('fetches from DB when not cached', async () => {
      const dbComputation = {
        _id: 'db-id',
        userId: 'test-user-123',
        a: 10,
        b: 5,
        mode: 'classic',
        status: 'processing',
        results: [
          { operation: 'add', progress: 50, result: null, status: 'processing', error: null, completedAt: null },
          { operation: 'subtract', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
          { operation: 'multiply', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
          { operation: 'divide', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGetCachedComputation.mockResolvedValueOnce(null);
      mockGetComputation.mockResolvedValueOnce(dbComputation);

      const caller = createTestCaller();
      const result = await caller.getStatus({ id: 'db-id' });

      expect(mockGetComputation).toHaveBeenCalledWith('db-id');
      expect(result.fromCache).toBe(false);
    });

    it('caches completed computations', async () => {
      const completedComputation = {
        _id: 'completed-id',
        userId: 'test-user-123',
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
      mockGetCachedComputation.mockResolvedValueOnce(null);
      mockGetComputation.mockResolvedValueOnce(completedComputation);

      const caller = createTestCaller();
      await caller.getStatus({ id: 'completed-id' });

      expect(mockCacheComputation).toHaveBeenCalledWith(completedComputation);
    });

    it('calculates totalProgress correctly', async () => {
      const computation = {
        _id: 'progress-id',
        userId: 'test-user-123',
        a: 10,
        b: 5,
        mode: 'classic',
        status: 'processing',
        results: [
          { operation: 'add', progress: 100, result: 15, status: 'completed', error: null, completedAt: new Date() },
          { operation: 'subtract', progress: 50, result: null, status: 'processing', error: null, completedAt: null },
          { operation: 'multiply', progress: 25, result: null, status: 'processing', error: null, completedAt: null },
          { operation: 'divide', progress: 25, result: null, status: 'processing', error: null, completedAt: null },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGetCachedComputation.mockResolvedValueOnce(null);
      mockGetComputation.mockResolvedValueOnce(computation);

      const caller = createTestCaller();
      const result = await caller.getStatus({ id: 'progress-id' });

      // (100 + 50 + 25 + 25) / 4 = 50
      expect(result.totalProgress).toBe(50);
    });

    it('requires authentication', async () => {
      const caller = createTestCaller(null);

      await expect(caller.getStatus({ id: 'some-id' })).rejects.toThrow(TRPCError);
    });
  });

  describe('getHistory query', () => {
    it('returns paginated results', async () => {
      const mockHistory = {
        computations: [
          { _id: 'comp-1', a: 1, b: 1, mode: 'classic', status: 'completed', results: [], createdAt: new Date(), updatedAt: new Date() },
          { _id: 'comp-2', a: 2, b: 2, mode: 'classic', status: 'completed', results: [], createdAt: new Date(), updatedAt: new Date() },
        ],
        hasMore: true,
        total: 50,
      };
      mockGetComputationsByUser.mockResolvedValueOnce(mockHistory);

      const caller = createTestCaller();
      const result = await caller.getHistory({ limit: 2, skip: 0 });

      expect(result.computations).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(50);
    });

    it('respects limit and skip', async () => {
      mockGetComputationsByUser.mockResolvedValueOnce({
        computations: [],
        hasMore: false,
        total: 100,
      });

      const caller = createTestCaller();
      await caller.getHistory({ limit: 10, skip: 20 });

      expect(mockGetComputationsByUser).toHaveBeenCalledWith('test-user-123', 10, 20);
    });

    it('requires authentication', async () => {
      const caller = createTestCaller(null);

      await expect(caller.getHistory()).rejects.toThrow(TRPCError);
    });
  });
});
