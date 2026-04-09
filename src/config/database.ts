import { PrismaClient } from '@prisma/client';
import { config } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDevelopment
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: config.database.url
      ? {
          db: {
            url: config.database.url,
          },
        }
      : undefined,
  });

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[database] Connected to PostgreSQL');
  } catch (error) {
    console.error('[database] Failed to connect:', error);
    console.warn(
      '[database] The server will start but database operations will fail. ' +
      'Ensure DATABASE_URL is set correctly in your .env file.'
    );
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('[database] Disconnected from PostgreSQL');
}

export default prisma;
