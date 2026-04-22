const admin = require('firebase-admin');

async function createAdmin() {
  const email = 'vallrack67@gmail.com';
  const password = 'Agnusde9-.';
  const name = 'Admin Principal';

  // Extract values from environment variables
  // We'll read the file directly to be 100% sure about the string content
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const projectIdMatch = envContent.match(/FIREBASE_PROJECT_ID="(.+)"/);
  const clientEmailMatch = envContent.match(/FIREBASE_CLIENT_EMAIL="(.+)"/);
  const privateKeyMatch = envContent.match(/FIREBASE_PRIVATE_KEY="(.+)"/);

  if (!projectIdMatch || !clientEmailMatch || !privateKeyMatch) {
    console.error('Could not find credentials in .env.local');
    process.exit(1);
  }

  const projectId = projectIdMatch[1];
  const clientEmail = clientEmailMatch[1];
  // Handle the literal \n strings in the .env file
  const privateKey = privateKeyMatch[1].replace(/\\n/g, '\n');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const auth = admin.auth();

  try {
    console.log(`Checking if user ${email} exists...`);
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log('User already exists:', existingUser.uid);
      await auth.setCustomUserClaims(existingUser.uid, { admin: true });
      console.log('Admin claims updated for existing user.');
    } catch (e) {
      console.log('Creating new user...');
      const user = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      console.log('Successfully created user:', user.uid);
      
      await auth.setCustomUserClaims(user.uid, { admin: true });
      console.log('Admin claims set.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
