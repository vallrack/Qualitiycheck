const admin = require('firebase-admin');
const fs = require('fs');

async function test() {
  console.log('--- Testing Firebase Admin with service-account.json ---');
  
  if (!fs.existsSync('service-account.json')) {
    console.error('File NOT FOUND');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('SUCCESS: Firebase Admin Initialized.');
    const users = await admin.auth().listUsers(1);
    console.log('Current users:', users.users.length);
    
  } catch (error) {
    console.error('FAILURE:', error.message);
  }
  process.exit(0);
}

test();
