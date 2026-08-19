import { initializeApp } from 'firebase/app';
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
const db = getFirestore(app);

async function run() {
  const q = query(
    collection(db, 'transactions'),
    where('scope', '==', 'SHARING')
  );
  
  const snap = await getDocs(q);
  console.log(`Docs fetched: ${snap.docs.length}`);
  
  let totalIncome = 0;
  let totalExpense = 0;
  const periodPrefix = '2026-08';
  
  snap.forEach(docSnap => {
    const data = docSnap.data();
    if ((data.status || 'ACTIVE') !== 'ACTIVE') return;
    
    if (data.date && data.date.startsWith(periodPrefix)) {
      if (data.type === 'INCOME') totalIncome += Number(data.amount) || 0;
      else if (data.type === 'EXPENSE') totalExpense += Number(data.amount) || 0;
    }
  });
  
  console.log(`Income: ${totalIncome}, Expense: ${totalExpense}`);
  process.exit(0);
}
run();
