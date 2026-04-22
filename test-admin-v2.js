const admin = require('firebase-admin');
const fs = require('fs');

async function test() {
  console.log('--- Testing Firebase Admin Initialization (Ultra-Robust) ---');
  
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const pkMatch = env.match(/FIREBASE_PRIVATE_KEY="(.*)"/);
    if (!pkMatch) throw new Error('PK not found');
    
    let rawKey = pkMatch[1];
    let privateKey = rawKey.replace(/\\n/g, '\n').replace(/\r/g, '').trim();

    // Aggressive reconstruction logic
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      const parts = privateKey.split('-----');
      if (parts.length >= 5) {
        const body = parts[2].replace(/\s+/g, '');
        const wrappedBody = body.match(/.{1,64}/g)?.join('\n') || body;
        privateKey = `-----BEGIN PRIVATE KEY-----\n${wrappedBody}\n-----END PRIVATE KEY-----`;
      }
    }

    console.log('PK Reconstructed length:', privateKey.length);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "qualitycheck-51ff3",
        clientEmail: "firebase-adminsdk-fbsvc@qualitycheck-51ff3.iam.gserviceaccount.com",
        privateKey: privateKey,
      }),
    });

    console.log('SUCCESS: Firebase Admin Initialized.');
    const users = await admin.auth().listUsers(1);
    console.log('Current users in system:', users.users.length);
    
  } catch (error) {
    console.error('FAILURE:', error.message);
  }
  process.exit(0);
}

test();
