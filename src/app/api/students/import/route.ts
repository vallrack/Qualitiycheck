import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as XLSX from 'xlsx';
import { logAction } from '@/lib/audit-logger';
import admin, { db as firestore } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    // Read Excel buffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 });
    }

    // Normalize column headers (case-insensitive, trim spaces)
    const normalize = (str: string) => str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const columnMap: Record<string, string> = {};
    const firstRowKeys = Object.keys(rawData[0]);
    
    for (const key of firstRowKeys) {
      const norm = normalize(key);
      if (norm.includes('nombre') || norm.includes('name') || norm.includes('estudiante')) {
        columnMap['name'] = key;
      } else if (norm.includes('documento') || norm.includes('cedula') || norm.includes('identidad') || norm.includes('document') || norm.includes('id')) {
        columnMap['documentId'] = key;
      } else if (norm.includes('grado') || norm.includes('grade') || norm.includes('curso') || norm.includes('carrera') || norm.includes('programa') || norm.includes('tecnico')) {
        columnMap['grade'] = key;
      } else if (norm.includes('cohorte') || norm.includes('grupo') || norm.includes('ficha')) {
        columnMap['cohort'] = key;
      }
    }

    if (!columnMap['name'] || !columnMap['documentId'] || !columnMap['grade']) {
      return NextResponse.json({ 
        error: `No se encontraron las columnas requeridas. Columnas detectadas: [${firstRowKeys.join(', ')}]. Se necesitan: Nombre, Documento, y (Carrera/Grado/Programa).`,
        detectedColumns: firstRowKeys,
      }, { status: 400 });
    }

    // Get optional modality from formData
    const explicitModality = formData.get('modality') as string | null;

    // Process rows
    let created = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const row of rawData) {
      const name = String(row[columnMap['name']] || '').trim();
      const documentId = String(row[columnMap['documentId']] || '').trim();
      const grade = String(row[columnMap['grade']] || '').trim();
      const cohort = columnMap['cohort'] ? String(row[columnMap['cohort']] || '').trim() : 'N/A';

      if (!name || !documentId || !grade) {
        skipped++;
        continue;
      }

      // Auto-detect modality if not explicit
      // Rule: If grade is numeric or starts with digits (e.g. "10", "11-A"), it's FORMAL.
      // Otherwise, it's ETDH.
      const modality = explicitModality || (/^\d/.test(grade) ? 'FORMAL' : 'ETDH');

      try {
        const newStudent = await prisma.student.upsert({
          where: { documentId },
          update: { name, grade, cohort, modality },
          create: { name, documentId, grade, cohort, modality },
        });
        
        // DUAL WRITE: Sincronización ETDH en vivo con Firebase Firestore
        await firestore.collection('students').doc(documentId).set({
          prismaId: newStudent.id,
          name,
          documentId,
          grade,
          cohort,
          modality,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          system: 'Bulk Import'
        }, { merge: true });
        
        created++;
      } catch (err: any) {
        errors.push(`Fila "${name}" (${documentId}): ${err.message}`);
        skipped++;
      }
    }

    // Log the mass import action
    await logAction({
      userId: 'SISTEMA-AUTO', // You could extract UID from headers/cookies if needed
      action: 'BULK_IMPORT_STUDENTS',
      resource: `Imported ${created} and updated/skipped ${skipped} rows`,
      priority: 'high',
      payload: {
        filename: file.name,
        totalRows: rawData.length,
        created,
        skipped,
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rawData.length,
        created,
        skipped,
        errors: errors.slice(0, 5), // Max 5 errors shown
      },
    });
  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: error.message || 'Error procesando el archivo' }, { status: 500 });
  }
}
