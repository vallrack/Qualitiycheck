import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';
import { logAction } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// GET: Obtain the central institutional configuration
export async function GET() {
  try {
    let institution = await prisma.institution.findFirst();

    // If it doesn't exist, create a default one
    if (!institution) {
      institution = await prisma.institution.create({
        data: {
          name: 'Institución Predeterminada',
          nit: '000000000-0',
          type: 'FORMAL', // Default to formal
        }
      });
    }

    return NextResponse.json(institution);
  } catch (error: any) {
    console.error('Institution API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update institutional configuration (Only ADMIN)
export async function PATCH(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, nit, type } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updated = await prisma.institution.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nit && { nit }),
        ...(type && { type }),
      }
    });

    await logAction({
      userId: user?.uid || 'SYSTEM',
      action: 'UPDATE_INSTITUTION',
      resource: `Institution:${id}`,
      priority: 'high',
      payload: { name, type },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Institution API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
