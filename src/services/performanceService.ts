import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DailyPerformance, ScopeType } from '../types';
import { catatAuditLog } from './auditService';
import { TRANSACTIONS_COLLECTION } from './transactionService';

export function subscribeDailyPerformance(
  scope?: ScopeType,
  callback?: (list: DailyPerformance[]) => void
) {
  const colRef = collection(db, 'dailyPerformance');
  const q = scope
    ? query(colRef, where('scope', '==', scope))
    : colRef;

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DailyPerformance[];
      // Sort by date desc
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (callback) callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'dailyPerformance');
    }
  );
}

// Deterministic ID generator
export function getPerformanceDocId(accountId: string, date: string): string {
  // PERFORMANCE_ACCOUNTID_YYYY-MM-DD
  return `PERFORMANCE_${accountId}_${date}`;
}

export function getTransactionDocId(performanceId: string): string {
  // COMMISSION_REAL_{performanceId}
  return `COMMISSION_REAL_${performanceId}`;
}

// 1. Check duplicate
export async function checkDuplicatePerformance(accountId: string, date: string): Promise<boolean> {
  const docId = getPerformanceDocId(accountId, date);
  const docRef = doc(db, 'dailyPerformance', docId);
  const snap = await getDoc(docRef);
  return snap.exists();
}

// 2. Save (Atomic create/update for both performance and transaction)
export async function saveKomisiReal(
  entry: Omit<DailyPerformance, 'id' | 'createdAt' | 'updatedAt' | 'commissionReal'> & { commissionReal?: number, realCommission?: number },
  currentUserId: string,
  currentUserName: string
) {
  try {
    const batch = writeBatch(db);
    
    if (!entry.accountId || !entry.date) {
      throw new Error('AccountId dan Date wajib diisi.');
    }

    const perfId = getPerformanceDocId(entry.accountId, entry.date);
    const txId = getTransactionDocId(perfId);

    const perfRef = doc(db, 'dailyPerformance', perfId);
    const txRef = doc(db, TRANSACTIONS_COLLECTION, txId);

    const commissionValue = Number(entry.commissionReal) || Number(entry.realCommission) || 0;

    const perfData = {
      ...entry,
      gmv: Number(entry.gmv) || 0,
      estimatedCommission: Number(entry.estimatedCommission) || 0,
      commissionReal: commissionValue,
      realCommission: commissionValue, // Legacy fallback
      updatedBy: currentUserId,
      updatedAt: serverTimestamp(),
    };

    // Use setDoc with merge for both
    batch.set(perfRef, {
      ...perfData,
      createdBy: currentUserId,
      createdAt: serverTimestamp(), // will be ignored by firestore if updating with set, wait, set without merge overwrites it. We'll use set with merge: true, but createdAt needs to be preserved.
    }, { merge: true });

    if (commissionValue > 0) {
      batch.set(txRef, {
        type: 'INCOME',
        scope: entry.scope,
        amount: commissionValue,
        date: entry.date,
        category: 'KOMISI TIKTOK',
        sourceType: 'COMMISSION_REAL',
        accountName: entry.accountName,
        accountId: entry.accountId,
        description: `Komisi Real ${entry.accountName || 'Akun'} (${entry.date})`,
        performanceId: perfId,
        status: 'ACTIVE',
        updatedBy: currentUserId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // If it's newly created we want createdAt. But merge handles it mostly ok, or we can just update it.
    } else {
      // If commission is 0, we might want to delete the transaction if it exists
      batch.delete(txRef);
    }

    await batch.commit();

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'INPUT_KOMISI_REAL',
      entry.accountName || entry.accountId,
      `Tanggal: ${entry.date}, GMV: Rp ${Number(entry.gmv).toLocaleString('id-ID')}, Komisi Real: Rp ${commissionValue.toLocaleString('id-ID')}`
    );

    return perfId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'dailyPerformance');
    throw error;
  }
}

export async function deleteKomisiRealAtomic(
  performanceId: string,
  desc: string,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const batch = writeBatch(db);
    const perfRef = doc(db, 'dailyPerformance', performanceId);
    const txId = getTransactionDocId(performanceId);
    const txRef = doc(db, TRANSACTIONS_COLLECTION, txId);
    
    // Fallback: Delete both the deterministic tx and any transactions matching this performanceId 
    // just in case they were created before deterministic IDs.
    const q = query(collection(db, TRANSACTIONS_COLLECTION), where('performanceId', '==', performanceId));
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
      batch.delete(d.ref);
    });

    batch.delete(perfRef);
    batch.delete(txRef);

    await batch.commit();

    await catatAuditLog(
      currentUserId, 
      currentUserName, 
      'DELETE_KOMISI_REAL', 
      performanceId, 
      `Dihapus beserta transaksinya. Alasan: ${desc}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `dailyPerformance/${performanceId}`);
    throw error;
  }
}

// Fallback legacy method
export async function hapusPerformaHarian(
  id: string,
  desc: string,
  currentUserId: string,
  currentUserName: string
) {
  return deleteKomisiRealAtomic(id, desc, currentUserId, currentUserName);
}
