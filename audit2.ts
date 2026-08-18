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
    const sharingPerf = performances.filter(p => p.scope === 'SHARING');
    
    const perfKeyMap = {};
    const perfDuplicates = [];

    for (const p of sharingPerf) {
      const key = `${p.date}_${p.accountId}`;
      if (!perfKeyMap[key]) {
        perfKeyMap[key] = [];
      }
      perfKeyMap[key].push(p);
    }

    let potentialDuplicateValue = 0;
    const txDuplicates = [];

    for (const [key, perfs] of Object.entries(perfKeyMap)) {
      if (perfs.length > 1) {
        perfDuplicates.push(key);
        // Find matching transactions for these duplicate performance records
        for (let i = 1; i < perfs.length; i++) {
           const dupPerf = perfs[i];
           const matchingTx = sharingTxs.find(tx => tx.performanceId === dupPerf.id);
           if (matchingTx) {
             potentialDuplicateValue += Number(matchingTx.amount) || 0;
             txDuplicates.push({
               transactionId: matchingTx.id,
               sourceType: matchingTx.sourceType || matchingTx.category,
               referenceId: matchingTx.referenceId || 'N/A',
               performanceId: matchingTx.performanceId,
               tanggal: matchingTx.date,
               nominal: matchingTx.amount,
               status: matchingTx.status || 'ACTIVE'
             });
           }
        }
        const originalPerf = perfs[0];
        const originalTx = sharingTxs.find(tx => tx.performanceId === originalPerf.id);
        if (originalTx) {
             txDuplicates.push({
               transactionId: originalTx.id,
               sourceType: originalTx.sourceType || originalTx.category,
               referenceId: originalTx.referenceId || 'N/A',
               performanceId: originalTx.performanceId,
               tanggal: originalTx.date,
               nominal: originalTx.amount,
               status: originalTx.status || 'ACTIVE',
               isOriginal: true
             });
        }
      }
    }

    console.log(JSON.stringify({
      POTENTIAL_DUPLICATE_VALUE: potentialDuplicateValue,
      DUPLICATES: txDuplicates,
      PERF_DUPLICATES_KEYS: perfDuplicates
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runAudit();
