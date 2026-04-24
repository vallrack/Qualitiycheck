import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId requerido' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    const institution = await prisma.institution.findFirst();
    const institutionType = institution?.type || 'FORMAL';

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    // All evaluations with subject + area info
    const evaluations = await prisma.evaluation.findMany({
      where: { studentId },
      include: {
        subject: {
          include: { area: { select: { name: true, code: true } } },
        },
      },
      orderBy: [
        { subject: { area: { name: 'asc' } } },
        { subject: { name: 'asc' } },
        { period: 'asc' },
      ],
    });

    // Build report: group by subject
    const subjectMap: Record<string, {
      subjectId: string;
      subjectName: string;
      areaName: string;
      areaCode: string;
      weeklyHours: number;
      periods: Record<number, { cognitive: number; personal: number; social: number; final: number; obs?: string }>;
      average: number;
      promotion: 'APROBADO' | 'EN_RIESGO' | 'REPROBADO' | 'SIN_DATOS';
    }> = {};

    evaluations.forEach((ev) => {
      if (!subjectMap[ev.subjectId]) {
        subjectMap[ev.subjectId] = {
          subjectId: ev.subjectId,
          subjectName: ev.subject.name,
          areaName: ev.subject.area.name,
          areaCode: ev.subject.area.code,
          weeklyHours: ev.subject.weeklyHours,
          periods: {},
          average: 0,
          promotion: 'SIN_DATOS',
        };
      }
      subjectMap[ev.subjectId].periods[ev.period] = {
        cognitive: ev.cognitiveScore,
        personal: ev.personalScore,
        social: ev.socialScore,
        final: ev.finalScore,
        obs: ev.observations || undefined,
      };
    });

    // Calculate averages and promotion status
    const subjects = Object.values(subjectMap).map((s) => {
      const scores = Object.values(s.periods).map((p) => p.final);
      const average = scores.length
        ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
        : 0;
      let promotion: typeof s.promotion = 'SIN_DATOS';
      if (scores.length > 0) {
        if (average >= 3.0) promotion = 'APROBADO';
        else if (average >= 2.5) promotion = 'EN_RIESGO';
        else promotion = 'REPROBADO';
      }
      return { ...s, average, promotion };
    });

    // Overall stats
    const allAverages = subjects.filter((s) => s.promotion !== 'SIN_DATOS').map((s) => s.average);
    const overallAverage = allAverages.length
      ? parseFloat((allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1))
      : 0;
    const atRisk = subjects.filter((s) => s.promotion === 'EN_RIESGO' || s.promotion === 'REPROBADO').length;

    return NextResponse.json({
      student,
      subjects,
      stats: {
        overallAverage,
        atRisk,
        approved: subjects.filter((s) => s.promotion === 'APROBADO').length,
        total: subjects.filter((s) => s.promotion !== 'SIN_DATOS').length,
        generatedAt: new Date().toISOString(),
        institutionType,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
