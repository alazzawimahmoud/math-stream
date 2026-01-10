import { Redis } from 'ioredis';
import { getConfig, type Computation, type ComputationMode, type OperationType } from '@mathstream/shared';

let redis: Redis | null = null;

const CACHE_PREFIX = 'mathstream:computation:';
const RESULT_PREFIX = 'mathstream:result:';
const CACHE_TTL_SECONDS = 3600; // 1 hour

interface CachedResult {
  result: number | null;
  error: string | null;
}

function getRedis(): Redis {
  if (!redis) {
    const { REDIS_URL } = getConfig();
    redis = new Redis(REDIS_URL);
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

export async function getCachedResult(
  a: number,
  b: number,
  mode: ComputationMode,
  operation: OperationType
): Promise<CachedResult | null> {
  const client = getRedis();
  const key = `${RESULT_PREFIX}${a}:${b}:${mode}:${operation}`;
  const cached = await client.get(key);
  
  if (!cached) return null;
  
  return JSON.parse(cached) as CachedResult;
}

export async function cacheResult(
  a: number,
  b: number,
  mode: ComputationMode,
  operation: OperationType,
  result: number | null,
  error: string | null
): Promise<void> {
  const client = getRedis();
  const key = `${RESULT_PREFIX}${a}:${b}:${mode}:${operation}`;
  const cachedResult: CachedResult = { result, error };
  
  await client.setex(
    key,
    CACHE_TTL_SECONDS,
    JSON.stringify(cachedResult)
  );
}
