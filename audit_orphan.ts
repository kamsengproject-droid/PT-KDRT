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

async function runAudit() {
  try {
      const perfSnap = await getDocs(collection(db, 'dailyPerformance'));
      const performances = perfSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

      const txSnap = await getDocs(collection(db, 'transactions'));
      const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

      const targetDate = '2026-08-18';
      const targetAccountId = 'XzInVZv3DZfIJoQqSF7m'; // NISAGROSIR88
      const targetAccountName = 'NISAGROSIR88';

      const perfs = performances.filter(p => 
        p.date === targetDate && 
        (p.accountId === targetAccountId || p.accountName === targetAccountName)
      );
      
      const txs = transactions.filter(t => 
        t.date === targetDate && 
        t.scope === 'SHARING' && 
        (t.accountId === targetAccountId || t.accountName === targetAccountName) &&
        (t.category === 'COMMISSION_REAL' || t.sourceType === 'TIKTOK_COMMISSION' || t.category === 'KOMISI TIKTOK')
      );

      console.log(JSON.stringify({ PERFORMANCES: perfs, TRANSACTIONS: txs }, null, 2));
      process.exit(0);
  } catch (err) {
      console.error(err);
      process.exit(1);
  }
}
runAudit();
