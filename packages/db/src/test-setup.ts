import { MongoMemoryServer } from 'mongodb-memory-server';
import { vi, beforeAll, afterAll } from 'vitest';

let mongod: MongoMemoryServer;

// Mock getConfig before any tests run
vi.mock('@mathstream/shared', async () => {
  const actual = await vi.importActual('@mathstream/shared');
  return {
    ...actual,
    getConfig: () => ({
      MONGODB_URL: process.env.MONGODB_TEST_URL || 'mongodb://localhost:27017/test',
    }),
  };
});

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_TEST_URL = mongod.getUri();
  
  // Re-mock with actual URL
  vi.doMock('@mathstream/shared', async () => {
    const actual = await vi.importActual('@mathstream/shared');
    return {
      ...actual,
      getConfig: () => ({
        MONGODB_URL: mongod.getUri(),
      }),
    };
  });
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});

export { mongod };
