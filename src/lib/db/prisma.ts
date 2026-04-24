import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const createPrismaClient = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl && (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mariadb://'))) {
    try {
      const url = new URL(dbUrl);
      const adapter = new PrismaMariaDb({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: decodeURIComponent(url.password),
        database: url.pathname.substring(1).split('?')[0] || 'test',
        connectionLimit: 30,
        acquireTimeout: 20000,
        // SSL configurations common for TiDB Cloud
        ssl: dbUrl.includes('sslaccept=strict') ? { rejectUnauthorized: true } : undefined
      });
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('[Prisma] Failed to parse DATABASE_URL:', e);
    }
  }

  // Check for build phase to avoid initialization errors
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI === 'true';

  // Fallback to native client if URL exists but adapter fails or for other protocols
  if (process.env.NODE_ENV === 'production' && dbUrl) {
    return new PrismaClient();
  }

  // Handle build phase or missing DB URL
  if (isBuild || !dbUrl) {
    console.warn('[Prisma] Skipping full initialization during build phase or missing DATABASE_URL.');
    return new PrismaClient(); // Return a client that won't be used during build
  }

  // Fallback for local development
  const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'qualitycheck',
    connectionLimit: 30,
    acquireTimeout: 20000,
  });

  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
