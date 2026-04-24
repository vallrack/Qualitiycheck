import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Basic stats
    const totalStudents = await prisma.student.count();
    const totalCases = await prisma.convivenciaCase.count();
    
    // Convivencia severity distribution
    const casesBySeverity = await prisma.convivenciaCase.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    const casesByType = await prisma.convivenciaCase.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    // Recent activity map (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentCases = await prisma.convivenciaCase.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    // Format data for chart
    const daysMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        daysMap[d.toLocaleDateString('es-CO', { weekday: 'short' })] = 0;
    }

    recentCases.forEach(c => {
      const day = c.createdAt.toLocaleDateString('es-CO', { weekday: 'short' });
      if (daysMap[day] !== undefined) {
          daysMap[day]++;
      }
    });

    const weeklyTrend = Object.entries(daysMap).map(([day, count]) => ({
        day, cases: count
    }));

    return NextResponse.json({
      totals: { students: totalStudents, cases: totalCases },
      severity: casesBySeverity.map(s => ({ name: s.severity, value: s._count.id })),
      types: casesByType.map(t => ({ name: `Tipo ${t.type}`, value: t._count.id })),
      weeklyTrend
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
