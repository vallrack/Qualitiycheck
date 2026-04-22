const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function debug() {
  const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'qualitycheck',
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const count = await prisma.qualityDocument.count();
    console.log('QualityDocument count:', count);
    
    const docs = await prisma.qualityDocument.findMany();
    console.log('Documents:', JSON.stringify(docs, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
