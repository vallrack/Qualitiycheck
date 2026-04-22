import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logAction } from '@/lib/audit-logger';
import admin, { db as firestore } from '@/lib/firebase-admin';
import { z } from 'zod';
import { validateRole } from '@/lib/user-auth';

const convivenciaSchema = z.object({
  studentId: z.string().min(1),
  reporterId: z.string().min(1),
  type: z.number().int().min(1).max(3),
  description: z.string().min(10),
  involvedParticipants: z.any().optional(),
  protocolStatus: z.any().optional(),
  severity: z.string().default('NORMAL'),
  status: z.string().default('OPEN'),
  evidence: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = convivenciaSchema.parse(body);

    const newCase = await prisma.convivenciaCase.create({
      data: {
        ...validated,
        reporterId: user?.uid || validated.reporterId,
        evidence: validated.evidence ? (validated.evidence as any) : undefined,
      },
      include: {
        student: true,
      }
    });

    // DUAL WRITE: Sincronización en tiempo real con Firebase Firestore como respaldo
    await firestore.collection('convivencia_cases').doc(newCase.id).set({
      ...validated,
      studentName: newCase.student.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      system: 'Antigravity SGC Backup'
    });

    // Immutable Audit Log (Ley 1620 / ISO 21001)
    await logAction({
      userId: user?.uid || validated.reporterId,
      action: 'CREATE_CONVIVENCIA_CASE',
      resource: `ConvivenciaCase:${newCase.id}`,
      payload: { 
        student: newCase.student.name,
        type: newCase.type,
        severity: newCase.severity 
      },
      priority: validated.severity === 'CRITICAL' ? 'critical' : 'high',
    });

    // Notify Admins and Coordinators
    const adminsAndCoords = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'COORDINADOR'] } }
    });

    if (adminsAndCoords.length > 0) {
      await prisma.notification.createMany({
        data: adminsAndCoords.map(a => ({
          userId: a.id,
          title: `Nuevo Caso Convivencia - Tipo ${newCase.type}`,
          message: `Se ha reportado un nuevo caso para el estudiante ${newCase.student.name}. Severidad: ${newCase.severity}.`,
          type: newCase.severity === 'CRITICAL' ? 'ERROR' : 'WARNING',
          link: 'Convivencia (L1620)'
        }))
      });
    }

    return NextResponse.json(newCase);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 400 });
  }
}

export async function GET() {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    let cases: any[] = [];
    try {
      cases = await prisma.convivenciaCase.findMany({
        include: { student: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError) {
      console.warn('[HA] MariaDB falló en GET /api/convivencia. Usando Firebase de respaldo...', dbError);
      const snapshot = await firestore.collection('convivencia_cases').orderBy('createdAt', 'desc').get();
      cases = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Retornar un mock del estudiante basado en el respaldo
          student: { name: data.studentName || 'Estudiante Desconocido' }
        };
      });
    }

    return NextResponse.json(cases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
