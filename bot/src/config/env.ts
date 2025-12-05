import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable schema for Discord bot
 */
const envSchema = z.object({
  // Discord
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Steam OAuth
  STEAM_CALLBACK_URL: z.string().url('STEAM_CALLBACK_URL must be a valid URL'),
  OAUTH_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)).optional().default('3001'),
  OAUTH_HOST: z.string().optional().default('0.0.0.0'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional().default('squad-karma-bot-encryption-key-change-in-production!!'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

/**
 * Parse and validate environment variables
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

/**
 * Configuration object
 */
export const config = {
  discord: {
    token: env.DISCORD_TOKEN,
    clientId: env.DISCORD_CLIENT_ID,
  },
  database: {
    url: env.DATABASE_URL,
  },
  steam: {
    callbackUrl: env.STEAM_CALLBACK_URL,
  },
  oauth: {
    port: env.OAUTH_PORT,
    host: env.OAUTH_HOST,
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;
