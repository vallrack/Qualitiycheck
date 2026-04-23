import { NextRequest, NextResponse } from 'next/server';
import { validateRole } from '@/lib/user-auth';
import { fullDocumentAnalysis } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  const { authenticated } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { text, filename } = await req.json();

    console.log(`[AI-Process] Recibido archivo: ${filename}, Longitud texto: ${text?.length || 0}`);

    if (!text || text.length < 50) {
      console.warn('[AI-Process] Texto insuficiente');
      return NextResponse.json({ error: 'Texto insuficiente para análisis' }, { status: 400 });
    }

    // Ejecutar análisis total en una sola pasada
    console.log(`[AI-Process] Iniciando análisis exhaustivo para ${filename}...`);
    const analysis = await fullDocumentAnalysis(text);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('[AI-Process] ERROR FATAL:', error);
    return NextResponse.json({ error: error.message || 'Error interno en el procesamiento de IA' }, { status: 500 });
  }
}
