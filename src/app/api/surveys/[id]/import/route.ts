import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db/prisma';
import { getServerSession } from '../../../../../lib/user-auth';
import * as XLSX from 'xlsx';

// POST /api/surveys/[id]/import — import responses from Excel (admin)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const survey: any = await (prisma as any).surveyForm.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!survey) return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);

  if (!rows.length) return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 });

  const questions = survey.questions as any[];
  let imported = 0;

  for (const row of rows) {
    const answers: Record<string, any> = {};

    for (const q of questions) {
      // Try matching column header to question text (flexible matching)
      const matchingKey = Object.keys(row).find(k =>
        k.toLowerCase().includes(q.text.toLowerCase().slice(0, 20)) ||
        k.toLowerCase() === q.id.toLowerCase()
      );
      if (matchingKey !== undefined) {
        const rawVal = row[matchingKey];
        if (q.type === 'rating') {
          const num = Number(rawVal);
          if (!isNaN(num) && num >= 1 && num <= 5) answers[q.id] = num;
        } else if (q.type === 'yesno') {
          const str = String(rawVal).toLowerCase();
          answers[q.id] = ['sí', 'si', 'yes', 'true', '1'].includes(str);
        } else {
          answers[q.id] = String(rawVal);
        }
      }
    }

    if (Object.keys(answers).length > 0) {
      await (prisma as any).surveyResponse.create({
        data: { surveyId: survey.id, answers, source: 'EXCEL_IMPORT' }
      });
      imported++;
    }
  }

  return NextResponse.json({ ok: true, imported, total: rows.length });
}
