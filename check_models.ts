import { prisma } from './src/lib/db/prisma';

async function check() {
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && typeof (prisma as any)[k] === 'object');
  console.log('Available models:', models);
}

check().catch(console.error);
