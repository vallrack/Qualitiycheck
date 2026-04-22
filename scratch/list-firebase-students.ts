import admin from 'firebase-admin';
import { db as firestore } from '../src/lib/firebase-admin';

async function main() {
  const snapshot = await firestore.collection('students').get();
  const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(JSON.stringify(students, null, 2));
}

main();
