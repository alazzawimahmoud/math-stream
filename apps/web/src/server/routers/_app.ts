import { router } from '../trpc';
import { computationRouter } from './computation';
import { userRouter } from './user';

export const appRouter = router({
  computation: computationRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

