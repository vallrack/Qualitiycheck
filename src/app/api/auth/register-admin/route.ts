import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    // 1. Check if any users exist to self-deactivate
    const listUsers = await auth.listUsers(1);
    if (listUsers.users.length > 0) {
      return NextResponse.json(
        { error: 'El registro inicial ya ha sido completado y esta ruta está desactivada por seguridad.' },
        { status: 403 }
      );
    }

    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    // 2. Create the first admin user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name || 'Admin SGC',
    });

    // 3. Set custom claim to identify as admin
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });

    return NextResponse.json({ 
      success: true, 
      message: 'Primer administrador creado exitosamente. Esta ruta ahora está bloqueada.',
      user: userRecord.email
    });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
