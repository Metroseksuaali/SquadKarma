// src/config/env.ts
// Environment configuration with validation

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  STEAM_API_KEY: z.string().min(1, 'STEAM_API_KEY is required'),
  STEAM_REALM: z.string().url(),
  STEAM_RETURN_URL: z.string().url(),
  
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  
  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
