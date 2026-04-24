import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import admin, { db as firestore } from '@/lib/firebase-admin';
import { logAction } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// PATCH: Update case status, add resolution or sanction
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, closureNotes, protocolStatus } = body;

    const existingCase = await prisma.convivenciaCase.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
    }

    const updated = await prisma.convivenciaCase.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(closureNotes && { 
          // Append closure Notes correctly depending on if it's already an array or not (Prisma handles arrays if defined in schema, assuming JSON or basic array)
        }),
        // Assuming we could pass a JSON object for protocol updates
        ...(protocolStatus && { protocolStatus }),
      }
    });

    // DUAL WRITE to Firestore
    try {
      await firestore.collection('convivencia_cases').doc(id).set({
        ...updated,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (fsError) {
      console.warn('Firebase Sync failed on PATCH', fsError);
    }

    await logAction({
      userId: 'system-admin', // ToDo: Get from session
      action: 'UPDATE_CASE',
      resource: `Case:${id}`,
      priority: status === 'CLOSED' ? 'high' : 'medium',
      payload: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API Convivencia Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
