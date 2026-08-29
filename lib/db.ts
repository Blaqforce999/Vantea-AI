import { PrismaClient } from '@prisma/client';

/**
 * Single Prisma client for the whole app. Never call `new PrismaClient()`
 * anywhere else — multiple clients exhaust the connection pool in dev
 * (hot reload) and on serverless. See .agents/rules/architecture.md.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
