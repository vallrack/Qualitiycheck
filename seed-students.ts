import { prisma } from './src/lib/db/prisma';

async function seed() {
  console.log('--- Seeding Students ---');
  try {
    const students = [
      { name: 'Mateo Rodríguez', documentId: '102030401', grade: '11-A' },
      { name: 'Valentina Ospina', documentId: '102030402', grade: '10-B' },
      { name: 'Juan Diego Castro', documentId: '102030403', grade: '9-C' },
      { name: 'Sofía Montoya', documentId: '102030404', grade: '11-A' },
    ];

    for (const s of students) {
      await prisma.student.upsert({
        where: { documentId: s.documentId },
        update: {},
        create: s,
      });
    }

    console.log('SUCCESS: Students seeded.');
  } catch (error) {
    console.error('SEED ERROR:', error);
  }
  process.exit(0);
}

seed();
