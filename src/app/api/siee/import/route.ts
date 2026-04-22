import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as XLSX from 'xlsx';
import admin, { db as firestore } from '@/lib/firebase-admin';
import { logAction } from '@/lib/audit-logger';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 });
    }

    const normalize = (str: string) =>
      str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const columnMap: Record<string, string> = {};
    const firstRowKeys = Object.keys(rawData[0]);

    for (const key of firstRowKeys) {
      const norm = normalize(key);
      if (norm.includes('documento') || norm.includes('cedula') || norm.includes('identidad')) {
        columnMap['documentId'] = key;
      } else if (norm.includes('asignatura') || norm.includes('materia') || norm.includes('modulo')) {
        columnMap['subjectName'] = key;
      } else if (norm.includes('periodo') || norm.includes('period')) {
        columnMap['period'] = key;
      } else if (norm.includes('cognitiv') || norm.includes('saber') || norm.includes('conocimiento')) {
        columnMap['cognitive'] = key;
      } else if (norm.includes('personal') || norm.includes('ser') || norm.includes('desempeno') || norm.includes('desempeño')) {
        columnMap['personal'] = key;
      } else if (norm.includes('social') || norm.includes('conviv') || norm.includes('producto')) {
        columnMap['social'] = key;
      } else if (norm.includes('observ') || norm.includes('nota')) {
        columnMap['observations'] = key;
      }
    }

    if (!columnMap['documentId'] || !columnMap['subjectName'] || !columnMap['period']) {
      return NextResponse.json({
        error: `Columnas requeridas no encontradas. Necesitas: [Documento], [Asignatura], [Periodo]. Detectadas: [${firstRowKeys.join(', ')}]`,
        detectedColumns: firstRowKeys,
      }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Check if ETDH to adjust final score weighting
    const institution = await prisma.institution.findFirst();
    const isETDH = institution?.type === 'ETDH';

    for (const row of rawData) {
      const documentId = String(row[columnMap['documentId']] || '').trim();
      const subjectName = String(row[columnMap['subjectName']] || '').trim();
      const period = parseInt(String(row[columnMap['period']] || '1'));
      const cognitiveScore = parseFloat(String(row[columnMap['cognitive']] || '0')) || 0;
      const personalScore = parseFloat(String(row[columnMap['personal']] || '0')) || 0;
      const socialScore = parseFloat(String(row[columnMap['social']] || '0')) || 0;
      const observations = columnMap['observations'] ? String(row[columnMap['observations']] || '') : '';

      if (!documentId || !subjectName || isNaN(period)) {
        skipped++;
        continue;
      }

      try {
        const student = await prisma.student.findUnique({ where: { documentId } });
        if (!student) {
          errors.push(`Estudiante con documento "${documentId}" no encontrado en el sistema`);
          skipped++;
          continue;
        }

        const subject = await prisma.subject.findFirst({ where: { name: { contains: subjectName } } });
        if (!subject) {
          errors.push(`Asignatura "${subjectName}" no encontrada. Verifica el nombre exacto`);
          skipped++;
          continue;
        }

        let finalScore = 0;
        if (isETDH) {
          // ETDH: typically equal weighting or 30/30/40 (Conocimiento, Desempeño, Producto)
          finalScore = parseFloat(((cognitiveScore + personalScore + socialScore) / 3).toFixed(1));
        } else {
          // SIEE FORMAL: 60, 20, 20
          finalScore = parseFloat(
            (cognitiveScore * 0.6 + personalScore * 0.2 + socialScore * 0.2).toFixed(1)
          );
        }

        const evaluation = await prisma.evaluation.upsert({
          where: {
            studentId_subjectId_period: {
              studentId: student.id,
              subjectId: subject.id,
              period,
            },
          },
          update: { cognitiveScore, personalScore, socialScore, finalScore, observations },
          create: { studentId: student.id, subjectId: subject.id, period, cognitiveScore, personalScore, socialScore, finalScore, observations },
        });

        // DUAL WRITE
        await firestore.collection('evaluations').doc(evaluation.id).set({
          studentId: student.id,
          studentName: student.name,
          documentId,
          subjectId: subject.id,
          subjectName: subject.name,
          period,
          scores: { cognitive: cognitiveScore, personal: personalScore, social: socialScore, final: finalScore },
          observations,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          system: 'BULK_IMPORT_SIEE'
        }, { merge: true });

        created++;
      } catch (err: any) {
        errors.push(`Fila doc="${documentId}" asig="${subjectName}": ${err.message}`);
        skipped++;
      }
    }

    await logAction({
      userId: 'SISTEMA-AUTO',
      action: 'BULK_IMPORT_EVALUACIONES',
      resource: `Imported ${created} evaluations, skipped ${skipped}`,
      priority: 'high',
      payload: { filename: file.name, totalRows: rawData.length, created, skipped },
    });

    return NextResponse.json({
      success: true,
      summary: { totalRows: rawData.length, created, skipped, errors: errors.slice(0, 5) },
    });
  } catch (error: any) {
    console.error('SIEE Import Error:', error);
    return NextResponse.json({ error: error.message || 'Error procesando el informe' }, { status: 500 });
  }
}
