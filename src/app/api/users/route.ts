import { NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/user-auth';
import { logAction } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// GET: List institutional users
export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      include: { _count: { select: { subjects: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create institutional user (Firebase + Prisma)
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Create in Firebase
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set Custom Claims (Role)
    const claims = { role };
    if (role === 'ADMIN') (claims as any).admin = true;
    await adminAuth.setCustomUserClaims(userRecord.uid, claims);

    // 3. Create in Prisma
    const user = await prisma.user.create({
      data: {
        id: userRecord.uid,
        email,
        name,
        role,
      },
    });

    await logAction({
      userId: session.uid,
      action: 'CREATE_USER',
      resource: `User:${user.id}`,
      priority: 'high',
      payload: { email, role },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Create User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE: Deactivate/Remove user
export async function DELETE(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    if (id === session.uid) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    // 1. Delete from Firebase
    await adminAuth.deleteUser(id);

    // 2. Delete from Prisma
    await prisma.user.delete({ where: { id } });

    await logAction({
      userId: session.uid,
      action: 'DELETE_USER',
      resource: `User:${id}`,
      priority: 'critical',
      payload: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
