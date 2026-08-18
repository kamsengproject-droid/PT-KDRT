import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DailyPerformance, ScopeType } from '../types';
import { catatAuditLog } from './auditService';

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
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (callback) callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'dailyPerformance');
    }
  );
}

export async function tambahPerformaHarian(
  entry: Omit<DailyPerformance, 'id' | 'createdAt' | 'updatedAt'>,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const docRef = await addDoc(collection(db, 'dailyPerformance'), {
      ...entry,
      gmv: Number(entry.gmv) || 0,
      estimatedCommission: Number(entry.estimatedCommission) || 0,
      realCommission: Number(entry.realCommission) || 0,
      createdBy: currentUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Also record transaction in transactions collection for unified cash flow
    if (Number(entry.realCommission) > 0) {
      await addDoc(collection(db, 'transactions'), {
        type: 'INCOME',
        scope: entry.scope,
        amount: Number(entry.realCommission) || 0,
        date: entry.date,
        category: 'KOMISI TIKTOK',
        sourceType: 'TIKTOK_COMMISSION',
        accountName: entry.accountName,
        accountId: entry.accountId,
        description: `Komisi Real ${entry.accountName || 'Akun'} (${entry.date})`,
        performanceId: docRef.id,
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
      });
    }

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'INPUT_PERFORMA_HARIAN',
      entry.accountName || entry.accountId,
      `Tanggal: ${entry.date}, GMV: Rp ${Number(entry.gmv).toLocaleString('id-ID')}, Komisi Real: Rp ${Number(entry.realCommission).toLocaleString('id-ID')}`
    );

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'dailyPerformance');
  }
}

export async function hapusPerformaHarian(
  id: string,
  desc: string,
  currentUserId: string,
  currentUserName: string
) {
  try {
    await deleteDoc(doc(db, 'dailyPerformance', id));
    await catatAuditLog(currentUserId, currentUserName, 'HAPUS_PERFORMA', id, desc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `dailyPerformance/${id}`);
  }
}
