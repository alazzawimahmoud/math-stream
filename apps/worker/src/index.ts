import { Worker } from 'bullmq';
import { getRedisConnection } from '@mathstream/queue';
import { connectDb, closeDb } from '@mathstream/db';
import type { JobPayload } from '@mathstream/shared';
import { processJob } from './processor.js';

async function main() {
  await connectDb();
  
  const worker = new Worker<JobPayload>(
    'mathstream-computations',
    processJob,
    {
      connection: getRedisConnection(),
      concurrency: 4,
    }
  );
  
  worker.on('completed', job => {
    console.log(`Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  
  console.log('MathStream Worker started, waiting for jobs...');
  
  const shutdown = async () => {
    console.log('Shutting down...');
    await worker.close();
    await closeDb();
    process.exit(0);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(console.error);
