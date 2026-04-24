import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import admin, { db as firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let student: any = null;

    try {
      student = await prisma.student.findUnique({
        where: { id },
        include: {
          cases: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          evaluations: {
            include: {
              subject: { include: { area: { select: { name: true } } } },
            },
            orderBy: [{ period: 'asc' }, { subject: { name: 'asc' } }],
          },
          _count: { select: { cases: true, evaluations: true } },
        },
      });
    } catch (dbError) {
      console.warn(`[HA] MariaDB falló en GET /api/students/${id}. Usando Firebase de respaldo...`, dbError);
      
      // Look for the student in Firestore where prismaId matches the requested ID
      const querySnapshot = await firestore.collection('students').where('prismaId', '==', id).limit(1).get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        student = { 
          id: doc.get('prismaId'), 
          ...data, 
          _count: { 
            cases: data.casesCount || 0, 
            evaluations: data.evaluationsCount || 0 
          },
          cases: [], 
          evaluations: [] 
        };
        
        // Respaldo de Evaluaciones
        const evalsSnapshot = await firestore.collection('evaluations').where('studentId', '==', id).get();
        student.evaluations = evalsSnapshot.docs.map((e: any) => {
            const data = e.data();
            return {
                period: data.period,
                finalScore: data.scores?.final || 0,
                subjectId: data.subjectId,
                subject: {
                    name: data.subjectName,
                    area: { name: 'General' }
                }
            };
        });

        // Respaldo de Casos
        const casesSnapshot = await firestore.collection('convivencia_cases').where('studentId', '==', id).limit(10).get();
        student.cases = casesSnapshot.docs.map((c: any) => ({ id: c.id, ...c.data() }));
      }
    }

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    // Build grade summary: group evaluations by subject, average by period
    const subjectMap: Record<string, any> = {};
    student.evaluations.forEach((ev: any) => {
      if (!subjectMap[ev.subjectId]) {
        subjectMap[ev.subjectId] = {
          subjectName: ev.subject.name,
          areaName: ev.subject.area.name,
          periods: {} as Record<number, number>,
        };
      }
      subjectMap[ev.subjectId].periods[ev.period] = ev.finalScore;
    });

    const gradeSummary = Object.values(subjectMap).map((s: any) => {
      const scores = Object.values(s.periods) as number[];
      const average = scores.length
        ? parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1))
        : 0;
      return { ...s, average, atRisk: average < 3.0 && scores.length > 0 };
    });

    return NextResponse.json({ student, gradeSummary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
