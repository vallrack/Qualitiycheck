import { prisma } from '../src/lib/db/prisma';

async function checkData() {
  const evalCount = await prisma.evaluation.count();
  const studentCount = await prisma.student.count();
  const programCount = await prisma.program.count();
  const studentsWithProgram = await prisma.student.count({ where: { NOT: { programId: null } } });
  
  console.log({
    evalCount,
    studentCount,
    programCount,
    studentsWithProgram
  });

  const students = await prisma.student.findMany({
    take: 5,
    include: { evaluations: true, program: true }
  });
  console.log('Sample Students:', JSON.stringify(students, null, 2));
}

checkData()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
