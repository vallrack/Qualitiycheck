import { prisma } from './src/lib/db/prisma';

async function check() {
  console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
}

check().catch(console.error);
