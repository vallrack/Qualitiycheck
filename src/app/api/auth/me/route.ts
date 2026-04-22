import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/user-auth';
import { auth as adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // 1. Try to find user in Prisma
    let user = await prisma.user.findUnique({
      where: { id: session.uid },
    });

    // 2. Auto-Sync: If user exists in Firebase but not in Prisma, create the record.
    // This handles the initial admin and legacy accounts.
    if (!user) {
      console.log(`[Auto-Sync] Creating Prisma record for user: ${session.email}`);
      const userRecord = await adminAuth.getUser(session.uid);
      
      user = await prisma.user.create({
        data: {
          id: session.uid,
          email: session.email || userRecord.email || '',
          name: session.name || userRecord.displayName || 'Usuario SGC',
          role: session.role, // This comes from decodedToken.role or decodedToken.admin
        },
      });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('[API/Auth/Me] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
