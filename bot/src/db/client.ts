import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton for bot database
 */
export const prisma = new PrismaClient();

/**
 * Test database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Graceful disconnect
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
