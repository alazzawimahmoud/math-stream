import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared',
  'packages/db',
  'packages/cache',
  'packages/queue',
  'apps/worker',
  'apps/web',
]);
