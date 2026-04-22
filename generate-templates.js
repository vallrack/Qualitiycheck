const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, 'public', 'templates');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ─── 1. PLANTILLA ESTUDIANTES ──────────────────────────────────────────────
const estudiantesData = [
  {
    'Nombre Completo': 'Juan Pérez García',
    'Documento de Identidad': '1001234567',
    'Grado o Carrera': '10',
    'Cohorte o Ficha': '2024-A',
  },
  {
    'Nombre Completo': 'María Rodríguez López',
    'Documento de Identidad': '1009876543',
    'Grado o Carrera': 'Técnico en Sistemas',
    'Cohorte o Ficha': 'FICHA-2024-01',
  },
  {
    'Nombre Completo': 'Carlos Martínez',
    'Documento de Identidad': '1005551234',
    'Grado o Carrera': '11',
    'Cohorte o Ficha': '2024-B',
  },
];

const wsEstudiantes = XLSX.utils.json_to_sheet(estudiantesData);
wsEstudiantes['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 28 }, { wch: 20 }];
const wbEstudiantes = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbEstudiantes, wsEstudiantes, 'Estudiantes');
XLSX.writeFile(wbEstudiantes, path.join(outputDir, 'plantilla_estudiantes.xlsx'));
console.log('✅  plantilla_estudiantes.xlsx generada');

// ─── 2. PLANTILLA CARRERAS / CURRÍCULO ETDH ───────────────────────────────
const curriculoData = [
  {
    'Carrera o Área': 'Técnico en Sistemas',
    'Módulo o Asignatura': 'Fundamentos de Programación',
    'Competencia o Logro': 'El aprendiz desarrolla algoritmos básicos aplicando estructuras de control.',
    'Referencia DBA': 'DBA-SIS-01',
    'Horas Semanales': 4,
    'Periodo': 1,
  },
  {
    'Carrera o Área': 'Técnico en Sistemas',
    'Módulo o Asignatura': 'Bases de Datos',
    'Competencia o Logro': 'El aprendiz diseña e implementa bases de datos relacionales con SQL.',
    'Referencia DBA': 'DBA-SIS-02',
    'Horas Semanales': 4,
    'Periodo': 2,
  },
  {
    'Carrera o Área': 'Técnico en Contabilidad',
    'Módulo o Asignatura': 'Contabilidad General',
    'Competencia o Logro': 'El aprendiz registra operaciones contables en el libro diario y mayor.',
    'Referencia DBA': 'DBA-CON-01',
    'Horas Semanales': 5,
    'Periodo': 1,
  },
];

const wsCurriculo = XLSX.utils.json_to_sheet(curriculoData);
wsCurriculo['!cols'] = [{ wch: 28 }, { wch: 30 }, { wch: 55 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
const wbCurriculo = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbCurriculo, wsCurriculo, 'Curriculo ETDH');
XLSX.writeFile(wbCurriculo, path.join(outputDir, 'plantilla_curriculo.xlsx'));
console.log('✅  plantilla_curriculo.xlsx generada');

// ─── 3. PLANTILLA INFORMES / CALIFICACIONES ────────────────────────────────
const informesData = [
  {
    'Documento de Identidad': '1001234567',
    'Asignatura o Módulo': 'Fundamentos de Programación',
    'Periodo': 1,
    'Nota Cognitiva (0-5)': 4.2,
    'Nota Personal (0-5)': 4.5,
    'Nota Social (0-5)': 4.0,
    'Observaciones': 'Excelente desempeño en actividades prácticas.',
  },
  {
    'Documento de Identidad': '1009876543',
    'Asignatura o Módulo': 'Bases de Datos',
    'Periodo': 2,
    'Nota Cognitiva (0-5)': 3.8,
    'Nota Personal (0-5)': 4.1,
    'Nota Social (0-5)': 3.9,
    'Observaciones': 'Requiere refuerzo en normalización de tablas.',
  },
  {
    'Documento de Identidad': '1005551234',
    'Asignatura o Módulo': 'Contabilidad General',
    'Periodo': 1,
    'Nota Cognitiva (0-5)': 3.5,
    'Nota Personal (0-5)': 4.0,
    'Nota Social (0-5)': 4.2,
    'Observaciones': '',
  },
];

const wsInformes = XLSX.utils.json_to_sheet(informesData);
wsInformes['!cols'] = [{ wch: 24 }, { wch: 32 }, { wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 40 }];
const wbInformes = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbInformes, wsInformes, 'Calificaciones SIEE');
XLSX.writeFile(wbInformes, path.join(outputDir, 'plantilla_informes.xlsx'));
console.log('✅  plantilla_informes.xlsx generada');

console.log('\n🎉 Las 3 plantillas han sido generadas en /public/templates/');
