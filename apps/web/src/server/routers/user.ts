import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { getUserPreferences, updateUserPreferences } from '@mathstream/db';
import { ensureDbConnection } from '@/lib/db';

export const userRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    await ensureDbConnection();
    const userId = ctx.session.user.id;
    return getUserPreferences(userId);
  }),
  
  updatePreferences: protectedProcedure
    .input(z.object({
      enableResultReuse: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await ensureDbConnection();
      const userId = ctx.session.user.id;
      return updateUserPreferences(userId, input);
    }),
});
