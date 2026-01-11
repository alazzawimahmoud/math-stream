import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Job } from 'bullmq';
import type { JobPayload } from '@mathstream/shared';

// Mock dependencies
vi.mock('@mathstream/shared', async () => {
  const actual = await vi.importActual('@mathstream/shared');
  return {
    ...actual,
    getConfig: () => ({
      JOB_DELAY_MS: 100, // Short delay for tests
    }),
  };
});

const mockUpdateResultProgress = vi.fn();
const mockUpdateResultComplete = vi.fn();
const mockFindCompletedResult = vi.fn();
const mockGetComputation = vi.fn();

vi.mock('@mathstream/db', () => ({
  updateResultProgress: mockUpdateResultProgress,
  updateResultComplete: mockUpdateResultComplete,
  findCompletedResult: mockFindCompletedResult,
  getComputation: mockGetComputation,
}));

const mockGetCachedResult = vi.fn();
const mockCacheResult = vi.fn();
const mockPublishComputationUpdate = vi.fn();

vi.mock('@mathstream/cache', () => ({
  getCachedResult: mockGetCachedResult,
  cacheResult: mockCacheResult,
  publishComputationUpdate: mockPublishComputationUpdate,
}));

const mockCalculateClassic = vi.fn();
vi.mock('./calculators/classic', () => ({
  calculateClassic: mockCalculateClassic,
}));

const mockCalculateAI = vi.fn();
vi.mock('./calculators/ai', () => ({
  calculateAI: mockCalculateAI,
}));

// Import after mocking
const { processJob } = await import('./processor');

function createMockJob(data: JobPayload): Job<JobPayload> {
  return {
    data,
    id: 'test-job-id',
  } as Job<JobPayload>;
}

