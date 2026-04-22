import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db/prisma';
import { getServerSession } from '../../../../../lib/user-auth';

// Forzamos el tipado para que el IDE reconozca los nuevos modelos
type SurveyWithResponses = any;

// POST /api/surveys/[id]/responses — submit a response (public, no auth)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const survey: any = await (prisma as any).surveyForm.findFirst({ where: { OR: [{ id }, { slug: id }], isActive: true } });
  if (!survey) return NextResponse.json({ error: 'Encuesta no encontrada o inactiva' }, { status: 404 });

  const { answers } = await req.json();
  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Respuestas inválidas' }, { status: 400 });
  }

  const response = await (prisma as any).surveyResponse.create({
    data: { surveyId: survey.id, answers, source: 'ONLINE' }
  });
  return NextResponse.json({ ok: true, id: response.id }, { status: 201 });
}

// GET /api/surveys/[id]/responses — get aggregated stats (admin)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const survey: any = await (prisma as any).surveyForm.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { responses: { orderBy: { createdAt: 'desc' } } }
  });
  if (!survey) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const questions = (survey as any).questions as any[];
  const responses = (survey as any).responses as any[];
  const total = responses.length;
  const onlineCount = responses.filter((r: any) => r.source === 'ONLINE').length;
  const importCount = responses.filter((r: any) => r.source === 'EXCEL_IMPORT').length;

  // Aggregate per question
  const stats = questions.map(q => {
    const values = responses
      .map((r: any) => (r.answers as any)[q.id])
      .filter((v: any) => v !== undefined && v !== null && v !== '');

    if (q.type === 'rating') {
      const nums = values.map(Number).filter(n => !isNaN(n));
      const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      nums.forEach(n => { if (dist[n] !== undefined) dist[n]++; });
      return { questionId: q.id, text: q.text, type: q.type, avg: Math.round(avg * 100) / 100, distribution: dist, answered: nums.length };
    }
    if (q.type === 'yesno') {
      const yes = values.filter((v: any) => v === true || v === 'true' || v === 'yes' || v === 'sí' || v === 'si').length;
      return { questionId: q.id, text: q.text, type: q.type, yes, no: values.length - yes, answered: values.length };
    }
    // text type — return last 10 responses
    return { questionId: q.id, text: q.text, type: q.type, answers: values.slice(0, 10), answered: values.length };
  });

  return NextResponse.json({ surveyId: (survey as any).id, title: (survey as any).title, total, onlineCount, importCount, stats });
}
