import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { envSchema, getConfig } from './config';

describe('envSchema', () => {
  const validEnv = {
    MONGODB_URL: 'mongodb://localhost:27017/mathstream',
    REDIS_URL: 'redis://localhost:6379',
    JOB_DELAY_MS: '3000',
    BETTER_AUTH_SECRET: 'a-very-long-secret-key-at-least-32-chars',
    BETTER_AUTH_URL: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    GOOGLE_GENERATIVE_AI_API_KEY: 'google-ai-key',
    NODE_ENV: 'development',
  };

  it('parses valid environment variables', () => {
    const result = envSchema.parse(validEnv);
    expect(result.MONGODB_URL).toBe(validEnv.MONGODB_URL);
    expect(result.REDIS_URL).toBe(validEnv.REDIS_URL);
    expect(result.JOB_DELAY_MS).toBe(3000);
  });

  it('coerces JOB_DELAY_MS from string to number', () => {
    const result = envSchema.parse(validEnv);
    expect(typeof result.JOB_DELAY_MS).toBe('number');
    expect(result.JOB_DELAY_MS).toBe(3000);
  });

  it('applies default value for JOB_DELAY_MS', () => {
    const { JOB_DELAY_MS, ...envWithoutDelay } = validEnv;
    const result = envSchema.parse(envWithoutDelay);
    expect(result.JOB_DELAY_MS).toBe(3000);
  });

  it('applies default value for NODE_ENV', () => {
    const { NODE_ENV, ...envWithoutNodeEnv } = validEnv;
    const result = envSchema.parse(envWithoutNodeEnv);
    expect(result.NODE_ENV).toBe('development');
  });

  it('accepts production NODE_ENV', () => {
    const result = envSchema.parse({ ...validEnv, NODE_ENV: 'production' });
    expect(result.NODE_ENV).toBe('production');
  });

  it('rejects invalid NODE_ENV', () => {
    expect(() => envSchema.parse({ ...validEnv, NODE_ENV: 'staging' })).toThrow();
  });

  it('enforces minimum JOB_DELAY_MS of 100', () => {
    expect(() => envSchema.parse({ ...validEnv, JOB_DELAY_MS: '50' })).toThrow();
  });

  it('accepts JOB_DELAY_MS at minimum (100)', () => {
    const result = envSchema.parse({ ...validEnv, JOB_DELAY_MS: '100' });
    expect(result.JOB_DELAY_MS).toBe(100);
  });

  it('enforces minimum length for BETTER_AUTH_SECRET', () => {
    expect(() => envSchema.parse({ ...validEnv, BETTER_AUTH_SECRET: 'short' })).toThrow();
  });

  it('validates BETTER_AUTH_URL is a valid URL', () => {
    expect(() => envSchema.parse({ ...validEnv, BETTER_AUTH_URL: 'not-a-url' })).toThrow();
  });

  it('requires MONGODB_URL', () => {
    const { MONGODB_URL, ...envWithoutMongo } = validEnv;
    expect(() => envSchema.parse(envWithoutMongo)).toThrow();
  });

  it('requires REDIS_URL', () => {
    const { REDIS_URL, ...envWithoutRedis } = validEnv;
    expect(() => envSchema.parse(envWithoutRedis)).toThrow();
  });

  it('requires GOOGLE_CLIENT_ID', () => {
    const { GOOGLE_CLIENT_ID, ...envWithoutGoogleId } = validEnv;
    expect(() => envSchema.parse(envWithoutGoogleId)).toThrow();
  });

  it('requires GOOGLE_CLIENT_SECRET', () => {
    const { GOOGLE_CLIENT_SECRET, ...envWithoutGoogleSecret } = validEnv;
    expect(() => envSchema.parse(envWithoutGoogleSecret)).toThrow();
  });

  it('requires GOOGLE_GENERATIVE_AI_API_KEY', () => {
    const { GOOGLE_GENERATIVE_AI_API_KEY, ...envWithoutAiKey } = validEnv;
    expect(() => envSchema.parse(envWithoutAiKey)).toThrow();
  });
});

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns parsed config from process.env', () => {
    process.env = {
      MONGODB_URL: 'mongodb://localhost:27017/test',
      REDIS_URL: 'redis://localhost:6379',
      JOB_DELAY_MS: '5000',
      BETTER_AUTH_SECRET: 'a-very-long-secret-key-at-least-32-chars',
      BETTER_AUTH_URL: 'http://localhost:3000',
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      GOOGLE_GENERATIVE_AI_API_KEY: 'ai-key',
      NODE_ENV: 'development',
    };

    const config = getConfig();
    expect(config.MONGODB_URL).toBe('mongodb://localhost:27017/test');
    expect(config.JOB_DELAY_MS).toBe(5000);
  });

  it('throws when required env vars are missing', () => {
    process.env = {};
    expect(() => getConfig()).toThrow();
  });
});
