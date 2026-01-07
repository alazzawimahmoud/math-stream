import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { CreateComputationInput } from '@mathstream/shared';
import { createComputation, getComputation, getComputationsByUser, connectDb } from '@mathstream/db';
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
      await addComputationJobs(computationId, a, b, mode);
      
      return { id: computationId };
    }),

  getStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      await ensureDbConnection();
      
      // Check cache first
      const cached = await getCachedComputation(input.id);
      if (cached) {
        const totalProgress = Math.round(
          cached.results.reduce((sum, r) => sum + r.progress, 0) / 4
        );
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
      const totalProgress = Math.round(
        computation.results.reduce((sum, r) => sum + r.progress, 0) / 4
      );
      
      return { ...computation, totalProgress, fromCache: false };
    }),

  getHistory: protectedProcedure
    .query(async ({ ctx }) => {
      await ensureDbConnection();
      const userId = ctx.session.user.id;
      return getComputationsByUser(userId);
    }),
});
