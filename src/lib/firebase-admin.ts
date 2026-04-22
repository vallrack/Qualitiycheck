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

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
    throw error;
  }
}

const app = getAdminApp()!;

export const db = admin.firestore(app);
export const auth = admin.auth(app);
export default admin;
