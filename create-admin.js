const admin = require('firebase-admin');

async function createAdmin() {
  const email = 'vallrack67@gmail.com';
  const password = 'Agnusde9-.';
  const name = 'Admin Principal';

  // Read credentials from .env.local
  const fs = require('fs');
  const path = require('path');
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  
  const getVal = (key) => {
    const match = envContent.match(new RegExp(`${key}="(.*)"`));
    return match ? match[1] : null;
  };

  const projectId = getVal('FIREBASE_PROJECT_ID');
  const clientEmail = getVal('FIREBASE_CLIENT_EMAIL');
  let privateKey = getVal('FIREBASE_PRIVATE_KEY');

  if (!privateKey) {
    console.error('No private key found');
    process.exit(1);
  }

  // Final fix for PEM parsing
  privateKey = privateKey.replace(/\\n/g, '\n').trim();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('SUCCESS: Admin created:', user.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log('SUCCESS: Admin claims updated for existing user.');
    } else {
      console.error('ERROR:', error.message);
    }
  }
  process.exit(0);
}

createAdmin();