describe('processJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateClassic.mockReturnValue({ result: 15, error: null });
    mockCalculateAI.mockResolvedValue({ result: 15, error: null });
    // Mock getComputation to return a valid computation for publishUpdate
    mockGetComputation.mockResolvedValue({
      _id: 'test-comp',
      status: 'processing',
      results: [
        { operation: 'add', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
        { operation: 'subtract', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
        { operation: 'multiply', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
        { operation: 'divide', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
      ],
    });
  });

  describe('cache behavior', () => {
    it('uses cache when useCache=true and cache hit', async () => {
      mockGetCachedResult.mockResolvedValueOnce({ result: 15, error: null });

      const job = createMockJob({
        computationId: 'comp-1',
        operation: 'add',
        a: 10,
        b: 5,
        mode: 'classic',
        useCache: true,
      });

      await processJob(job);

      expect(mockGetCachedResult).toHaveBeenCalledWith(10, 5, 'classic', 'add');
      expect(mockUpdateResultComplete).toHaveBeenCalledWith('comp-1', 'add', 15, null);
      expect(mockCalculateClassic).not.toHaveBeenCalled();
    });

    it('uses DB when useCache=true, cache miss, DB hit', async () => {
      mockGetCachedResult.mockResolvedValueOnce(null);
      mockFindCompletedResult.mockResolvedValueOnce({ result: 15, error: null });

      const job = createMockJob({
        computationId: 'comp-2',
        operation: 'add',
        a: 10,
        b: 5,
        mode: 'classic',
        useCache: true,
      });

      await processJob(job);

      expect(mockGetCachedResult).toHaveBeenCalled();
      expect(mockFindCompletedResult).toHaveBeenCalledWith(10, 5, 'classic', 'add');
      expect(mockCacheResult).toHaveBeenCalledWith(10, 5, 'classic', 'add', 15, null);
      expect(mockUpdateResultComplete).toHaveBeenCalledWith('comp-2', 'add', 15, null);
      expect(mockCalculateClassic).not.toHaveBeenCalled();
    });

    it('computes when useCache=false', async () => {
      const job = createMockJob({
        computationId: 'comp-3',
        operation: 'add',
        a: 10,
        b: 5,
        mode: 'classic',
        useCache: false,
      });

      await processJob(job);

      expect(mockGetCachedResult).not.toHaveBeenCalled();
      expect(mockFindCompletedResult).not.toHaveBeenCalled();
      expect(mockCalculateClassic).toHaveBeenCalledWith('add', 10, 5);
    });

    it('computes when no cached result exists', async () => {
      mockGetCachedResult.mockResolvedValueOnce(null);
      mockFindCompletedResult.mockResolvedValueOnce(null);

      const job = createMockJob({
        computationId: 'comp-4',
        operation: 'multiply',
        a: 6,
        b: 7,
        mode: 'classic',
        useCache: true,
      });

      await processJob(job);

      expect(mockCalculateClassic).toHaveBeenCalledWith('multiply', 6, 7);
    });
  });

  describe('progress updates', () => {
    it('updates progress during processing', async () => {
      const job = createMockJob({
        computationId: 'comp-5',
        operation: 'add',
        a: 10,
        b: 5,
        mode: 'classic',
        useCache: false,
      });

      await processJob(job);

      // Should be called during intermediate steps (not the last step)
      expect(mockUpdateResultProgress).toHaveBeenCalled();
    });
  });

  describe('calculator selection', () => {
    it('calls classic calculator for classic mode', async () => {
      const job = createMockJob({
        computationId: 'comp-6',
        operation: 'subtract',
        a: 10,
        b: 5,
        mode: 'classic',
        useCache: false,
      });

      await processJob(job);

      expect(mockCalculateClassic).toHaveBeenCalledWith('subtract', 10, 5);
      expect(mockCalculateAI).not.toHaveBeenCalled();
    });

    it('calls AI calculator for ai mode', async () => {
      const job = createMockJob({
        computationId: 'comp-7',
        operation: 'multiply',
        a: 8,
        b: 4,
        mode: 'ai',
        useCache: false,
      });

      await processJob(job);

      expect(mockCalculateAI).toHaveBeenCalledWith('multiply', 8, 4);
      expect(mockCalculateClassic).not.toHaveBeenCalled();
    });
  });

  describe('result caching', () => {
    it('caches result after computation', async () => {
      mockCalculateClassic.mockReturnValue({ result: 50, error: null });

      const job = createMockJob({
        computationId: 'comp-8',
        operation: 'multiply',
        a: 10,
        b: 5,
        mode: 'classic',
        useCache: false,
      });

      await processJob(job);

      expect(mockCacheResult).toHaveBeenCalledWith(10, 5, 'classic', 'multiply', 50, null);
    });

    it('caches error result after computation', async () => {
      mockCalculateClassic.mockReturnValue({ result: null, error: 'Division by zero' });

      const job = createMockJob({
        computationId: 'comp-9',
        operation: 'divide',
        a: 10,
        b: 0,
        mode: 'classic',
        useCache: false,
      });

      await processJob(job);

      expect(mockCacheResult).toHaveBeenCalledWith(10, 0, 'classic', 'divide', null, 'Division by zero');
    });
  });

  describe('result completion', () => {
    it('calls updateResultComplete with success', async () => {
      mockCalculateClassic.mockReturnValue({ result: 15, error: null });

      const job = createMockJob({
        computationId: 'comp-10',
        operation: 'add',
        a: 10,
        b: 5,
        mode: 'classic',
        useCache: false,
      });

      await processJob(job);

      expect(mockUpdateResultComplete).toHaveBeenCalledWith('comp-10', 'add', 15, null);
    });

    it('calls updateResultComplete with error', async () => {
      mockCalculateClassic.mockReturnValue({ result: null, error: 'Division by zero' });

      const job = createMockJob({
        computationId: 'comp-11',
        operation: 'divide',
        a: 10,
        b: 0,
        mode: 'classic',
        useCache: false,
      });

      await processJob(job);

      expect(mockUpdateResultComplete).toHaveBeenCalledWith('comp-11', 'divide', null, 'Division by zero');
    });
  });
});
