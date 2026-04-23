import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/user-auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Falta el parámetro title' }, { status: 400 });
    }

    const evidence = await prisma.qualityEvidence.findFirst({
      where: { title: title }
    });

    if (!evidence) {
      return NextResponse.json(null);
    }

    return NextResponse.json(evidence);
  } catch (error: any) {
    console.error('[Get-Evidence] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
