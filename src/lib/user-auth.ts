import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export type UserRole = 'ADMIN' | 'COORDINADOR' | 'DOCENTE';

export async function getServerSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    console.warn('[getServerSession] No session token found in cookies.');
    return null;
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(sessionToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0],
      role: (decodedToken.role as UserRole) || (decodedToken.admin ? 'ADMIN' : 'DOCENTE'),
    };
  } catch (error: any) {
    console.error('[getServerSession] Token verification failed:', error.message);
    return null;
  }
}

export async function validateRole(requiredRoles: UserRole[]) {
  const session = await getServerSession();
  if (!session) return { authenticated: false, authorized: false };
  
  const isAuthorized = requiredRoles.includes(session.role);
  return { authenticated: true, authorized: isAuthorized, user: session };
}
