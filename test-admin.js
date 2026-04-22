const admin = require('firebase-admin');
const fs = require('fs');

async function test() {
  console.log('--- Testing Firebase Admin Initialization ---');
  
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const pkMatch = env.match(/FIREBASE_PRIVATE_KEY="(.*)"/);
    const projectIdMatch = env.match(/FIREBASE_PROJECT_ID="(.*)"/);
    const clientEmailMatch = env.match(/FIREBASE_CLIENT_EMAIL="(.*)"/);
    
    if (!pkMatch) throw new Error('PK not found in .env.local');
    
    let privateKey = pkMatch[1].replace(/\\n/g, '\n').replace(/\r/g, '').trim();
    const projectId = projectIdMatch[1];
    const clientEmail = clientEmailMatch[1];

    console.log('Project ID:', projectId);
    console.log('Client Email:', clientEmail);
    console.log('PK Start:', privateKey.substring(0, 30));

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log('SUCCESS: Firebase Admin Initialized.');
    
    const users = await admin.auth().listUsers(1);
    console.log('Users found:', users.users.length);
    
  } catch (error) {
    console.error('FAILURE:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

test();
