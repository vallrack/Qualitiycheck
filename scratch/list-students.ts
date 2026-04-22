import { prisma } from '../src/lib/db/prisma';

async function main() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true, documentId: true, modality: true, grade: true }
  });
  console.log(JSON.stringify(students, null, 2));
}

main();
