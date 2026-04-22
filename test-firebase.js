const admin = require('firebase-admin');

// Extremadamente robusto para cargar las credenciales
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.startsWith('"')) privateKey = privateKey.slice(1, -1);
privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
     const parts = privateKey.split('-----');
     if (parts.length >= 5) {
       const cleanBody = parts[2].replace(/\s+/g, '');
       const wrappedBody = cleanBody.match(/.{1,64}/g)?.join('\n') || cleanBody;
       privateKey = `-----BEGIN PRIVATE KEY-----\n${wrappedBody}\n-----END PRIVATE KEY-----\n`;
     }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
}

const firestore = admin.firestore();

async function testWrite() {
  try {
    console.log("Writing to students collection...");
    await firestore.collection('students').doc('TEST-123').set({
      name: 'Test Student',
      grade: '10',
      system: 'Antigravity Test Write'
    });
    console.log("SUCCESS Firebase Write!");
  } catch (error) {
    console.error("FIREBASE ERROR:", error);
  }
}

testWrite();
