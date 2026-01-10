import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { getConfig, type JobPayload, type ComputationMode } from '@mathstream/shared';

let connection: Redis | null = null;
let queue: Queue<JobPayload> | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    const { REDIS_URL } = getConfig();
    connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getComputationQueue(): Queue<JobPayload> {
  if (!queue) {
    queue = new Queue<JobPayload>('mathstream-computations', {
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
  const operations = ['add', 'subtract', 'multiply', 'divide'] as const;
  
  const jobs = operations.map(operation => ({
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
