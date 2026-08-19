import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { existsSync } from 'fs';
import * as dotenv from 'dotenv';

if (existsSync('.env')) dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
      await signInWithEmailAndPassword(auth, 'ferrymerry@kdrt.com', 'password123'); // guessing password
      console.log('Logged in as', auth.currentUser.uid);
      
      const q = query(
          collection(db, 'transactions'),
          where('scope', '==', 'SHARING')
      );
      
      const snap = await getDocs(q);
      console.log('Docs fetched:', snap.docs.length);
      
      const q2 = query(
          collection(db, 'transactions'),
          where('scope', '==', 'SHARING'),
          where('status', '==', 'ACTIVE')
      );
      const snap2 = await getDocs(q2);
      console.log('Docs with ACTIVE:', snap2.docs.length);

      process.exit(0);
  } catch (err) {
      console.error(err);
      process.exit(1);
  }
}
run();
