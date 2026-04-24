import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const areaSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(5),
  description: z.string().optional(),
});

const subjectSchema = z.object({
  name: z.string().min(2),
  grade: z.string().min(1),
  weeklyHours: z.number().int().min(1).max(20).default(4),
  areaId: z.string().min(1),
});

const planSchema = z.object({
  subjectId: z.string().min(1),
  period: z.number().int().min(1).max(4),
  dbaReference: z.string().optional(),
  competency: z.string().min(5),
  indicator: z.string().optional(),
  methodology: z.string().optional(),
  evaluationCriteria: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'areas';

    if (type === 'areas') {
      const areas = await prisma.subjectArea.findMany({
        include: {
          subjects: {
            include: { plans: true },
            orderBy: { grade: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(areas);
    }

    if (type === 'subjects') {
      const areaId = searchParams.get('areaId');
      const subjects = await prisma.subject.findMany({
        where: areaId ? { areaId } : undefined,
        include: { area: true, plans: { orderBy: { period: 'asc' } } },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      });
      return NextResponse.json(subjects);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, ...data } = body;

    if (type === 'area') {
      const validated = areaSchema.parse(data);
      const area = await prisma.subjectArea.create({ data: validated });
      return NextResponse.json(area);
    }

    if (type === 'subject') {
      const validated = subjectSchema.parse(data);
      const subject = await prisma.subject.create({
        data: validated,
        include: { area: true },
      });
      return NextResponse.json(subject);
    }

    if (type === 'plan') {
      const validated = planSchema.parse(data);
      const plan = await prisma.curriculumPlan.create({
        data: validated,
        include: { subject: { include: { area: true } } },
      });
      return NextResponse.json(plan);
    }

    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
  } catch (error: any) {
    console.error('Curriculum API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
