import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Always cache on the global object. On Vercel, warm serverless invocations
// reuse the same Node process — without this, every request would spin up a
// brand-new PrismaClient (and a new DB connection pool), causing slow queries
// and quickly exhausting the database connection limit.
globalForPrisma.prisma = prisma;
