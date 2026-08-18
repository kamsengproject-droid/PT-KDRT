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
  try {
    const txSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = txSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    
    const perfSnapshot = await getDocs(collection(db, 'dailyPerformance'));
    const performances = perfSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const sharingTxs = transactions.filter(t => t.scope === 'SHARING' && t.status !== 'VOID' && (!t.status || t.status === 'ACTIVE'));
    
    let totalIncome = 0;
    let totalExpense = 0;
    let openingBalance = 0;

    const duplicates = [];
    const perfMap = {}; // performanceId -> transactions array
    
    for (const tx of sharingTxs) {
      if (tx.sourceType === 'OPENING_BALANCE') {
        openingBalance += Number(tx.amount) || 0;
      } else if (tx.type === 'INCOME') {
        totalIncome += Number(tx.amount) || 0;
      } else if (tx.type === 'EXPENSE') {
        totalExpense += Number(tx.amount) || 0;
      }

      // map by performanceId
      if (tx.performanceId) {
        if (!perfMap[tx.performanceId]) perfMap[tx.performanceId] = [];
        perfMap[tx.performanceId].push(tx);
      } else if (tx.category === 'COMMISSION_REAL' || tx.sourceType === 'TIKTOK_COMMISSION') {
          // Some might have referenceId instead of performanceId
          const ref = tx.referenceId || tx.performanceId || 'unknown';
          if (!perfMap[ref]) perfMap[ref] = [];
          perfMap[ref].push(tx);
      }
    }

    let potentialDuplicateValue = 0;

    for (const [perfId, txs] of Object.entries(perfMap)) {
      if (txs.length > 1) {
        // We found duplicates!
        for (let i = 1; i < txs.length; i++) {
          potentialDuplicateValue += Number(txs[i].amount) || 0;
          duplicates.push({
            transactionId: txs[i].id,
            sourceType: txs[i].sourceType || txs[i].category,
            referenceId: txs[i].referenceId || 'N/A',
            performanceId: txs[i].performanceId || perfId,
            tanggal: txs[i].date,
            nominal: txs[i].amount,
            status: txs[i].status || 'ACTIVE'
          });
        }
        // Push the original too for reference in log
        duplicates.push({
            transactionId: txs[0].id,
            sourceType: txs[0].sourceType || txs[0].category,
            referenceId: txs[0].referenceId || 'N/A',
            performanceId: txs[0].performanceId || perfId,
            tanggal: txs[0].date,
            nominal: txs[0].amount,
            status: txs[0].status || 'ACTIVE',
            isOriginal: true
        });
      }
    }

    // Check specific transaction 8 Aug 2026 NisaGrosir88
    const susTxs = sharingTxs.filter(t => t.date === '2026-08-08' && t.amount === 1004400);

    const systemBalance = openingBalance + totalIncome - totalExpense;

    console.log(JSON.stringify({
      TOTAL_ACTIVE_INCOME: totalIncome,
      TOTAL_ACTIVE_EXPENSE: totalExpense,
      OPENING_BALANCE: openingBalance,
      SYSTEM_BALANCE: systemBalance,
      POTENTIAL_DUPLICATE_VALUE: potentialDuplicateValue,
      DUPLICATES: duplicates,
      SUS_TXS: susTxs
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runAudit();
