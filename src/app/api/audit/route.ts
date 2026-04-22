import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';

export async function GET(req: Request) {
  const { authenticated, authorized } = await validateRole(['ADMIN']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const priority = searchParams.get('priority');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (priority) where.priority = priority;
    if (action) where.action = { contains: action };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 200),
    });

    // Aggregate stats
    const totalLogs = await prisma.auditLog.count();
    const criticalCount = await prisma.auditLog.count({ where: { priority: 'critical' } });
    const highCount = await prisma.auditLog.count({ where: { priority: 'high' } });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.auditLog.count({ where: { timestamp: { gte: todayStart } } });

    return NextResponse.json({
      logs,
      stats: {
        total: totalLogs,
        critical: criticalCount,
        high: highCount,
        today: todayCount,
      },
    });
  } catch (error: any) {
    console.error('Audit API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
