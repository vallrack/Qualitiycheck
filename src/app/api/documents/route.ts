import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';
import { logAction } from '@/lib/audit-logger';

import fs from 'fs';
import path from 'path';

const physicalPathMap: Record<string, any> = {
  'NTC5581.pdf': { code: 'NTC-5581', title: 'Norma Técnica Colombiana 5581 (ETDH)', area: 'Diseño Curricular' },
  'ISO-21001.pdf': { code: 'ISO-21001', title: 'Sistema de Gestión Instituciones Educativas', area: 'Gestión de Calidad' },
  'IATF-16949.pdf': { code: 'IATF-16949', title: 'Sistema de Gestión de Calidad (Automotriz)', area: 'Sector Productivo' },
  'ISO-IEC-17025.pdf': { code: 'ISO-17025', title: 'Requisitos para Laboratorios de Ensayo', area: 'Gestión Académica' },
  'articles-157089_archivo_pdf_NTC_5555.pdf': { code: 'NTC-5555', title: 'NTC 5555: SGC Formación para el Trabajo', area: 'Gestión de Calidad' },
  'articles-398980_recurso_1.pdf': { code: 'MEN-R1', title: 'Recurso Ministerial 398980 (Evaluación)', area: 'Gestión Directiva' },
  'norma-iso-9001.pdf': { code: 'ISO-9001', title: 'SGC: Requisitos Generales', area: 'Gestión de Calidad' },
  'norma-iso-9004.pdf': { code: 'ISO-9004', title: 'Gestión para el Éxito Sostenido', area: 'Planeación Estratégica' },
  'SIET.xls': { code: 'FR-SIET-01', title: 'Matriz Sistema de Información (SIET)', area: 'Gestión Académica' },
};

export async function GET(req: Request) {
  const { authenticated } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sync = searchParams.get('sync') === 'true';

    if (sync) {
      console.log('[Sync] Starting manual sync of documents...');
      // Try 'normas iso' in root or 'public/normas'
      let dirPath = path.join(process.cwd(), 'normas iso');
      if (!fs.existsSync(dirPath)) {
        dirPath = path.join(process.cwd(), 'public', 'normas');
      }
      
      console.log('[Sync] Looking in:', dirPath);
      
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        console.log(`[Sync] Found ${files.length} files.`);
        
        for (const file of files) {
          const meta = physicalPathMap[file] || {
            code: `DOC-EXT-${Math.floor(Math.random() * 1000)}`,
            title: file.replace('.pdf', '').replace('.xls', ''),
            area: 'Gestión General'
          };

          console.log(`[Sync] Processing: ${meta.code}`);
          await prisma.qualityDocument.upsert({
            where: { code: meta.code },
            update: { physicalPath: `/normas/${file}` },
            create: {
              code: meta.code,
              title: meta.title,
              area: meta.area,
              physicalPath: `/normas/${file}`,
              status: 'VIGENTE'
            }
          });
        }
        console.log('[Sync] Finished upserting files.');
      } else {
        console.warn('[Sync] Directory not found at:', dirPath);
      }
    }

    const docs = await prisma.qualityDocument.findMany({
      orderBy: { code: 'asc' }
    });
    
    // Debug log to file
    try {
      const logPath = path.join(process.cwd(), 'scratch', 'api-docs-log.json');
      fs.writeFileSync(logPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        count: docs.length,
        docs: docs.map(d => ({ code: d.code, title: d.title }))
      }, null, 2));
    } catch (logErr) {}

    return NextResponse.json(docs);
  } catch (error: any) {
    console.error('Documents API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const code = formData.get('code') as string;
      const title = formData.get('title') as string;
      const area = formData.get('area') as string;
      const version = formData.get('version') as string;

      if (!file) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const dirPath = path.join(process.cwd(), 'public', 'normas');
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, buffer);

      const newDoc = await prisma.qualityDocument.create({
        data: {
          code: code || `DOC-${fileName.split('.')[0].toUpperCase()}`,
          title: title || fileName,
          version: version || 'V1',
          status: 'VIGENTE',
          area: area || 'Gestión de Calidad',
          physicalPath: `/normas/${fileName}`
        }
      });

      return NextResponse.json(newDoc, { status: 201 });
    } else {
      // Legacy JSON Support
      const data = await req.json();
      const newDoc = await prisma.qualityDocument.create({
        data: {
          code: data.code,
          title: data.title,
          version: data.version || 'V1',
          status: 'EN_REVISION',
          area: data.area || 'Gestión de Calidad',
          physicalPath: data.physicalPath || null
        }
      });
      return NextResponse.json(newDoc, { status: 201 });
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updated = await prisma.qualityDocument.update({
      where: { id },
      data: updates
    });

    await logAction({
      userId: user?.uid || 'SYSTEM',
      action: 'UPDATE_QUALITY_DOC',
      resource: `QualityDocument:${id}`,
      priority: 'medium',
      payload: updates
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
