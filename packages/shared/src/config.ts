import { z } from 'zod';

export const envSchema = z.object({
  // Database
  MONGODB_URL: z.string(),
  REDIS_URL: z.string(),
  
  // Worker
  JOB_DELAY_MS: z.coerce.number().min(100).default(3000),
  
  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  
  // AI
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
  
  // General
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function getConfig(): Env {
  return envSchema.parse(process.env);
}
