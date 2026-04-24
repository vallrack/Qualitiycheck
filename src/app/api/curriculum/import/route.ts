import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as XLSX from 'xlsx';
import admin, { db as firestore } from '@/lib/firebase-admin';
import { logAction } from '@/lib/audit-logger';
import { getServerSession } from '@/lib/user-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    console.warn('[Import Auth] Unauthorized access attempt detected.');
    return NextResponse.json({ 
      error: 'Sesión inválida o expirada. Por favor, cierra sesión y vuelve a ingresar para refrescar tu acceso.' 
    }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibiÃ³ ningÃºn archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel estÃ¡ vacÃ­o' }, { status: 400 });
    }

    const normalize = (str: string) => str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const columnMap: Record<string, string> = {};
    const firstRowKeys = Object.keys(rawData[0]);
    
    for (const key of firstRowKeys) {
      const norm = normalize(key);
      if (norm.includes('carrera') || norm.includes('area') || norm.includes('programa')) columnMap['area'] = key;
      else if (norm.includes('modulo') || norm.includes('asignatura') || norm.includes('materia')) columnMap['subject'] = key;
      else if (norm.includes('competencia') || norm.includes('logro') || norm.includes('desempeño')) columnMap['competency'] = key;
    }

    if (!columnMap['area'] || !columnMap['subject'] || !columnMap['competency']) {
      return NextResponse.json({ 
        error: `No se encontraron las columnas requeridas. Necesitas: [Carrera/Ãrea], [MÃ³dulo/Asignatura], y [Competencia]. Detectadas: [${firstRowKeys.join(', ')}].`
      }, { status: 400 });
    }

    let createdAreas = 0;
    let createdSubjects = 0;
    let createdPlans = 0;
    let createdPrograms = 0;

    // Cache para evitar mÃºltiples consultas a la DB
    const areaCache: Record<string, any> = {};
    const subjectCache: Record<string, any> = {};
    const programCache: Record<string, any> = {};

    const institution = await prisma.institution.findFirst();
    if (!institution) {
      return NextResponse.json({ error: 'Debe configurar la instituciÃ³n antes de importar.' }, { status: 400 });
    }

    for (const row of rawData) {
      const areaName = String(row[columnMap['area']] || '').trim();
      const subjectName = String(row[columnMap['subject']] || '').trim();
      const competency = String(row[columnMap['competency']] || '').trim();

      if (!areaName || !subjectName || !competency) continue;

      // 1. Encontrar o Crear "Carrera" (SubjectArea)
      let area = areaCache[areaName];
      if (!area) {
        area = await prisma.subjectArea.findUnique({ where: { name: areaName } });
        if (!area) {
          area = await prisma.subjectArea.create({
            data: { name: areaName, code: areaName.substring(0, 3).toUpperCase() + Math.floor(Math.random()*1000) }
          });
          createdAreas++;
        }
        areaCache[areaName] = area;
      }

      // 2. Encontrar o Crear "Programa" (Para el mÃ³dulo de Calidad e ISO)
      let program = programCache[areaName];
      if (!program) {
        program = await prisma.program.findFirst({ where: { name: areaName } });
        if (!program) {
          program = await prisma.program.create({
            data: {
              name: areaName,
              code: area.code, // Usamos el mismo código del área para vincularlos
              type: institution.type,
              institutionId: institution.id
            }
          });
          createdPrograms++;
        }
        programCache[areaName] = program;
      }

      // 3. Encontrar o Crear "MÃ³dulo" (Subject)
      const subjectKey = `${area.id}-${subjectName}`;
      let subject = subjectCache[subjectKey];
      if (!subject) {
        subject = await prisma.subject.findFirst({
          where: { name: subjectName, areaId: area.id }
        });

        if (!subject) {
          subject = await prisma.subject.create({
            data: {
              name: subjectName,
              grade: areaName, 
              areaId: area.id,
              programId: program.id, // Vinculamos la materia al programa
              weeklyHours: 4,
            }
          });
          createdSubjects++;
        }
        subjectCache[subjectKey] = subject;
      }

      // 4. Crear "Plan / Competencia" (CurriculumPlan) por defecto Periodo 1
      await prisma.curriculumPlan.create({
        data: {
          subjectId: subject.id,
          period: 1,
          competency: competency
        }
      });
      createdPlans++;
    }

    // DUAL WRITE: Sincronización en masa de la estructura ETDH
    await firestore.collection('audit_curricular_imports').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAreas,
      createdSubjects,
      createdPlans,
      system: 'ETDH Mass Importer'
    });

    await logAction({
      userId: 'COORDINADOR',
      action: 'BULK_IMPORT_CURRICULUM',
      resource: `Imported ${createdAreas} Areas, ${createdSubjects} Subjects, ${createdPlans} Plans`,
      priority: 'high',
      payload: { file: file.name, stats: { createdAreas, createdSubjects, createdPlans } }
    });

    return NextResponse.json({
      success: true,
      summary: { createdAreas, createdSubjects, createdPlans, createdPrograms }
    });
  } catch (error: any) {
    console.error('Curriculum Import Error:', error);
    return NextResponse.json({ error: error.message || 'Error procesando el currículo' }, { status: 500 });
  }
}
