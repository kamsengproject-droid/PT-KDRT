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
  const perfSnapshot = await getDocs(collection(db, 'dailyPerformance'));
  const performances = perfSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

  const susPerf = performances.filter(p => p.date === '2026-08-08' && p.accountId === 'XzInVZv3DZfIJoQqSF7m');
  
  console.log("Found perfs:", JSON.stringify(susPerf, null, 2));
  
  const allDuplicateKeys = [];
  const keyMap = {};
  for(const p of performances) {
     if(p.scope !== 'SHARING') continue;
     const key = `${p.date}_${p.accountId}`;
     if(!keyMap[key]) keyMap[key] = [];
     keyMap[key].push(p);
     if(keyMap[key].length === 2) {
         allDuplicateKeys.push(key);
     }
  }
  
  console.log("All duplicate keys:", allDuplicateKeys);
  process.exit(0);
}
runAudit();
