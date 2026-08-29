import { PrismaClient, Prisma } from '@prisma/client';

// Serialize Decimal fields as JSON numbers instead of strings.
// Prisma's Decimal.js default toJSON returns a string, which breaks frontend
// code that expects `number` for price fields. For ETB (2 decimal places)
// the precision loss from Number() is negligible.
// This must run before any query is executed.
(Prisma.Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        // Supabase pooler: keep the pool small to avoid exhausting the
        // shared PgBouncer pool, and fail fast instead of hanging ~5s.
        url: process.env.DATABASE_URL?.includes('?')
          ? `${process.env.DATABASE_URL}&connection_limit=5&pool_timeout=10`
          : `${process.env.DATABASE_URL}?connection_limit=5&pool_timeout=10`,
      },
    },
  });

// Always cache on the global object. On Vercel, warm serverless invocations
// reuse the same Node process — without this, every request would spin up a
// brand-new PrismaClient (and a new DB connection pool), causing slow queries
// and quickly exhausting the database connection limit.
globalForPrisma.prisma = prisma;
