import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const physicalPathMap: Record<string, any> = {
  'NTC5581.pdf': { code: 'NTC-5581', title: 'Norma Técnica Colombiana 5581 (ETDH)', area: 'Diseño Curricular' },
  'ISO-21001.pdf': { code: 'ISO-21001', title: 'Sistema de Gestión Instituciones Educativas', area: 'Gestión de Calidad' },
  'IATF-16949.pdf': { code: 'IATF-16949', title: 'Sistema de Gestión de Calidad (Automotriz/Industrial)', area: 'Sector Productivo' },
  'ISO-IEC-17025.pdf': { code: 'ISO-17025', title: 'Requisitos para Laboratorios de Ensayo', area: 'Gestión Académica' },
  'articles-157089_archivo_pdf_NTC_5555.pdf': { code: 'NTC-5555', title: 'Norma NTC 5555: SGC Formación para el Trabajo', area: 'Gestión de Calidad' },
  'articles-398980_recurso_1.pdf': { code: 'MEN-R1', title: 'Recurso Ministerial 398980 (Evaluación)', area: 'Gestión Directiva' },
  'norma-iso-9001.pdf': { code: 'ISO-9001', title: 'Sistema de Gestión de la Calidad (Requisitos Generales)', area: 'Gestión de Calidad' },
  'norma-iso-9004.pdf': { code: 'ISO-9004', title: 'Gestión para el Éxito Sostenido (Mejora Continua)', area: 'Planeación Estratégica' },
  'SIET.xls': { code: 'FR-SIET-01', title: 'Matriz Sistema de Información (SIET)', area: 'Gestión Académica' },
};

async function main() {
  console.log('🌱 Escaneando directorio /public/normas...');
  const dirPath = path.join(__dirname, 'public', 'normas');
  
  if (!fs.existsSync(dirPath)) {
    console.error('El directorio no existe:', dirPath);
    return;
  }

  const files = fs.readdirSync(dirPath);
  console.log(`Archivos encontrados: ${files.length}`);

  for (const file of files) {
    const defaultMeta = physicalPathMap[file] || {
      code: `DOC-${Math.floor(Math.random() * 10000)}`,
      title: file.replace('.pdf', '').replace('.xls', ''),
      area: 'Gestión General'
    };

    const docPath = `/normas/${file}`;

    console.log(`Insertando/Actualizando: ${defaultMeta.code}`);
    await prisma.qualityDocument.upsert({
      where: { code: defaultMeta.code },
      update: { physicalPath: docPath },
      create: {
        code: defaultMeta.code,
        title: defaultMeta.title,
        area: defaultMeta.area,
        physicalPath: docPath,
        status: 'VIGENTE'
      }
    });
  }

  console.log('✅ Listado Maestro de Documentos Sembrado Exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
