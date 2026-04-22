
import { prisma } from '../lib/db/prisma';
import admin, { db as firestore } from '../lib/firebase-admin';

async function syncAll() {
  console.log('🚀 Iniciando Sincronización Masiva: MySQL -> Firebase');

  try {
    // 1. Sync Students (MySQL -> Firebase)
    const students = await prisma.student.findMany();
    console.log(`📦 Sincronizando ${students.length} estudiantes...`);
    const mysqlDocumentIds = new Set(students.map(s => s.documentId));

    for (const student of students) {
      await firestore.collection('students').doc(student.documentId).set({
        prismaId: student.id,
        name: student.name,
        documentId: student.documentId,
        grade: student.grade,
        cohort: student.cohort,
        modality: student.modality,
        createdAt: admin.firestore.Timestamp.fromDate(student.createdAt),
        syncDate: admin.firestore.FieldValue.serverTimestamp(),
        system: 'Sync Script'
      }, { merge: true });
    }

    // 1b. Purge Orphans in Firebase (Firebase -> Delete if not in MySQL)
    const firebaseStudents = await firestore.collection('students').get();
    let purgedCount = 0;
    for (const doc of firebaseStudents.docs) {
      if (!mysqlDocumentIds.has(doc.id)) {
        await firestore.collection('students').doc(doc.id).delete();
        purgedCount++;
      }
    }
    if (purgedCount > 0) console.log(`🧹 Eliminados ${purgedCount} registros huérfanos en Firebase.`);
    
    console.log('✅ Estudiantes sincronizados y purgados.');

    // 2. Sync Improvement Plans (PHVA)
    // ... rest of the sync logic remains similar but updated for consistency
    const plans = await prisma.improvementPlan.findMany({
      include: { student: { select: { name: true } } }
    });
    console.log(`📦 Sincronizando ${plans.length} planes de mejoramiento...`);

    for (const plan of plans) {
      await firestore.collection('improvement_plans').doc(plan.id).set({
        studentId: plan.studentId,
        studentName: plan.student?.name || 'Unknown',
        subjectId: plan.subjectId,
        planear: plan.planear,
        hacer: plan.hacer,
        verificar: plan.verificar,
        actuar: plan.actuar,
        status: plan.status,
        priority: plan.priority,
        period: plan.period,
        createdAt: admin.firestore.Timestamp.fromDate(plan.createdAt),
        syncDate: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    console.log('✅ Planes de mejoramiento sincronizados.');

    // 3. Sync Convivencia Cases
    const cases = await prisma.convivenciaCase.findMany({
      include: { student: { select: { name: true } } }
    });
    console.log(`📦 Sincronizando ${cases.length} casos de convivencia...`);

    for (const c of cases) {
      await firestore.collection('convivencia_cases').doc(c.id).set({
        studentId: c.studentId,
        studentName: c.student?.name || 'Unknown',
        reporterId: c.reporterId,
        type: c.type,
        description: c.description,
        severity: c.severity,
        status: c.status,
        createdAt: admin.firestore.Timestamp.fromDate(c.createdAt),
        syncDate: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    console.log('✅ Casos de convivencia sincronizados.');

    console.log('🏁 Sincronización finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  } finally {
    process.exit(0);
  }
}

syncAll();
