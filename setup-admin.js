const admin = require('firebase-admin');

async function setup() {
  const email = 'vallrack67@gmail.com';
  const password = 'Agnusde9-.';

  try {
    // Check if variables are loaded
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Variables de entorno no cargadas. Asegúrate de usar --env-file=.env.local');
    }

    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    console.log('--- Iniciando creación de administrador ---');
    
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log('El usuario ya existe:', user.uid);
    } catch (e) {
      user = await admin.auth().createUser({
        email,
        password,
        displayName: 'Administrador Principal',
      });
      console.log('Usuario creado exitosamente:', user.uid);
    }

    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('Permisos de administrador (Custom Claims) asignados correctamente.');
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR FATAL:', error.message);
    process.exit(1);
  }
}

setup();
