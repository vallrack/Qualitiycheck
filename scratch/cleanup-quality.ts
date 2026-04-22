import { prisma } from '../src/lib/db/prisma';

async function cleanup() {
  console.log('🧹 Limpiando datos de prueba (Encuestas y Auditorías)...');
  
  const surveys = await prisma.qualitySurvey.deleteMany();
  const audits = await prisma.programAudit.deleteMany();
  
  console.log(`✅ Eliminadas ${surveys.count} encuestas y ${audits.count} auditorías.`);
}

cleanup()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
