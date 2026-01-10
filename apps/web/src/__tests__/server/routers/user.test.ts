import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// Mock dependencies
const mockConnectDb = vi.fn();
const mockGetUserPreferences = vi.fn();
const mockUpdateUserPreferences = vi.fn();

vi.mock('@mathstream/db', () => ({
  connectDb: mockConnectDb,
  getUserPreferences: mockGetUserPreferences,
  updateUserPreferences: mockUpdateUserPreferences,
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
const { userRouter } = await import('@/server/routers/user');

// Helper to create a caller with session
function createTestCaller(userId: string | null = 'test-user-456') {
  const ctx = {
    session: userId ? { user: { id: userId, name: 'Test User', email: 'test@example.com' } } : null,
  };
  return userRouter.createCaller(ctx as any);
}

describe('userRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectDb.mockResolvedValue(undefined);
  });

  describe('getPreferences query', () => {
    it('returns user preferences', async () => {
      mockGetUserPreferences.mockResolvedValueOnce({ enableResultReuse: true });

      const caller = createTestCaller();
      const result = await caller.getPreferences();

      expect(mockGetUserPreferences).toHaveBeenCalledWith('test-user-456');
      expect(result).toEqual({ enableResultReuse: true });
    });

    it('returns default preferences for new user', async () => {
      mockGetUserPreferences.mockResolvedValueOnce({ enableResultReuse: false });

      const caller = createTestCaller();
      const result = await caller.getPreferences();

      expect(result.enableResultReuse).toBe(false);
    });

    it('requires authentication', async () => {
      const caller = createTestCaller(null);

      await expect(caller.getPreferences()).rejects.toThrow(TRPCError);
    });
  });

  describe('updatePreferences mutation', () => {
    it('updates and returns preferences', async () => {
      mockUpdateUserPreferences.mockResolvedValueOnce({ enableResultReuse: true });

      const caller = createTestCaller();
      const result = await caller.updatePreferences({ enableResultReuse: true });

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith('test-user-456', { enableResultReuse: true });
      expect(result).toEqual({ enableResultReuse: true });
    });

    it('handles partial updates', async () => {
      mockUpdateUserPreferences.mockResolvedValueOnce({ enableResultReuse: false });

      const caller = createTestCaller();
      const result = await caller.updatePreferences({});

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith('test-user-456', {});
      expect(result.enableResultReuse).toBe(false);
    });

    it('requires authentication', async () => {
      const caller = createTestCaller(null);

      await expect(caller.updatePreferences({ enableResultReuse: true })).rejects.toThrow(TRPCError);
    });
  });
});
