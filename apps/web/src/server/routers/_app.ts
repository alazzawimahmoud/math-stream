import { router } from '../trpc';
import { computationRouter } from './computation';

export const appRouter = router({
  computation: computationRouter,
});

export type AppRouter = typeof appRouter;

