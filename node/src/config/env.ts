import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable schema validation using Zod
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Discord Bot
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_GUILD_ID: z.string().optional(), // Optional - for guild-specific commands

  // Steam OAuth
  STEAM_API_KEY: z.string().min(1, 'STEAM_API_KEY is required'),
  STEAM_CALLBACK_URL: z.string().url('STEAM_CALLBACK_URL must be a valid URL'),

  // Node Configuration
  NODE_ID: z.string().min(1, 'NODE_ID is required'),
  NODE_NAME: z.string().min(1, 'NODE_NAME is required'),
  LOG_FILE_PATH: z.string().min(1, 'LOG_FILE_PATH is required'),

  // Replication
  TRUSTED_NODES: z.string().optional(), // Comma-separated list of trusted node URLs
  REPLICATION_SECRET: z.string().min(32, 'REPLICATION_SECRET must be at least 32 characters'),

  // API
  PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)).optional().default('3000'),
  HOST: z.string().optional().default('0.0.0.0'),
  API_KEY: z.string().min(32, 'API_KEY must be at least 32 characters'),

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
 * Parse trusted nodes from comma-separated string
 */
export function getTrustedNodes(): string[] {
  if (!env.TRUSTED_NODES) {
    return [];
  }
  return env.TRUSTED_NODES.split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);
}

/**
 * Configuration object for easy access
 */
export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  discord: {
    token: env.DISCORD_TOKEN,
    clientId: env.DISCORD_CLIENT_ID,
    guildId: env.DISCORD_GUILD_ID,
  },
  steam: {
    apiKey: env.STEAM_API_KEY,
    callbackUrl: env.STEAM_CALLBACK_URL,
  },
  node: {
    id: env.NODE_ID,
    name: env.NODE_NAME,
    logFilePath: env.LOG_FILE_PATH,
  },
  replication: {
    trustedNodes: getTrustedNodes(),
    secret: env.REPLICATION_SECRET,
  },
  api: {
    port: env.PORT,
    host: env.HOST,
    key: env.API_KEY,
  },
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;
