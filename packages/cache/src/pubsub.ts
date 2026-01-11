import { Redis } from 'ioredis';
import { getConfig, type Computation } from '@mathstream/shared';

const PUBSUB_PREFIX = 'mathstream:updates:';

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    const { REDIS_URL } = getConfig();
    publisher = new Redis(REDIS_URL);
  }
  return publisher;
}

function createSubscriber(): Redis {
  const { REDIS_URL } = getConfig();
  return new Redis(REDIS_URL);
}

export interface ComputationUpdate {
  computationId: string;
  status: Computation['status'];
  results: Computation['results'];
  totalProgress: number;
}

/**
 * Publish a computation update to Redis pub/sub
 */
export async function publishComputationUpdate(
  computationId: string,
  data: ComputationUpdate
): Promise<void> {
  const client = getPublisher();
  const channel = `${PUBSUB_PREFIX}${computationId}`;
  await client.publish(channel, JSON.stringify(data));
}

/**
 * Subscribe to computation updates for a specific computation.
 * Returns an unsubscribe function to clean up the subscription.
 */
export function subscribeToComputation(
  computationId: string,
  callback: (data: ComputationUpdate) => void
): { unsubscribe: () => Promise<void>; subscriber: Redis } {
  const subscriber = createSubscriber();
  const channel = `${PUBSUB_PREFIX}${computationId}`;

  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${channel}:`, err);
    }
  });

  subscriber.on('message', (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        const data = JSON.parse(message) as ComputationUpdate;
        callback(data);
      } catch (err) {
        console.error('Failed to parse computation update:', err);
      }
    }
  });

  const unsubscribe = async () => {
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
  };

  return { unsubscribe, subscriber };
}

export async function closePublisher(): Promise<void> {
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
}
