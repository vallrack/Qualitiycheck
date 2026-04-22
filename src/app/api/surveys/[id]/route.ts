import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db/prisma';
import { getServerSession } from '../../../../lib/user-auth';

// GET /api/surveys/[id] — get survey by id or slug (public, no auth)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await (prisma as any).surveyForm.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    select: { id: true, title: true, description: true, questions: true, target: true, slug: true }
  });
  if (!survey) return NextResponse.json({ error: 'Encuesta no encontrada o inactiva' }, { status: 404 });
  return NextResponse.json(survey);
}

// PATCH /api/surveys/[id] — toggle active state (admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const updated = await (prisma as any).surveyForm.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

// DELETE /api/surveys/[id] — delete survey (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await (prisma as any).surveyForm.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
