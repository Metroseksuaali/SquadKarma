import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

/**
 * Prisma Client singleton instance
 *
 * SQLite doesn't need an adapter like PostgreSQL does.
 * We create a single instance and reuse it throughout the application.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isDevelopment
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

/**
 * Prevent multiple instances in development (hot reload)
 */
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (config.isDevelopment) {
  globalThis.prismaGlobal = prisma;
}

/**
 * Gracefully disconnect from database on shutdown
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('Database connection closed');
}

/**
 * Health check for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
