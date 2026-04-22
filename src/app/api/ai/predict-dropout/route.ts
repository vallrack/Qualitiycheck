import { NextRequest, NextResponse } from 'next/server';
import { validateRole } from '@/lib/user-auth';

export async function POST(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { studentId, gradeSummary } = await req.json();

    if (!gradeSummary || !Array.isArray(gradeSummary)) {
      return NextResponse.json({ error: 'Faltan datos de calificaciones' }, { status: 400 });
    }

    // Simulate Network/Processing Delay for AI
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Heuristics for Dropout Risk
    const totalSubjects = gradeSummary.length;
    if (totalSubjects === 0) {
      return NextResponse.json({
        riskLevel: 'LOW',
        score: 10,
        factors: ['Estudiante nuevo o sin calificaciones registradas.']
      });
    }

    const failedSubjects = gradeSummary.filter(s => s.atRisk).length;
    const failureRate = failedSubjects / totalSubjects;

    let riskLevel = 'LOW';
    let riskScore = Math.round(failureRate * 100);
    let factors: string[] = [];

    if (riskScore > 60) {
      riskLevel = 'CRITICAL';
      factors.push(`Alta tasa de reprobación: Pierde ${failedSubjects} de ${totalSubjects} materias.`);
      factors.push('Se recomienda intervención inmediata de psicoorientación.');
    } else if (riskScore > 30) {
      riskLevel = 'MEDIUM';
      factors.push(`Riesgo académico moderado: Reprueba ${failedSubjects} materias.`);
      factors.push('Requiere plan de mejoramiento (PHVA) urgente.');
    } else {
      riskLevel = 'LOW';
      factors.push('Rendimiento académico estable.');
      if (failedSubjects > 0) {
        factors.push(`Atención leve en ${failedSubjects} materia(s).`);
      }
    }

    return NextResponse.json({
      riskLevel,
      score: riskScore,
      factors
    });
  } catch (error: any) {
    console.error('AI Prediction Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
