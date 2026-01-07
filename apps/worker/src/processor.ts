import type { Job } from 'bullmq';
import { getConfig, type JobPayload } from '@mathstream/shared';
import { updateResultProgress, updateResultComplete } from '@mathstream/db';
import { calculateClassic } from './calculators/classic';
import { calculateAI } from './calculators/ai';

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
  const { computationId, operation, a, b, mode } = job.data;
  const { JOB_DELAY_MS } = getConfig();
  
  console.log(`Processing ${operation} (${mode} mode) for computation ${computationId}`);
  
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
    } else {
      // Use appropriate calculator based on mode
      const { result, error } = mode === 'ai' 
        ? await calculateAI(operation, a, b)
        : calculateClassic(operation, a, b);
      
      await updateResultComplete(computationId, operation, result, error);
      console.log(`Completed ${operation} (${mode}): ${result ?? error}`);
    }
  }
}

