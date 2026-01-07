// Computation router will be added in step 8.4
import { router, protectedProcedure } from '../trpc';

export const computationRouter = router({
  placeholder: protectedProcedure.query(() => 'placeholder'),
});

