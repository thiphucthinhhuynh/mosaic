import { PrismaClient } from '@/generated/prisma/client';

// tsx watch re-evaluates this module on every file change in dev; stashing
// the client on `global` survives that reload so we don't open a fresh
// connection pool on every save. See docs/architecture.md §19.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
