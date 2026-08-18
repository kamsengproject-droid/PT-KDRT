import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Expense, ScopeType } from '../types';
import { catatAuditLog } from './auditService';
import { createFinancialTransaction } from './transactionService';

export function subscribeExpenses(
  scope?: ScopeType,
  callback?: (expenses: Expense[]) => void
) {
  const colRef = collection(db, 'expenses');
  const q = scope
    ? query(colRef, where('scope', '==', scope))
    : colRef;

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Expense[];
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (callback) callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'expenses');
    }
  );
}

export async function tambahPengeluaran(
  expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const amount = Number(expense.amount) || 0;
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      amount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUserId,
    });

    // Also record transaction in unified transactions collection for single source of truth
    let sourceType: any = 'MANUAL';
    let refId: any = docRef.id;

    if (expense.sampleId) {
      sourceType = 'SAMPLE';
      refId = expense.sampleId;
    } else if (expense.inventoryId) {
      sourceType = 'INVENTORY';
      refId = expense.inventoryId;
    } else if (expense.payrollId) {
      sourceType = 'PAYROLL';
      refId = expense.payrollId;
    }

    await createFinancialTransaction(
      {
        type: 'EXPENSE',
        scope: expense.scope,
        amount,
        date: expense.date,
        category: expense.category,
        sourceType,
        referenceId: refId,
        accountId: expense.accountId || null,
        accountName: expense.accountName || null,
        employeeId: expense.employeeId || null,
        employeeName: expense.employeeName || null,
        sampleId: expense.sampleId || null,
        inventoryId: expense.inventoryId || null,
        payrollId: expense.payrollId || null,
        paymentMethod: expense.paymentMethod || 'TRANSFER',
        description: expense.description || `Pengeluaran ${expense.category}`,
        createdBy: currentUserId,
        createdByName: currentUserName,
      },
      currentUserId,
      currentUserName
    );

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'TAMBAH_PENGELUARAN',
      expense.category,
      `Jumlah: Rp ${amount.toLocaleString('id-ID')}, Scope: ${expense.scope}, Ket: ${expense.description}`
    );

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'expenses');
    throw error;
  }
}

export async function updateExpense(
  id: string,
  updates: Partial<Expense>,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'UPDATE_PENGELUARAN',
      id,
      `Update pengeluaran: ${updates.description || id}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `expenses/${id}`);
    throw error;
  }
}

export async function hapusPengeluaran(
  id: string,
  description: string,
  currentUserId: string,
  currentUserName: string
) {
  try {
    await deleteDoc(doc(db, 'expenses', id));
    await catatAuditLog(
      currentUserId,
      currentUserName,
      'HAPUS_PENGELUARAN',
      id,
      `Pengeluaran dihapus: ${description}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    throw error;
  }
}

// Aliases for consistent naming
export const tambahExpense = tambahPengeluaran;
export const hapusExpense = hapusPengeluaran;
export const updatePengeluaran = updateExpense;
