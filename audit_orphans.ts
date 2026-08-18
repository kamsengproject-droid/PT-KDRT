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
  
  const perfSnapshot = await getDocs(collection(db, 'dailyPerformance'));
  const performances = perfSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
  const perfIds = new Set(performances.map(p => p.id));

  const sharingTxs = transactions.filter(t => t.scope === 'SHARING' && t.status !== 'VOID' && (!t.status || t.status === 'ACTIVE'));
  
  const orphans = sharingTxs.filter(tx => tx.performanceId && !perfIds.has(tx.performanceId));
  
  console.log("Orphaned Transactions:");
  let orphanTotal = 0;
  for(const tx of orphans) {
     console.log(`- ${tx.id} | ${tx.date} | ${tx.amount} | Perf: ${tx.performanceId} | Desc: ${tx.description}`);
     orphanTotal += Number(tx.amount) || 0;
  }
  console.log("Total Orphan Value:", orphanTotal);
  process.exit(0);
}
runAudit();
