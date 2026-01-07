import IORedis from 'ioredis';
import { getConfig, type Computation } from '@mathstream/shared';

let redis: IORedis | null = null;

const CACHE_PREFIX = 'mathstream:computation:';
const CACHE_TTL_SECONDS = 3600; // 1 hour

function getRedis(): IORedis {
  if (!redis) {
    const { REDIS_URL } = getConfig();
    redis = new IORedis(REDIS_URL);
  }
  return redis;
}

export async function getCachedComputation(id: string): Promise<Computation | null> {
  const client = getRedis();
  const cached = await client.get(`${CACHE_PREFIX}${id}`);
  
  if (!cached) return null;
  
  const parsed = JSON.parse(cached);
  // Restore date objects
  parsed.createdAt = new Date(parsed.createdAt);
  parsed.updatedAt = new Date(parsed.updatedAt);
  parsed.results = parsed.results.map((r: Record<string, unknown>) => ({
    ...r,
    completedAt: r.completedAt ? new Date(r.completedAt as string) : null,
  }));
  
  return parsed as Computation;
}

export async function cacheComputation(computation: Computation): Promise<void> {
  // Only cache completed computations
  if (computation.status !== 'completed') return;
  
  const client = getRedis();
  await client.setex(
    `${CACHE_PREFIX}${computation._id}`,
    CACHE_TTL_SECONDS,
    JSON.stringify(computation)
  );
}

export async function invalidateCache(id: string): Promise<void> {
  const client = getRedis();
  await client.del(`${CACHE_PREFIX}${id}`);
}

export async function closeCache(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
