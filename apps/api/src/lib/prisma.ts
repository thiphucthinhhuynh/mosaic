import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { env } from '@/config/env';

// Prisma 7's default generator no longer bundles a query engine — it requires
// an explicit driver adapter (here, node-postgres) to actually connect.
// See docs/architecture.md §19.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// tsx watch re-evaluates this module on every file change in dev; stashing
// the client on `global` survives that reload so we don't open a fresh
// connection pool on every save.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
