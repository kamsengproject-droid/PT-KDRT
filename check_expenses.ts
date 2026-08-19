import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
const db = getFirestore(app);

async function run() {
  const txSnapshot = await getDocs(collection(db, 'transactions'));
  const transactions = txSnapshot.docs.map(d => d.data() as any);
  
  const sharingExp = transactions.filter(t => t.scope === 'SHARING' && t.type === 'EXPENSE');
  console.log(`Sharing Expenses: ${sharingExp.length}`);
  process.exit(0);
}
run();
