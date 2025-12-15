// src/config/env.ts
// Environment configuration with validation

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  
  STEAM_API_KEY: z.string().min(1, 'STEAM_API_KEY is required'),
  STEAM_REALM: z.string().url(),
  STEAM_RETURN_URL: z.string().url(),
  
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missingVars = Object.keys(errors);

    console.error('');
    console.error('❌ FATAL: Missing required environment variables:');
    console.error(`   ${missingVars.join(', ')}`);
    console.error('');
    console.error('Details:');
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`   ${key}: ${(messages as string[]).join(', ')}`);
    }
    console.error('');
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
