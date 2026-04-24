import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logAction } from '@/lib/audit-logger';
import { validateRole } from '@/lib/user-auth';
import admin, { db as firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page    = parseInt(searchParams.get('page') || '1');
    const limit   = parseInt(searchParams.get('limit') || '20');
    const grade   = searchParams.get('grade');
    const cohort  = searchParams.get('cohort');
    const modality = searchParams.get('modality');
    const search  = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (modality) where.modality = modality;
    if (grade)  where.grade  = grade;
    if (cohort) where.cohort = cohort;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { documentId: { contains: search } },
      ];
    }

    let students: any[] = [];
    let total = 0;
    let gradesList: string[] = [];
    let cohortsList: string[] = [];

    try {
      const [prismaStudents, prismaTotal] = await Promise.all([
        prisma.student.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: limit,
          include: {
            _count: { select: { cases: true, evaluations: true } },
          },
        }),
        prisma.student.count({ where }),
      ]);
      students = prismaStudents;
      total = prismaTotal;

      // Distinct grade list for filters (scoped by modality)
      const grades = await prisma.student.findMany({
        where: { modality: modality || undefined },
        select: { grade: true },
        distinct: ['grade'],
        orderBy: { grade: 'asc' },
      });
      gradesList = grades.map((g) => g.grade);

      const cohorts = await prisma.student.findMany({
        where: { 
          modality: modality || undefined,
          cohort: { not: null }
        },
        select: { cohort: true },
        distinct: ['cohort'],
        orderBy: { cohort: 'asc' },
      });
      cohortsList = cohorts.map((c) => c.cohort!).filter(Boolean);

    } catch (dbError) {
      console.warn('[HA] MariaDB falló en GET /api/students. Usando Firebase de respaldo...', dbError);
      
      let queryRef: any = firestore.collection('students');
      if (modality) queryRef = queryRef.where('modality', '==', modality);
      if (grade)  queryRef = queryRef.where('grade', '==', grade);
      if (cohort) queryRef = queryRef.where('cohort', '==', cohort);
      
      const snapshot = await queryRef.orderBy('name', 'asc').get();
      
      let allDocs = snapshot.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data(), 
        _count: { cases: 0, evaluations: 0 } 
      }));
      
      if (search) {
        const lowerSearch = search.toLowerCase();
        allDocs = allDocs.filter((d: any) => 
          (d.name && d.name.toLowerCase().includes(lowerSearch)) || 
          (d.documentId && d.documentId.toLowerCase().includes(lowerSearch))
        );
      }
      
      total = allDocs.length;
      students = allDocs.slice(skip, skip + limit);
    }

    return NextResponse.json({
      students,
      total,
      page,
      pages: Math.ceil(total / limit),
      filters: {
        grades: gradesList,
        cohorts: cohortsList,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, grade, cohort } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(name   && { name }),
        ...(grade  && { grade }),
        ...(cohort !== undefined && { cohort }),
      },
    });

    // DUAL-WRITE: Firebase Fallback using documentId as key
    try {
      await firestore.collection('students').doc(updated.documentId).set({
        prismaId: updated.id,
        ...(name   && { name }),
        ...(grade  && { grade }),
        ...(cohort !== undefined && { cohort }),
        modality: updated.modality,
        syncDate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (fbError) {
      console.error('[HA] Sincronización dual fallida para estudiante', updated.documentId, fbError);
    }

    await logAction({
      userId: user?.uid || 'SYSTEM',
      action: 'UPDATE_STUDENT',
      resource: `Student:${id}`,
      priority: 'medium',
      payload: { name, grade, cohort },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.student.delete({ where: { id } });

    // DUAL-WRITE: Firebase Fallback
    try {
      await firestore.collection('students').doc(id).delete();
    } catch (fbError) {
      console.error('[HA] Sincronización dual fallida al eliminar estudiante', id, fbError);
    }

    await logAction({
      userId: user?.uid || 'SYSTEM',
      action: 'DELETE_STUDENT',
      resource: `Student:${id}`,
      priority: 'high',
      payload: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
