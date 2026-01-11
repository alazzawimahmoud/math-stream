import { Worker } from 'bullmq';
import { getRedisConnection, QUEUE_NAME } from '@mathstream/queue';
import { connectDb, closeDb } from '@mathstream/db';
import { createNamedLogger, type JobPayload } from '@mathstream/shared';
import { processJob } from './processor';

const logger = createNamedLogger('worker');

async function main() {
  await connectDb();
  
  const worker = new Worker<JobPayload>(
    QUEUE_NAME,
    processJob,
    {
      connection: getRedisConnection(),
      concurrency: 4,
    }
  );
  
  worker.on('completed', job => {
    logger.debug(`Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });
  
  logger.info('MathStream Worker started, waiting for jobs...');
  
  const shutdown = async () => {
    logger.info('Shutting down...');
    await worker.close();
    await closeDb();
    process.exit(0);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(err => logger.error('Worker failed to start:', err));
