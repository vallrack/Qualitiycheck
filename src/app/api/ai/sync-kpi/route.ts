import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/user-auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { name, value, unit, context, source } = await req.json();
    const finalName = source ? `[${source}] ${name}` : name;

    // 1. Buscar o crear el KPI
    let kpi = await prisma.kpi.findFirst({
      where: { name: finalName }
    });

    if (!kpi) {
      kpi = await prisma.kpi.create({
        data: {
          name: finalName,
          unit,
          description: context,
          level: 'AREA',
          targetValue: 100 
        }
      });
    }

    // 2. Registrar el nuevo valor extraído por la IA
    const newValue = await prisma.kpiValue.create({
      data: {
        value: parseFloat(value),
        kpiId: kpi.id,
        comment: `Sincronizado automáticamente desde Inteligencia Documental. Origen: ${context}`
      }
    });

    // 3. Actualizar el valor actual en el registro principal del KPI
    await prisma.kpi.update({
      where: { id: kpi.id },
      data: { currentValue: parseFloat(value) }
    });

    return NextResponse.json({ success: true, kpi, newValue });
  } catch (error: any) {
    console.error('[Sync-KPI] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
