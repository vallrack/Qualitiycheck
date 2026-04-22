import admin from 'firebase-admin';

// Unified helper to get or initialize the admin app
function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  // EXTREME SANITIZATION OF PRIVATE KEY
  let rawKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
  
  // 1. Strip wrapping quotes
  if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
    rawKey = rawKey.slice(1, -1);
  }
  
  // 2. Initial replacement of escaped newlines
  let privateKey = rawKey.replace(/\\n/g, '\n').replace(/\r/g, '').trim();

  // 3. Robust PEM reconstruction to satisfy the ASN.1/DER parser
  if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    const parts = privateKey.split('-----');
    // Schema: ["", "BEGIN PRIVATE KEY", "BODY", "END PRIVATE KEY", ""]
    if (parts.length >= 5) {
      const header = '-----BEGIN PRIVATE KEY-----';
      const footer = '-----END PRIVATE KEY-----';
      // Strip all whitespace from the body
      const cleanBody = parts[2].replace(/\s+/g, '');
      // Wrap body at 64 characters (Standard PEM formatting)
      const wrappedBody = cleanBody.match(/.{1,64}/g)?.join('\n') || cleanBody;
      privateKey = `${header}\n${wrappedBody}\n${footer}\n`;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // Check if we are in the build phase (Next.js build)
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !projectId;

  if (!projectId || !clientEmail || !privateKey) {
    if (isBuildPhase) {
      console.warn('[Firebase Admin] Skipping initialization during build phase due to missing environment variables.');
      return null;
    }
    
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    
    throw new Error(`[Firebase Admin] Missing required environment variables: ${missing.join(', ')}. Please check your server/Vercel configuration.`);
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    if (isBuildPhase) {
      console.warn('[Firebase Admin] Initialization failed during build, but continuing...');
      return null;
    }
    console.error('[Firebase Admin] Initialization failed with credential object:', error);
    throw error;
  }
}

const app = getAdminApp();

export const db = app ? admin.firestore(app) : null as any;
export const auth = app ? admin.auth(app) : {
  verifyIdToken: () => { throw new Error('Firebase Admin not initialized. Check environment variables.'); }
} as any;
export default admin;
