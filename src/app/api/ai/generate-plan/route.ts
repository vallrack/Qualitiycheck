import { NextResponse } from 'next/server';
import { validateRole } from '@/lib/user-auth';

export const dynamic = 'force-dynamic';

// Simulated AI endpoint for generating Convivencia Improvement Plans.
// In a real production scenario, this would call OpenAI (GPT-4) or Anthropic (Claude).
export async function POST(req: Request) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { description, type, severity } = await req.json();

    if (!description) {
      return NextResponse.json({ error: 'Se requiere una descripción para generar el plan.' }, { status: 400 });
    }

    // Heuristic AI Generation Logic (Simulated)
    // We generate a professional, Ley 1620 compliant improvement plan based on keywords and severity.

    let plan = `De acuerdo al manual de convivencia (Ley 1620) y dado que se trata de una situación Tipo ${type} con nivel de severidad ${severity}, se establecen los siguientes compromisos:\n\n`;

    const descLower = description.toLowerCase();

    // Context analysis
    if (descLower.includes('pelea') || descLower.includes('golpe') || descLower.includes('agresión')) {
      plan += `1. **Compromiso de No Agresión:** El estudiante se compromete a resolver cualquier diferencia futura a través del diálogo mediado y a no recurrir a agresiones físicas o verbales bajo ninguna circunstancia.\n`;
      plan += `2. **Taller de Resolución Pacífica:** Asistencia obligatoria a 2 sesiones de mediación de conflictos lideradas por el área de Psicoorientación.\n`;
    } else if (descLower.includes('bullying') || descLower.includes('acoso')) {
      plan += `1. **Cese Inmediato de Hostigamiento:** Suspensión absoluta de cualquier acto que atente contra la dignidad o integridad psicológica del compañero afectado.\n`;
      plan += `2. **Ruta de Restauración:** Participación en una mesa de justicia restaurativa con las partes involucradas (si aplica y es seguro).\n`;
    } else if (descLower.includes('celular') || descLower.includes('dispositivo')) {
      plan += `1. **Uso Adecuado de Dispositivos:** El estudiante entregará su dispositivo móvil a Coordinación al inicio de la jornada escolar durante los próximos 5 días hábiles.\n`;
    } else if (descLower.includes('clase') || descLower.includes('académico') || descLower.includes('tarea')) {
      plan += `1. **Cumplimiento Académico:** Presentar todas las actividades pendientes en un plazo no mayor a 3 días hábiles.\n`;
      plan += `2. **Atención en Aula:** Mejorar la actitud de escucha y respeto durante las intervenciones de los docentes.\n`;
    } else {
      plan += `1. **Reflexión y Modificación de Conducta:** El estudiante reconoce la falta cometida y se compromete a no repetirla, demostrando respeto por el pacto de convivencia institucional.\n`;
    }

    // Severity adjustments
    if (severity === 'CRITICAL') {
      plan += `3. **Citación Obligatoria a Acudientes:** Firma de acta de compromiso por parte de los padres/acudientes legales en un plazo máximo de 24 horas.\n`;
      plan += `4. **Activación de Ruta Integral:** Reporte automático al Comité Escolar de Convivencia para posible derivación a entidades externas (ICBF/Policía de Infancia).\n`;
    } else if (severity === 'HIGH') {
      plan += `3. **Seguimiento Disciplinario:** Entrevista de seguimiento en 15 días con Coordinación de Convivencia para verificar el cumplimiento del plan.\n`;
    } else {
      plan += `2. **Diálogo Formativo:** Seguimiento por parte del Titular o Director de Grupo.\n`;
    }

    plan += `\n*Este plan fue estructurado automáticamente por Antigravity SGC AI basado en los protocolos del comité de convivencia.*`;

    // Simulate AI network delay (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({ plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
