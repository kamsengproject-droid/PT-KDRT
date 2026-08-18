import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { existsSync } from 'fs';
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

  const sharingTxs = transactions.filter(t => t.scope === 'SHARING');
  const activeTxs = sharingTxs.filter(t => (t.status || 'ACTIVE') === 'ACTIVE');
  
  let totalIncome = 0;
  let totalExpense = 0;
  let openingBalance = 0;

  for (const tx of activeTxs) {
      if (tx.sourceType === 'OPENING_BALANCE') {
        openingBalance += Number(tx.amount) || 0;
      } else if (tx.type === 'INCOME') {
        totalIncome += Number(tx.amount) || 0;
      } else if (tx.type === 'EXPENSE') {
        totalExpense += Number(tx.amount) || 0;
      }
  }

  const systemBalance = openingBalance + totalIncome - totalExpense;

  // Find duplicates
  const keyMap = {};
  const duplicates = [];
  let potentialDuplicateValue = 0;
  
  for (const tx of activeTxs) {
      if (tx.category === 'COMMISSION_REAL' || tx.sourceType === 'TIKTOK_COMMISSION' || tx.category === 'KOMISI TIKTOK') {
        const key = `${tx.date}_${tx.amount}_${tx.accountId || tx.accountName || ''}`;
        if (!keyMap[key]) {
          keyMap[key] = [];
        }
        keyMap[key].push(tx);
      }
  }

  for (const [key, txs] of Object.entries(keyMap)) {
      if (txs.length > 1) {
        let isFirst = true;
        for (const tx of txs) {
          if (!isFirst) {
            potentialDuplicateValue += Number(tx.amount) || 0;
          }
          duplicates.push({
            transactionId: tx.id,
            sourceType: tx.sourceType || tx.category,
            referenceId: tx.referenceId || 'N/A',
            performanceId: tx.performanceId || 'N/A',
            isOrphan: tx.performanceId ? !perfIds.has(tx.performanceId) : false,
            tanggal: tx.date,
            nominal: tx.amount,
            status: tx.status || 'ACTIVE'
          });
          isFirst = false;
        }
      }
  }

  // Also look for orphans
  const orphans = activeTxs.filter(tx => tx.performanceId && !perfIds.has(tx.performanceId));

  console.log(JSON.stringify({
      TOTAL_ACTIVE_INCOME: totalIncome,
      TOTAL_ACTIVE_EXPENSE: totalExpense,
      OPENING_BALANCE: openingBalance,
      SYSTEM_BALANCE: systemBalance,
      POTENTIAL_DUPLICATE_VALUE: potentialDuplicateValue,
      DUPLICATES: duplicates,
      ORPHANS: orphans.map(tx => ({
        transactionId: tx.id,
        tanggal: tx.date,
        nominal: tx.amount,
        performanceId: tx.performanceId
      }))
  }, null, 2));

  process.exit(0);
}
runAudit();
