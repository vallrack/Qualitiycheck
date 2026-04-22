import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Type extension for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export const generateConvivenciaAct = (caseData: any) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const marginX = 40;
  let cursorY = 40;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red color
  doc.text('ACTA DE CONVIVENCIA ESCOLAR', doc.internal.pageSize.width / 2, cursorY, { align: 'center' });
  
  cursorY += 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('SISTEMA DE GESTIÓN DE CALIDAD INSTITUCIONAL', doc.internal.pageSize.width / 2, cursorY, { align: 'center' });
  
  cursorY += 15;
  doc.text(`Ley 1620 de 2013 - Ruta de Atención Integral`, doc.internal.pageSize.width / 2, cursorY, { align: 'center' });

  // Divider
  cursorY += 25;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, cursorY, doc.internal.pageSize.width - marginX, cursorY);
  
  cursorY += 30;

  // Metadata Box
  doc.autoTable({
    startY: cursorY,
    theme: 'grid',
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42] },
    body: [
      ['Fecha y Hora del Suceso:', new Date(caseData.createdAt).toLocaleString('es-CO')],
      ['Estudiante Implicado:', caseData.student?.name || 'N/A'],
      ['Gravedad del Caso:', caseData.severity],
      ['Clasificación:', `Tipo ${caseData.type}`],
      ['ID del Caso:', caseData.id],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 150 },
    },
    margin: { left: marginX, right: marginX }
  });

  cursorY = doc.lastAutoTable.finalY + 30;

  // Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('HECHOS RELATADOS (VERSIÓN LIBRE)', marginX, cursorY);
  
  cursorY += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  
  const splitDescription = doc.splitTextToSize(caseData.description || 'Sin descripción detallada.', doc.internal.pageSize.width - marginX * 2);
  doc.text(splitDescription, marginX, cursorY);

  cursorY += splitDescription.length * 12 + 40;

  // Check if we need a new page for signatures
  if (cursorY > doc.internal.pageSize.height - 150) {
    doc.addPage();
    cursorY = 50;
  }

  // Legal Notice
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  const legalText = `En cumplimiento de la Ley 1620 de 2013, los abajo firmantes dejan constancia de la información contenida en la presente acta, garantizando el debido proceso escolar. Constancia válida bajo firma digital o física en el Sistema de Gestión Institucional.`;
  const splitLegal = doc.splitTextToSize(legalText, doc.internal.pageSize.width - marginX * 2);
  doc.text(splitLegal, marginX, cursorY);

  cursorY += 60;

  // Signatures
  const signatureWidth = 180;
  doc.setDrawColor(15, 23, 42); // slate-900

  // Signature 1
  doc.line(marginX, cursorY, marginX + signatureWidth, cursorY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.student?.name || 'Firma Estudiante/Acudiente', marginX, cursorY + 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Implicado', marginX, cursorY + 28);

  // Signature 2 (Centered right)
  const rightMarginX = doc.internal.pageSize.width - marginX - signatureWidth;
  doc.line(rightMarginX, cursorY, rightMarginX + signatureWidth, cursorY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Coordinación de Convivencia', rightMarginX, cursorY + 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sello Institucional', rightMarginX, cursorY + 28);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento generado confidencialmente vía Antigravity SGC. | Página 1 de 1`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });

  // Download
  doc.save(`Acta_Convivencia_${caseData.id}.pdf`);
};

// ─── Boletín Académico ────────────────────────────────────────────────────────
export const generateBoletin = (data: any) => {
  const { student, subjects, stats } = data;
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageW  = doc.internal.pageSize.width;
  const pageH  = doc.internal.pageSize.height;
  const marginX = 40;
  let cursorY = 40;

  // ── Header band ─────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 80, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // red-600
  doc.text('SGC INSTITUCIONAL', marginX, 28);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BOLETÍN DE CALIFICACIONES', marginX, 50);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  const normTitle = stats.institutionType === 'ETDH' 
    ? 'Educación para el Trabajo y Desarrollo Humano (ETDH)' 
    : 'Sistema Institucional de Evaluación de Estudiantes (SIEE) · Decreto 1290 de 2009';
  doc.text(normTitle, marginX, 68);

  // Date top-right
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generado: ${new Date(stats.generatedAt).toLocaleString('es-CO')}`,
    pageW - marginX, 28, { align: 'right' }
  );

  cursorY = 100;

  // ── Student info block ───────────────────────────────────────────────────
  doc.autoTable({
    startY: cursorY,
    theme: 'grid',
    styles: { fontSize: 9, font: 'helvetica' },
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
    body: [
      ['Estudiante:', student.name,          'Documento:', student.documentId],
      [stats.institutionType === 'ETDH' ? 'Carrera Base:' : 'Grado / Carrera:', student.grade,    stats.institutionType === 'ETDH' ? 'Ficha:' : 'Cohorte / Ficha:', student.cohort || 'N/A'],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { cellWidth: 180 },
      2: { fontStyle: 'bold', cellWidth: 90 },
      3: { cellWidth: 150 },
    },
    margin: { left: marginX, right: marginX },
  });

  cursorY = doc.lastAutoTable.finalY + 20;

  // ── Overall stats strip ──────────────────────────────────────────────────
  const PROMO_COLOR = stats.overallAverage >= 3.0 ? [5, 150, 105] : [220, 38, 38]; // emerald / red
  doc.setFillColor(...(PROMO_COLOR as [number, number, number]));
  doc.roundedRect(marginX, cursorY, pageW - marginX * 2, 36, 8, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Promedio General: ${stats.overallAverage.toFixed(1)}   ·   Asignaturas Aprobadas: ${stats.approved}/${stats.total}   ·   En Riesgo: ${stats.atRisk}`,
    pageW / 2, cursorY + 22, { align: 'center' }
  );

  cursorY = doc.lastAutoTable.finalY + 72;

  // ── Grades table ─────────────────────────────────────────────────────────
  const isETDH = stats.institutionType === 'ETDH';

  const rows = subjects.map((s: any) => {
    const p = (n: number) => s.periods[n]?.final !== undefined ? s.periods[n].final.toFixed(1) : '—';
    const sub = (n: number, type: 'cog' | 'per' | 'soc') => {
      const per = s.periods[n];
      if (!per) return '—';
      if (type === 'cog') return per.cognitive !== undefined ? per.cognitive.toFixed(1) : '—';
      if (type === 'per') return per.personal !== undefined ? per.personal.toFixed(1) : '—';
      if (type === 'soc') return per.social !== undefined ? per.social.toFixed(1) : '—';
    };

    const promText: Record<string, string> = {
      APROBADO: 'Aprobado',
      EN_RIESGO: 'En Riesgo',
      REPROBADO: 'Reprobado',
      SIN_DATOS: '—',
    };

    if (isETDH) {
      // In ETDH, we assume period 1 is used for the module scores
      return [
        s.areaCode,
        s.subjectName,
        s.weeklyHours + 'h',
        sub(1, 'cog'), // Conocimiento
        sub(1, 'per'), // Desempeño
        sub(1, 'soc'), // Producto
        p(1),          // Final del modulo
        s.average > 0 ? s.average.toFixed(1) : '—',
        promText[s.promotion] || '—',
      ];
    }

    return [
      s.areaCode,
      s.subjectName,
      s.weeklyHours + 'h',
      p(1), p(2), p(3), p(4),
      s.average > 0 ? s.average.toFixed(1) : '—',
      promText[s.promotion] || '—',
    ];
  });

  const headRow = isETDH 
    ? ['Prog', 'Módulo Transversal / Específico', 'Horas', 'Conoc.', 'Desemp.', 'Prod.', 'N. Mod.', 'Prom.', 'Estado']
    : ['Área', 'Asignatura', 'H/Sem', 'P1', 'P2', 'P3', 'P4', 'Prom.', 'Estado'];

  doc.autoTable({
    startY: cursorY,
    head: [headRow],
    body: rows,
    theme: 'striped',
    styles: { fontSize: 8.5, font: 'helvetica', cellPadding: 5 },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 36, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 165 },
      2: { cellWidth: 34, halign: 'center' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 32, halign: 'center' },
      6: { cellWidth: 32, halign: 'center' },
      7: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 64, halign: 'center' },
    },
    didParseCell(data: any) {
      if (data.column.index === 8 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'Aprobado')    data.cell.styles.textColor = [5, 150, 105];
        if (val === 'En Riesgo')   data.cell.styles.textColor = [245, 158, 11];
        if (val === 'Reprobado')   data.cell.styles.textColor = [220, 38, 38];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === 7 && data.section === 'body') {
        const val = parseFloat(data.cell.raw);
        if (!isNaN(val) && val < 3.0) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: marginX, right: marginX },
  });

  cursorY = doc.lastAutoTable.finalY + 40;

  // ── Signature blocks ─────────────────────────────────────────────────────
  if (cursorY > pageH - 130) { doc.addPage(); cursorY = 50; }

  const sigW   = 160;
  const sigY   = cursorY + 40;
  const sigCols = [marginX, pageW / 2 - sigW / 2, pageW - marginX - sigW];
  const sigLabels = ['Acudiente / Padre de Familia', 'Director(a) de Grupo', 'Coordinación Académica'];

  sigCols.forEach((x, i) => {
    doc.setDrawColor(203, 213, 225);
    doc.line(x, sigY, x + sigW, sigY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(sigLabels[i], x + sigW / 2, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Sello Institucional', x + sigW / 2, sigY + 25, { align: 'center' });
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Documento generado vía Antigravity SGC · Confidencial',
    pageW / 2, pageH - 20, { align: 'center' }
  );

  doc.save(`Boletin_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── Acta de Plan de Mejoramiento (PHVA / PMI) ────────────────────────────────
export const generateActaPMI = (plan: any) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageW = doc.internal.pageSize.width;
  const marginX = 50;
  let cursorY = 50;

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 70, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTA DE PLAN DE MEJORAMIENTO (PMI)', marginX, 35);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Sistema Institucional de Gestión de Calidad · Ciclo PHVA', marginX, 52);

  cursorY = 100;

  // Basic Info Table
  doc.autoTable({
    startY: cursorY,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    body: [
      ['Estudiante:', plan.student?.name, 'Documento:', plan.student?.documentId],
      ['Grado / Carrera:', plan.student?.grade, 'Asignatura:', plan.subject?.name || 'General (Todas)'],
      ['Periodo:', plan.period, 'Prioridad:', plan.priority],
      ['Estado:', plan.status, 'Fecha Reporte:', new Date(plan.createdAt).toLocaleDateString()],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 2: { fontStyle: 'bold', cellWidth: 80 } },
    margin: { left: marginX, right: marginX }
  });

  cursorY = doc.lastAutoTable.finalY + 40;

  // PHVA Steps
  const steps = [
    { label: 'P — PLANEAR (Diagnóstico y Metas)', value: plan.planear, color: [37, 99, 235] },
    { label: 'H — HACER (Actividades de Mejora)', value: plan.hacer, color: [5, 150, 105] },
    { label: 'V — VERIFICAR (Seguimiento e Indicadores)', value: plan.verificar, color: [217, 119, 6] },
    { label: 'A — ACTUAR (Compromisos y Ajustes)', value: plan.actuar, color: [124, 58, 237] }
  ];

  steps.forEach(step => {
    if (!step.value) return;

    doc.setFillColor(...(step.color as [number, number, number]));
    doc.rect(marginX, cursorY, 5, 15, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(step.label, marginX + 15, cursorY + 12);
    
    cursorY += 25;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitText = doc.splitTextToSize(step.value, pageW - marginX * 2 - 20);
    doc.text(splitText, marginX + 15, cursorY);
    
    cursorY += splitText.length * 12 + 30;

    if (cursorY > doc.internal.pageSize.height - 100) {
      doc.addPage();
      cursorY = 50;
    }
  });

  // Signatures
  cursorY += 40;
  if (cursorY > doc.internal.pageSize.height - 100) { doc.addPage(); cursorY = 50; }

  const sigW = 160;
  doc.setDrawColor(203, 213, 225);
  doc.line(marginX, cursorY + 40, marginX + sigW, cursorY + 40);
  doc.line(pageW - marginX - sigW, cursorY + 40, pageW - marginX, cursorY + 40);
  
  doc.setFontSize(8);
  doc.text('Firma Estudiante / Acudiente', marginX + sigW / 2, cursorY + 54, { align: 'center' });
  doc.text('Coordinación Académica', pageW - marginX - sigW / 2, cursorY + 54, { align: 'center' });

  doc.save(`Acta_PMI_${plan.student?.name.replace(/\s+/g, '_')}_${plan.id.slice(0, 5)}.pdf`);
};
