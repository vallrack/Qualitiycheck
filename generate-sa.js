const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function createServiceAccount() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const pkMatch = env.match(/FIREBASE_PRIVATE_KEY="(.*)"/);
  
  if (!pkMatch) {
    console.error('PK NOT FOUND');
    return;
  }

  // The key in .env.local has literal \n characters. 
  // We need them to be actual newlines in the JSON file.
  const privateKey = pkMatch[1].replace(/\\n/g, '\n');

  const sa = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "qualitycheck-51ff3",
    private_key_id: "unknown",
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@qualitycheck-51ff3.iam.gserviceaccount.com",
    client_id: "unknown",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40qualitycheck-51ff3.iam.gserviceaccount.com"
  };

  fs.writeFileSync('service-account.json', JSON.stringify(sa, null, 2));
  console.log('SUCCESS: Generated service-account.json');
}

createServiceAccount();
