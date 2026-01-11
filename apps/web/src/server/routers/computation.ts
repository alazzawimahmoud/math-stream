import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { CreateComputationInput, calculateTotalProgress } from '@mathstream/shared';
import { createComputation, getComputation, getComputationsByUser, connectDb, getUserPreferences } from '@mathstream/db';
import { addComputationJobs } from '@mathstream/queue';
import { getCachedComputation, cacheComputation } from '@mathstream/cache';

// Initialize database connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDb();
    dbConnected = true;
  }
}

export const computationRouter = router({
  create: protectedProcedure
    .input(CreateComputationInput)
    .mutation(async ({ input, ctx }) => {
      await ensureDbConnection();
      const { a, b, mode } = input;
      const userId = ctx.session.user.id;
      
      const computationId = await createComputation(userId, a, b, mode);
      
      // Get user preferences and pass useCache flag
      const preferences = await getUserPreferences(userId);
      await addComputationJobs(
        computationId, 
        a, 
        b, 
        mode,
        preferences.enableResultReuse
      );
      
      // Return full computation for optimistic UI updates
      const computation = await getComputation(computationId);
      if (!computation) {
        throw new Error('Failed to create computation');
      }
      return computation;
    }),

  getStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      await ensureDbConnection();
      
      // Check cache first
      const cached = await getCachedComputation(input.id);
      if (cached) {
        const totalProgress = calculateTotalProgress(cached.results);
        return { ...cached, totalProgress, fromCache: true };
      }
      
      // Fetch from database
      const computation = await getComputation(input.id);
      if (!computation) {
        throw new Error('Computation not found');
      }
      
      // Cache if completed
      if (computation.status === 'completed') {
        await cacheComputation(computation);
      }
      
      // Calculate total progress
      const totalProgress = calculateTotalProgress(computation.results);
      
      return { ...computation, totalProgress, fromCache: false };
    }),

  getHistory: protectedProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(100).default(20),
      skip: z.number().min(0).default(0)
    }).optional())
    .query(async ({ ctx, input }) => {
      await ensureDbConnection();
      const userId = ctx.session.user.id;
      const limit = input?.limit ?? 20;
      const skip = input?.skip ?? 0;
      return getComputationsByUser(userId, limit, skip);
    }),
});
