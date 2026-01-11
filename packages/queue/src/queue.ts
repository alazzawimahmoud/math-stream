import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { getConfig, OPERATIONS, type JobPayload, type ComputationMode } from '@mathstream/shared';

let connection: Redis | null = null;
let queue: Queue<JobPayload> | null = null;

export const QUEUE_NAME = 'mathstream-computations';

export function getRedisConnection(): Redis {
  if (!connection) {
    const { REDIS_URL } = getConfig();
    connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getComputationQueue(): Queue<JobPayload> {
  if (!queue) {
    queue = new Queue<JobPayload>(QUEUE_NAME, {
      connection: getRedisConnection(),
    });
  }
  return queue!;
}

export async function addComputationJobs(
  computationId: string,
  a: number,
  b: number,
  mode: ComputationMode,
  useCache: boolean = false
): Promise<void> {
  const queue = getComputationQueue();
  
  const jobs = OPERATIONS.map(operation => ({
    name: operation,
    data: { computationId, operation, a, b, mode, useCache },
  }));
  
  await queue.addBulk(jobs);
}

export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
