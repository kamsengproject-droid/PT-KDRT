import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import * as dotenv from 'dotenv';

if (existsSync('.env')) {
  dotenv.config();
}

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

async function runAudit() {
  const t1 = await getDoc(doc(db, 'transactions', 'cRlk6ILzo9FoNjEMEcFT'));
  console.log("Tx cRlk6ILzo9FoNjEMEcFT:", t1.data());
  process.exit(0);
}
runAudit();
