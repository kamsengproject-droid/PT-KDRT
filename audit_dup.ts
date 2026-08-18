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
  
  const sharingTxs = transactions.filter(t => t.scope === 'SHARING' && t.status !== 'VOID' && (!t.status || t.status === 'ACTIVE'));
  
  const byDateAmount = {};
  for(const tx of sharingTxs) {
      if(tx.type !== 'INCOME') continue;
      const key = `${tx.date}_${tx.amount}`;
      if(!byDateAmount[key]) byDateAmount[key] = [];
      byDateAmount[key].push(tx);
  }
  
  const dups = [];
  let dupValue = 0;
  for(const [k, txs] of Object.entries(byDateAmount)) {
      if(txs.length > 1) {
          dups.push(txs);
          dupValue += Number(txs[0].amount) * (txs.length - 1);
      }
  }
  
  console.log("Found grouped duplicates by date and amount:", JSON.stringify(dups, null, 2));
  console.log("Total duplicate value:", dupValue);
  process.exit(0);
}
runAudit();
