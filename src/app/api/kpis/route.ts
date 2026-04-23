import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';

export async function GET(req: NextRequest) {
  const { authenticated } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level');
  const userId = searchParams.get('userId');
  const area = searchParams.get('area');

  try {
    const where: any = {};
    if (level) where.level = level;
    if (userId) where.userId = userId;
    if (area) where.area = area;

    const kpis = await (prisma as any).kpi.findMany({
      where,
      include: {
        history: {
          orderBy: { period: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(kpis);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, kpiId, value, comment, ...kpiData } = body;

    if (action === 'track') {
      // Record a new value for an existing KPI
      const kpiValue = await (prisma as any).kpiValue.create({
        data: {
          kpiId,
          value,
          comment
        }
      });
      // Update the current value in the main KPI record
      await (prisma as any).kpi.update({
        where: { id: kpiId },
        data: { currentValue: value }
      });
      return NextResponse.json(kpiValue);
    }

    // Create a new KPI
    const created = await (prisma as any).kpi.create({
      data: {
        name: kpiData.name,
        description: kpiData.description,
        targetValue: kpiData.targetValue,
        currentValue: kpiData.currentValue || 0,
        unit: kpiData.unit,
        frequency: kpiData.frequency || 'MENSUAL',
        level: kpiData.level || 'INSTITUCIONAL',
        area: kpiData.area,
        userId: kpiData.userId
      }
    });
    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    await (prisma as any).kpi.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
