import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const count = await prisma.qualityDocument.count();
    const firstTen = await prisma.qualityDocument.findMany({ take: 10 });
    return NextResponse.json({
      database: 'connected',
      table: 'qualitydocument',
      count,
      data: firstTen
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
