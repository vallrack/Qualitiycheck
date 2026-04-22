import { prisma } from '../src/lib/db/prisma';

async function seedPrograms() {
  console.log('🌱 Seeding Programs and Linking Entities (TSX)...');

  try {
    // 1. Create or Find Institution
    let institution = await prisma.institution.findFirst();
    if (!institution) {
      institution = await prisma.institution.create({
        data: {
          name: 'Ciudad Don Bosco',
          nit: '890.901.234-5',
          type: 'ETDH'
        }
      });
    }

    // 2. Identify unique grades/careers from students
    const students = await prisma.student.findMany();
    const uniqueGrades = Array.from(new Set(students.map((s: any) => s.grade)));

    for (const gradeName of uniqueGrades) {
      if (!gradeName) continue;
      
      console.log(`Processing Program: ${gradeName}`);
      
      const code = gradeName.toUpperCase().replace(/\s+/g, '_');

      // Create Program
      const program = await prisma.program.upsert({
        where: { code: code },
        update: {},
        create: {
          name: gradeName,
          code: code,
          type: gradeName.toLowerCase().includes('técnico') ? 'ETDH' : 'FORMAL',
          institutionId: institution.id
        }
      });

      // Link Students
      await prisma.student.updateMany({
        where: { grade: gradeName },
        data: { programId: program.id }
      });

      // Link Subjects
      await prisma.subject.updateMany({
        where: { grade: gradeName },
        data: { programId: program.id }
      });

      // Create a mock survey for each program
      await prisma.qualitySurvey.create({
        data: {
          programId: program.id,
          target: 'ESTUDIANTE',
          averageScore: 4.2 + (Math.random() * 0.5),
          sampleSize: 20 + Math.floor(Math.random() * 50),
          findings: 'Satisfacción general alta, se sugiere mejorar laboratorios.'
        }
      });
    }

    console.log('✅ Programs seeded and linked!');
  } catch (err) {
    console.error('Seed error:', err);
  }
}

seedPrograms()
  .finally(() => prisma.$disconnect());
