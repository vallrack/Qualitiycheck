import { auth } from './src/lib/firebase-admin';

async function verify() {
  console.log('--- Verificando Inicialización Real ---');
  try {
    const list = await auth.listUsers(1);
    console.log('CONEXIÓN EXITOSA. Usuarios en sistema:', list.users.length);
    process.exit(0);
  } catch (error: any) {
    console.error('ERROR REAL:', error.message);
    process.exit(1);
  }
}

verify();
