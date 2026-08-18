import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
  const txSnapshot = await getDocs(collection(db, 'transactions'));
  const transactions = txSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
  
  const voidedTxs = transactions.filter(t => t.status === 'VOID');
  
  let voidTotal = 0;
  for(const tx of voidedTxs) {
     console.log(`- ${tx.id} | ${tx.date} | ${tx.amount} | Reason: ${tx.voidReason}`);
     voidTotal += Number(tx.amount) || 0;
  }
  
  console.log("Total voided value:", voidTotal);
  process.exit(0);
}
runAudit();
