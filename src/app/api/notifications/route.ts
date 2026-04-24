import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateRole } from '@/lib/user-auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const notifSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.string().default('INFO'),
  link: z.string().optional()
});

export async function GET(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated || !authorized || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause: any = { userId: user.uid };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Notifications API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // System or Admin can create notifications
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = notifSchema.parse(body);

    const notif = await prisma.notification.create({
      data: validated
    });

    return NextResponse.json(notif);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const { authenticated, authorized, user } = await validateRole(['ADMIN', 'COORDINADOR', 'DOCENTE']);
  if (!authenticated || !authorized || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    if (body.action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: { userId: user.uid, isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      const notif = await prisma.notification.update({
        where: { id: body.id, userId: user.uid },
        data: { isRead: true }
      });
      return NextResponse.json(notif);
    }

    return NextResponse.json({ error: 'Missing action or id' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
