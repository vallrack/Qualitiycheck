import { auth } from './src/lib/firebase-admin';

async function main() {
  const email = 'vallrack67@gmail.com';
  const password = 'Agnusde9-.';
  const name = 'Admin Principal';

  try {
    console.log(`Intentando crear usuario admin: ${email}...`);
    
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log('El usuario ya existe con UID:', existingUser.uid);
    } catch (e) {
      // Create user if not exists
      const user = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      console.log('Usuario creado exitosamente con UID:', user.uid);
      
      // Set admin claims
      await auth.setCustomUserClaims(user.uid, { admin: true });
      console.log('Permisos de administrador concedidos.');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error fatal:', error.message);
    process.exit(1);
  }
}

main();
