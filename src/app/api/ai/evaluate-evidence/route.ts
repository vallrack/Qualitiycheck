import { NextRequest, NextResponse } from 'next/server';
import { validateRole } from '@/lib/user-auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { title, type, contentExtracted, standard } = await req.json();

    if (!contentExtracted || contentExtracted.trim().length < 50) {
      return NextResponse.json({ error: 'El contenido extraído es muy corto para ser evaluado.' }, { status: 400 });
    }

    // SIMULATED AI EVALUATION ENGINE
    // In a production environment, this text would be sent to OpenAI GPT-4o or Claude 3.5 Sonnet
    // with a system prompt containing the specific ISO/NTC standard rubric.

    let score = 0;
    let findings: string[] = [];
    let recommendations: string[] = [];

    const contentLower = contentExtracted.toLowerCase();

    // Heuristics based on standard type
    if (standard === 'ISO 21001') {
      if (contentLower.includes('objetivo') && contentLower.includes('mejora')) {
        score += 30;
        findings.push('✅ Cumple: Se evidencian objetivos de calidad y enfoque de mejora continua.');
      } else {
        findings.push('❌ No Conformidad Menor: Falta definición clara de objetivos de calidad (Cláusula 6.2).');
        recommendations.push('Incluir una sección explícita de objetivos medibles y plan de mejora.');
      }

      if (contentLower.includes('liderazgo') || contentLower.includes('política')) {
        score += 30;
        findings.push('✅ Cumple: Existe declaración de política y liderazgo directivo.');
      } else {
        findings.push('❌ No Conformidad Menor: Ausencia de evidencia de liderazgo y compromiso (Cláusula 5.1).');
      }

      if (contentLower.includes('evaluación') || contentLower.includes('auditoría')) {
        score += 25;
        findings.push('✅ Cumple: Mecanismos de evaluación del desempeño presentes.');
      } else {
        findings.push('❌ No Conformidad Mayor: Falta definir procesos de auditoría interna y evaluación (Cláusula 9).');
        recommendations.push('Implementar cronograma de auditorías y encuestas de satisfacción.');
      }
      
      score += 15; // Baseline formatting
    } else if (standard === 'NTC 5555' || standard === 'NTC 5581') { // ETDH
      if (contentLower.includes('competencia') || contentLower.includes('laboral')) {
        score += 40;
        findings.push('✅ Cumple: Diseño enfocado en competencias laborales (Requisito NTC 5581).');
      } else {
        findings.push('❌ No Conformidad Mayor: El programa no está estructurado por competencias y resultados de aprendizaje.');
        recommendations.push('Re-estructurar la matriz curricular enfocándose en competencias del sector productivo.');
      }

      if (contentLower.includes('practica') || contentLower.includes('taller')) {
        score += 40;
        findings.push('✅ Cumple: Evidencia de componentes prácticos para ETDH.');
      } else {
        findings.push('❌ No Conformidad Menor: Escasez de evidencia metodológica práctica.');
        recommendations.push('Asegurar que el 50% del contenido describa talleres o prácticas operativas.');
      }
      score += 10;
    } else {
      // Generic Evaluation
      score = 75;
      findings.push('⚠️ Evaluación genérica. Se recomienda usar una norma específica.');
      recommendations.push('Alinear el documento con un estándar reconocido.');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Simulate Network/Processing Delay (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiAnalysis = {
      summary: `Evaluación completada para el documento tipo ${type} bajo la norma ${standard}.`,
      findings,
      recommendations
    };

    // Save the record in the database
    const evidenceRecord = await prisma.qualityEvidence.create({
      data: {
        title,
        type,
        contentExtracted,
        standard,
        complianceScore: score,
        aiAnalysis
      }
    });

    return NextResponse.json(evidenceRecord);
  } catch (error: any) {
    console.error('AI Evaluation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
