import type { Job } from 'bullmq';
import { getConfig, calculateTotalProgress, createNamedLogger, type JobPayload } from '@mathstream/shared';
import { updateResultProgress, updateResultComplete, findCompletedResult, getComputation } from '@mathstream/db';
import { getCachedResult, cacheResult, publishComputationUpdate } from '@mathstream/cache';
import { calculateClassic } from './calculators/classic';
import { calculateAI } from './calculators/ai';

const logger = createNamedLogger('processor');

async function publishUpdate(computationId: string): Promise<void> {
  const computation = await getComputation(computationId);
  if (computation) {
    const totalProgress = calculateTotalProgress(computation.results);
    await publishComputationUpdate(computationId, {
      computationId,
      status: computation.status,
      results: computation.results,
      totalProgress,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomIntervals(totalMs: number, count: number): number[] {
  const points = Array.from({ length: count - 1 }, () => Math.random() * totalMs);
  points.sort((a, b) => a - b);
  
  const intervals: number[] = [];
  let prev = 0;
  for (const point of points) {
    intervals.push(Math.round(point - prev));
    prev = point;
  }
  intervals.push(Math.round(totalMs - prev));
  
  return intervals;
}

function randomJitter(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export async function processJob(job: Job<JobPayload>): Promise<void> {
  const { computationId, operation, a, b, mode, useCache } = job.data;
  const { JOB_DELAY_MS } = getConfig();
  
  logger.debug(`Processing ${operation} (${mode} mode) for computation ${computationId}`);
  
  // Only perform result reuse if useCache is true
  if (useCache) {
    // 1. Check cache first
    const cachedResult = await getCachedResult(a, b, mode, operation);
    if (cachedResult) {
      await updateResultComplete(computationId, operation, cachedResult.result, cachedResult.error);
      await publishUpdate(computationId);
      logger.debug(`Cache hit for ${operation}: ${cachedResult.result ?? cachedResult.error}`);
      return;
    }
    
    // 2. Check database
    const dbResult = await findCompletedResult(a, b, mode, operation);
    if (dbResult) {
      await cacheResult(a, b, mode, operation, dbResult.result, dbResult.error);
      await updateResultComplete(computationId, operation, dbResult.result, dbResult.error);
      await publishUpdate(computationId);
      logger.debug(`DB hit for ${operation}: ${dbResult.result ?? dbResult.error}`);
      return;
    }
  }
  
  // 3. No existing result found or caching disabled - compute normally
  const intervals = generateRandomIntervals(JOB_DELAY_MS, 3);
  let elapsedTime = 0;
  
  for (let i = 0; i < intervals.length; i++) {
    await sleep(intervals[i]!);
    elapsedTime += intervals[i]!;
    
    const baseProgress = (elapsedTime / JOB_DELAY_MS) * 100;
    const progress = Math.min(99, Math.round(baseProgress + randomJitter(-5, 5)));
    
    const isLastStep = i === intervals.length - 1;
    
    if (!isLastStep) {
      await updateResultProgress(computationId, operation, progress);
      await publishUpdate(computationId);
    } else {
      // Use appropriate calculator based on mode
      const { result, error } = mode === 'ai' 
        ? await calculateAI(operation, a, b)
        : calculateClassic(operation, a, b);
      
      // 4. Cache the new result after computation
      await cacheResult(a, b, mode, operation, result, error);
      await updateResultComplete(computationId, operation, result, error);
      await publishUpdate(computationId);
      logger.debug(`Completed ${operation} (${mode}): ${result ?? error}`);
    }
  }
}
