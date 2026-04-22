import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { validateRole } from '@/lib/user-auth';

export async function POST(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { studentId, subjectId } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: 'studentId es requerido' }, { status: 400 });
    }

    // Fetch student and their evaluations
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        evaluations: {
          where: subjectId ? { subjectId } : undefined,
          include: { subject: true },
          orderBy: { period: 'asc' }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    let subjectName = 'General / Múltiples Asignaturas';
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (subject) subjectName = subject.name;
    }

    const analysis = await AIOrchestrator.analyzePerformance({
      studentName: student.name,
      subject: subjectName,
      modality: student.modality,
      grades: student.evaluations.map(e => ({
        period: e.period,
        score: e.finalScore,
        subject: e.subject.name
      }))
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('PHVA AI Analysis Error:', error);
    return NextResponse.json(
      { error: 'Error analizando desempeño académico', details: error.message },
      { status: 500 }
    );
  }
}
