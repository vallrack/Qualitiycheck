import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Solo administradores y coordinadores pueden ver el dashboard ejecutivo
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    // 1. Estadísticas de Documentos de Calidad
    const totalDocs = await prisma.qualityDocument.count();
    const activeDocs = await prisma.qualityDocument.count({ where: { status: 'VIGENTE' } });
    const pendingDocs = await prisma.qualityDocument.count({ where: { status: 'EN_REVISION' } });

    // 2. Estadísticas de Programas y Estudiantes
    const totalPrograms = await prisma.program.count();
    const totalStudents = await prisma.student.count();
    
    // 3. Auditorías Recientes
    const recentAudits = await prisma.programAudit.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { program: { select: { name: true, type: true } } }
    });

    // 4. Casos de Convivencia Críticos (Riesgo legal)
    const openCases = await prisma.convivenciaCase.count({ where: { status: 'OPEN' } });
    const criticalCases = await prisma.convivenciaCase.count({ where: { status: 'OPEN', severity: 'CRITICAL' } });

    // 5. Estadísticas de Logs de Auditoría (Trazabilidad)
    const totalLogs = await prisma.auditLog.count();
    const criticalLogs = await prisma.auditLog.count({ where: { priority: 'critical' } });

    return NextResponse.json({
      documents: { total: totalDocs, active: activeDocs, pending: pendingDocs },
      programs: { total: totalPrograms, students: totalStudents },
      convivencia: { open: openCases, critical: criticalCases },
      audits: { recent: recentAudits },
      logs: { total: totalLogs, critical: criticalLogs }
    });
  } catch (error: any) {
    console.error('Executive Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
