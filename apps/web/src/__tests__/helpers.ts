import type { Context } from '@/server/trpc';

interface TestSession {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Creates a test context with an optional authenticated user.
 * @param userId - User ID for the session, or null for unauthenticated
 * @returns A Context object suitable for testing tRPC routers
 */
export function createTestContext(userId: string | null = 'test-user-123'): Context {
  return {
    session: userId
      ? {
          user: { id: userId, name: 'Test User', email: 'test@example.com' },
        } as TestSession
      : null,
  } as Context;
}

/**
 * Creates a tRPC caller for testing a router with authentication.
 * @param router - The tRPC router to create a caller for
 * @param userId - User ID for the session, or null for unauthenticated
 * @returns A caller instance for the router
 */
export function createTestCaller<T extends { createCaller: (ctx: Context) => unknown }>(
  router: T,
  userId: string | null = 'test-user-123'
): ReturnType<T['createCaller']> {
  const ctx = createTestContext(userId);
  return router.createCaller(ctx) as ReturnType<T['createCaller']>;
}
