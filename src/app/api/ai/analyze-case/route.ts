import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: 'Descripción insuficiente para análisis' },
        { status: 400 }
      );
    }

    const analysis = await AIOrchestrator.analyzeCase(description);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json(
      { error: 'Error procesando el análisis de IA', details: error.message },
      { status: 500 }
    );
  }
}
