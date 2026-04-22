const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const fs = require('fs');
const path = require('path');

const physicalPathMap = {
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

async function sync() {
  const adapter = new PrismaMariaDb({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'qualitycheck',
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const dirPath = path.join(process.cwd(), 'public', 'normas');
    console.log('Syncing from:', dirPath);
    
    if (!fs.existsSync(dirPath)) {
      console.error('Directory not found');
      return;
    }

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const meta = physicalPathMap[file] || {
        code: `DOC-EXT-${Math.floor(Math.random() * 1000)}`,
        title: file.replace('.pdf', '').replace('.xls', ''),
        area: 'Varios'
      };

      console.log('Upserting:', meta.code);
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
    console.log('Sync complete');
  } catch (e) {
    console.error('Error during sync:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

sync();
