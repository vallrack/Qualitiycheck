import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';

export async function GET() {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const inst = await prisma.institution.findFirst();
    const defaultSiee = {
      min: 1.0, max: 5.0, passing: 3.0,
      levels: [
        { name: 'Bajo', min: 1.0, max: 2.9 },
        { name: 'Básico', min: 3.0, max: 3.9 },
        { name: 'Alto', min: 4.0, max: 4.5 },
        { name: 'Superior', min: 4.6, max: 5.0 }
      ]
    };

    if (!inst) {
      // Default mock if none exists
      return NextResponse.json({
        name: 'Ciudad Don Bosco',
        displayName: 'SGC Ciudad Don Bosco',
        logoUrl: '',
        nit: '890.900.222-1',
        type: 'FORMAL',
        sieeScale: defaultSiee
      });
    }

    if (!inst.sieeScale) {
      (inst as any).sieeScale = defaultSiee;
    }

    return NextResponse.json(inst);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { authenticated, authorized } = await validateRole(['ADMIN']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const inst = await prisma.institution.findFirst();

    if (inst) {
      const updated = await prisma.institution.update({
        where: { id: inst.id },
        data: {
          name: body.name,
          displayName: body.displayName,
          logoUrl: body.logoUrl,
          nit: body.nit,
          type: body.type,
          sieeScale: body.sieeScale
        }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.institution.create({
        data: {
          name: body.name,
          displayName: body.displayName,
          logoUrl: body.logoUrl,
          nit: body.nit,
          type: body.type,
          sieeScale: body.sieeScale
        }
      });
      return NextResponse.json(created);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
