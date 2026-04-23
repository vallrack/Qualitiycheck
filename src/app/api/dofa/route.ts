import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';

export async function GET() {
  const { authenticated } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const items = await (prisma as any).dofaItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      // Bulk insert (Import)
      const created = await (prisma as any).dofaItem.createMany({
        data: body.map((item: any) => ({
          type: item.type,
          description: item.description,
          category: item.category || 'GENERAL',
          priority: item.priority || 'NORMAL'
        }))
      });
      return NextResponse.json(created);
    } else {
      // Single insert
      const created = await (prisma as any).dofaItem.create({
        data: {
          type: body.type,
          description: body.description,
          category: body.category || 'GENERAL',
          priority: body.priority || 'NORMAL'
        }
      });
      return NextResponse.json(created);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id, action } = await req.json();

    if (action === 'deleteAll') {
      await (prisma as any).dofaItem.deleteMany({});
      return NextResponse.json({ success: true });
    }

    if (id) {
      await (prisma as any).dofaItem.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
