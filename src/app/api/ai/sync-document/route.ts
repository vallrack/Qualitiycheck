import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/user-auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { title, analysis } = await req.json();

    // Buscar o crear la evidencia de calidad
    let evidence = await prisma.qualityEvidence.findFirst({
      where: { title: title }
    });

    if (evidence) {
      evidence = await prisma.qualityEvidence.update({
        where: { id: evidence.id },
        data: {
          aiAnalysis: analysis,
          contentExtracted: analysis.executiveSummary || 'Sin resumen',
          complianceScore: analysis.classification?.confidence || 0
        }
      });
    } else {
      evidence = await prisma.qualityEvidence.create({
        data: {
          title: title,
          type: analysis.classification?.type || 'OTRO',
          standard: 'ISO 21001',
          contentExtracted: analysis.executiveSummary || 'Sin resumen',
          complianceScore: analysis.classification?.confidence || 0,
          aiAnalysis: analysis
        }
      });
    }

    return NextResponse.json({ success: true, evidence });
  } catch (error: any) {
    console.error('[Sync-Document] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
