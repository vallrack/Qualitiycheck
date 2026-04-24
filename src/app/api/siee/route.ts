import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import admin, { db as firestore } from '@/lib/firebase-admin';
import { logAction } from '@/lib/audit-logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const evaluationSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  period: z.number().int().min(1).max(4),
  cognitiveScore: z.number().min(0).max(5),
  personalScore: z.number().min(0).max(5),
  socialScore: z.number().min(0).max(5),
  observations: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const period = searchParams.get('period');

    if (!subjectId || !period) {
      return NextResponse.json({ error: 'Faltan parámetros: subjectId y period son requeridos' }, { status: 400 });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: {
        subjectId,
        period: parseInt(period),
      },
      include: {
        student: { select: { name: true, documentId: true } },
      },
      orderBy: { student: { name: 'asc' } },
    });

    return NextResponse.json(evaluations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = evaluationSchema.parse(body);

    // Calculate final score using Colombian scale (e.g., Cognitive 60%, Personal 20%, Social 20%)
    // But since the user might use standard average or pure score, we'll use a simple weighted average
    // or just let the user input direct numbers. Let's do a weighted average matching standard:
    // Cognitivo: 60%, Personal: 20%, Social: 20%
    const finalScore = parseFloat(
      (validated.cognitiveScore * 0.6 + validated.personalScore * 0.2 + validated.socialScore * 0.2).toFixed(1)
    );

    const evaluation = await prisma.evaluation.upsert({
      where: {
        studentId_subjectId_period: {
          studentId: validated.studentId,
          subjectId: validated.subjectId,
          period: validated.period,
        },
      },
      update: {
        cognitiveScore: validated.cognitiveScore,
        personalScore: validated.personalScore,
        socialScore: validated.socialScore,
        observations: validated.observations,
        finalScore,
      },
      create: {
        studentId: validated.studentId,
        subjectId: validated.subjectId,
        period: validated.period,
        cognitiveScore: validated.cognitiveScore,
        personalScore: validated.personalScore,
        socialScore: validated.socialScore,
        observations: validated.observations,
        finalScore,
      },
      include: {
        student: true,
        subject: true,
      }
    });

    // DUAL WRITE a Firebase Firestore
    await firestore.collection('evaluations').doc(evaluation.id).set({
      studentId: evaluation.studentId,
      studentName: evaluation.student.name,
      subjectId: evaluation.subjectId,
      subjectName: evaluation.subject.name,
      period: evaluation.period,
      scores: {
        cognitive: evaluation.cognitiveScore,
        personal: evaluation.personalScore,
        social: evaluation.socialScore,
        final: evaluation.finalScore,
      },
      observations: evaluation.observations,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      system: 'Antigravity SGC Backup'
    }, { merge: true });

    // Rastro de auditoría
    await logAction({
      userId: 'DOCENTE',
      action: 'UPDATE_EVALUATION',
      resource: `Evaluation:${evaluation.id}`,
      priority: 'low',
      payload: {
        student: evaluation.student.name,
        subject: evaluation.subject.name,
        finalScore,
      }
    });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error('SIEE Error:', error);
    return NextResponse.json({ error: error.message || 'Error procesando evaluación' }, { status: 400 });
  }
}
