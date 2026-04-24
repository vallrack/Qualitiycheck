import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logAction } from '@/lib/audit-logger';
import { validateRole } from '@/lib/user-auth';
import admin, { db as firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET: List plans (with at-risk students summary)
export async function GET(req: Request) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status'); // ACTIVO | EN_SEGUIMIENTO | CERRADO

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    let plans: any[] = [];
    let atRisk: any[] = [];

    try {
      plans = await prisma.improvementPlan.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, grade: true, documentId: true } },
          subject: { select: { id: true, name: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      });

      // At-risk students: evaluate who has average < 3.0
      atRisk = await prisma.$queryRaw<any[]>`
        SELECT s.id, s.name, s.grade, s.documentId,
               AVG(e.finalScore) as avgScore,
               COUNT(e.id) as evalCount
        FROM Student s
        JOIN Evaluation e ON s.id = e.studentId
        GROUP BY s.id, s.name, s.grade, s.documentId
        HAVING avgScore < 3.0 AND evalCount > 0
        ORDER BY avgScore ASC
        LIMIT 30
      `;
    } catch (dbError) {
      console.warn('[HA] MariaDB falló en GET /api/phva. Usando Firebase de respaldo...', dbError);

      let queryRef: any = firestore.collection('improvement_plans');
      if (studentId) queryRef = queryRef.where('studentId', '==', studentId);
      if (status) queryRef = queryRef.where('status', '==', status);

      const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
      plans = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          student: { id: data.studentId, name: data.studentName || 'Estudiante (Respaldo)', grade: 'N/A', documentId: 'N/A' },
          subject: { id: data.subjectId || null, name: 'General / No especificada' }
        };
      });
      // Sort plans with status='ACTIVO' first if needed
      plans.sort((a, b) => a.status.localeCompare(b.status));
      // atRisk remains empty as calculating averages over all evaluations in Firestore is computationally heavy
      atRisk = [];
    }

    return NextResponse.json({ plans, atRisk });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create plan
export async function POST(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { studentId, subjectId, planear, hacer, verificar, actuar, period, priority, dueDate } = body;

    if (!studentId || !planear || !hacer) {
      return NextResponse.json({ error: 'Faltan campos requeridos: studentId, planear, hacer' }, { status: 400 });
    }

    const plan = await prisma.improvementPlan.create({
      data: {
        studentId,
        subjectId: subjectId || null,
        planear,
        hacer,
        verificar: verificar || null,
        actuar: actuar || null,
        period: period || 1,
        priority: priority || 'NORMAL',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        student: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });

    // DUAL-WRITE: Firebase Fallback
    try {
      await firestore.collection('improvement_plans').doc(plan.id).set({
        studentId,
        studentName: plan.student.name,
        subjectId: subjectId || null,
        planear,
        hacer,
        verificar: verificar || null,
        actuar: actuar || null,
        period: period || 1,
        priority: priority || 'NORMAL',
        status: 'ACTIVO',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        syncDate: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (fbError) {
      console.error('[HA] Sincronización dual fallida al crear PMI', plan.id, fbError);
    }

    await logAction({
      userId: user?.uid || 'SYSTEM',
      action: 'CREATE_PMI',
      resource: `ImprovementPlan:${plan.id}`,
      priority: 'high',
      payload: { student: plan.student.name, priority, period },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update plan (status, actuar, closing)
export async function PATCH(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, actuar, verificar, hacer, planear, priority } = body;

    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const updateData: any = {};
    if (planear !== undefined) updateData.planear = planear;
    if (hacer !== undefined) updateData.hacer = hacer;
    if (verificar !== undefined) updateData.verificar = verificar;
    if (actuar !== undefined) updateData.actuar = actuar;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'CERRADO') updateData.closedAt = new Date();
    }

    const plan = await prisma.improvementPlan.update({
      where: { id },
      data: updateData,
      include: { student: { select: { name: true } } },
    });

    // DUAL-WRITE: Firebase Fallback
    try {
      await firestore.collection('improvement_plans').doc(id).set({
        ...updateData,
        syncDate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (fbError) {
      console.error('[HA] Sincronización dual fallida al actualizar PMI', id, fbError);
    }

    await logAction({
      userId: user?.uid || 'SYSTEM',
      action: 'UPDATE_PMI',
      resource: `ImprovementPlan:${id}`,
      priority: 'medium',
      payload: { status, student: plan.student.name },
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
