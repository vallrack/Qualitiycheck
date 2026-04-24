import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db/prisma';
import { getServerSession } from '../../../lib/user-auth';

export const dynamic = 'force-dynamic';

// GET /api/surveys — list all surveys (admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const surveys = await (prisma as any).surveyForm.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { responses: true } } }
  });
  return NextResponse.json(surveys);
}

// POST /api/surveys — create a survey (admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, questions, target, slug, programId } = await req.json();
  if (!title || !questions?.length || !slug) {
    return NextResponse.json({ error: 'title, questions y slug son requeridos' }, { status: 400 });
  }

  // Ensure unique slug
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  const existing = await (prisma as any).surveyForm.findUnique({ where: { slug: cleanSlug } });
  if (existing) return NextResponse.json({ error: 'Ya existe una encuesta con ese identificador (slug)' }, { status: 409 });

  const survey = await (prisma as any).surveyForm.create({
    data: { title, description, questions, target: target || 'ESTUDIANTE', slug: cleanSlug, programId: programId || null }
  });
  return NextResponse.json(survey, { status: 201 });
}
