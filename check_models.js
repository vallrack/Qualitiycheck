const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'qualitycheck',
});

const prisma = new PrismaClient({ adapter });

const models = Object.keys(prisma).filter(k => !k.startsWith('_') && typeof prisma[k] === 'object');
console.log('Available models:', models);
prisma.$disconnect();
