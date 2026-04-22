const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const programs = await prisma.program.count();
    const students = await prisma.student.count();
    const areas = await prisma.subjectArea.count();
    const subjects = await prisma.subject.count();
    
    console.log({
      programs,
      students,
      areas,
      subjects
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
