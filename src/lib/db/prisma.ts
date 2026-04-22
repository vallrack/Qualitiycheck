import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const createPrismaClient = () => {
  // ConfiguraciÃ³n del adaptador para MySQL en Prisma 7
  const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'qualitycheck',
    connectionLimit: 30, // Aumentado para soportar importaciones masivas
    acquireTimeout: 20000, // Tiempo de espera para obtener conexiÃ³n
  });

  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
