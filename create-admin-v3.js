const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function createAdmin() {
  const email = 'vallrack67@gmail.com';
  const password = 'Agnusde9-.';
  const name = 'Admin Principal';

  // Read .env.local manually to avoid any environment variable parsing issues
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const getVal = (key) => {
    const match = envContent.match(new RegExp(`${key}="(.*)"`));
    return match ? match[1] : null;
  };

  const projectId = getVal('FIREBASE_PROJECT_ID');
  const clientEmail = getVal('FIREBASE_CLIENT_EMAIL');
  let privateKey = getVal('FIREBASE_PRIVATE_KEY');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Credentials not found in .env.local');
    process.exit(1);
  }

  // CRITICAL: Ensure the private key is formatted correctly for Node.js
  // 1. Unescape \n
  privateKey = privateKey.replace(/\\n/g, '\n');
  // 2. Remove any accidental double quotes
  privateKey = privateKey.replace(/"/g, '');

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (e) {
      console.error('Initialization error:', e);
      process.exit(1);
    }
  }

  const auth = admin.auth();

  try {
    console.log(`Checking if user ${email} exists...`);
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('User already exists:', user.uid);
    } catch (e) {
      console.log('Creating new user...');
      user = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      console.log('Successfully created user:', user.uid);
    }
    
    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log('Admin claims set/updated.');
    process.exit(0);
  } catch (error) {
    console.error('Error during user operation:', error.message);
    process.exit(1);
  }
}

createAdmin();
