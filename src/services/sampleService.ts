import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AffiliateSample,
  SampleStatus,
  ScopeType,
  DailyTask,
  Expense,
} from '../types';
import { catatAuditLog } from './auditService';
import { createDailyTask, updateTaskOutput, selesaikanTask } from './taskService';
import { createFinancialTransaction } from './transactionService';
import { tanggalHariIni } from '../utils/formatters';

export const SAMPLES_COLLECTION = 'samples';

// 1. Subscribe to Samples
export function subscribeSamples(
  options?: {
    scope?: ScopeType;
    status?: SampleStatus | 'SEMUA';
    accountId?: string;
    employeeId?: string;
  },
  callback?: (samples: AffiliateSample[]) => void
) {
  let q: any = collection(db, SAMPLES_COLLECTION);

  if (options?.scope) {
    q = query(
      collection(db, SAMPLES_COLLECTION),
      where('scope', '==', options.scope)
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      let samples = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        sampleId: docSnap.id,
        ...docSnap.data(),
      })) as AffiliateSample[];

      samples.sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));

      if (options?.status && options.status !== 'SEMUA') {
        samples = samples.filter((s) => s.status === options.status);
      }

      if (options?.accountId && options.accountId !== 'SEMUA') {
        samples = samples.filter(
          (s) =>
            s.accountId === options.accountId ||
            (s.accountIds && s.accountIds.includes(options.accountId!))
        );
      }

      if (options?.employeeId && options.employeeId !== 'SEMUA') {
        samples = samples.filter((s) => s.employeeId === options.employeeId);
      }

      if (callback) callback(samples);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, SAMPLES_COLLECTION);
    }
  );
}

// 2. Create Sample Purchase Record
export async function createSample(
  sampleData: Omit<AffiliateSample, 'id' | 'sampleId' | 'createdAt' | 'updatedAt'>,
  autoCreateExpense: boolean,
  autoCreateTask: boolean,
  currentUserId: string,
  currentUserName: string
): Promise<string> {
  const samplePrice = Number(sampleData.samplePrice) || 0;
  const quantity = Math.max(1, Number(sampleData.quantity) || 1);
  const totalCost = Number(sampleData.totalCost) || samplePrice * quantity;
  const targetContent = Number(sampleData.targetContent) || 1;
  const completedContent = Number(sampleData.completedContent) || 0;

  const payload: any = {
    ...sampleData,
    samplePrice,
    quantity,
    totalCost,
    targetContent,
    completedContent,
    unitContent: sampleData.unitContent || 'VT',
    status: sampleData.status || 'DIPESAN',
    scope: sampleData.scope || 'PRIBADI',
    purchaseDate: sampleData.purchaseDate || tanggalHariIni(),
    isExpenseRecorded: false,
    createdBy: currentUserId,
    createdByName: currentUserName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, SAMPLES_COLLECTION), payload);
    const sampleId = docRef.id;

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'SAMPLE_CREATED',
      `Sampel: ${sampleData.productName}`,
      `ID: ${sampleId}, Qty: ${quantity}, Biaya: Rp ${totalCost.toLocaleString('id-ID')}, Status: ${payload.status}`
    );

    // Optional: Auto Create Financial Expense with anti-double-entry
    if (autoCreateExpense && totalCost > 0) {
      try {
        await recordSampleExpense(sampleId, { ...payload, id: sampleId }, currentUserId, currentUserName);
      } catch (expErr: any) {
        console.warn('Auto expense recording notice:', expErr.message);
      }
    }

    // Optional: Auto Create Kerjaan Harian (Daily Task) for assigned employee
    if (autoCreateTask && sampleData.employeeId && targetContent > 0) {
      try {
        const taskId = await createDailyTask(
          {
            tanggal: sampleData.purchaseDate || tanggalHariIni(),
            employeeId: sampleData.employeeId,
            employeeName: sampleData.employeeName || 'Karyawan',
            taskName: `Produksi Konten Sampel: ${sampleData.productName}`,
            accountId: sampleData.accountId,
            accountName: sampleData.accountName,
            targetOutput: targetContent,
            currentOutput: completedContent,
            unitOutput: sampleData.unitContent || 'VT',
            status: completedContent >= targetContent ? 'SELESAI' : 'BELUM DIKERJAKAN',
            priority: 'NORMAL',
            sampleId: sampleId,
            productId: sampleData.productId,
            notes: `Pembuatan konten untuk sampel produk ${sampleData.productName}. Link: ${sampleData.productUrl || '-'}`,
            createdBy: currentUserId,
          },
          currentUserId,
          currentUserName
        );

        await updateDoc(docRef, { taskId: taskId });
      } catch (taskErr: any) {
        console.warn('Auto task creation notice:', taskErr.message);
      }
    }

    return sampleId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SAMPLES_COLLECTION);
    throw error;
  }
}

// 3. Update Sample Details
export async function updateSample(
  id: string,
  currentSample: AffiliateSample,
  updates: Partial<AffiliateSample>,
  currentUserId: string,
  currentUserName: string
): Promise<void> {
  const samplePrice = updates.samplePrice !== undefined ? Number(updates.samplePrice) : currentSample.samplePrice;
  const quantity = updates.quantity !== undefined ? Number(updates.quantity) : currentSample.quantity;
  const totalCost = samplePrice * quantity;

  const payload: any = {
    ...updates,
    samplePrice,
    quantity,
    totalCost,
    updatedAt: serverTimestamp(),
    updatedBy: currentUserId,
    updatedByName: currentUserName,
  };

  try {
    const docRef = doc(db, SAMPLES_COLLECTION, id);
    await updateDoc(docRef, payload);

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'SAMPLE_UPDATED',
      `Sampel: ${updates.productName || currentSample.productName}`,
      `Update data sampel ID ${id}. Total Biaya: Rp ${totalCost.toLocaleString('id-ID')}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SAMPLES_COLLECTION}/${id}`);
    throw error;
  }
}

// 4. Update Sample Status (DIPESAN -> DIKIRIM -> DITERIMA -> DIGUNAKAN -> SELESAI)
export async function updateSampleStatus(
  id: string,
  currentSample: AffiliateSample,
  newStatus: SampleStatus,
  currentUserId: string,
  currentUserName: string
): Promise<void> {
  try {
    const docRef = doc(db, SAMPLES_COLLECTION, id);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updatedBy: currentUserId,
      updatedByName: currentUserName,
    });

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'SAMPLE_STATUS_CHANGED',
      `Sampel: ${currentSample.productName}`,
      `Status sampel berubah dari ${currentSample.status} menjadi ${newStatus}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SAMPLES_COLLECTION}/${id}`);
    throw error;
  }
}

// 5. Update Sample Content Progress & Sync with Linked Kerjaan Harian
export async function updateSampleContentProgress(
  id: string,
  currentSample: AffiliateSample,
  newCompletedContent: number,
  currentUserId: string,
  currentUserName: string
): Promise<void> {
  const completed = Math.max(0, Number(newCompletedContent) || 0);
  const target = Number(currentSample.targetContent) || 1;
  const isTargetAchieved = completed >= target;

  try {
    const docRef = doc(db, SAMPLES_COLLECTION, id);
    const updates: any = {
      completedContent: completed,
      updatedAt: serverTimestamp(),
      updatedBy: currentUserId,
      updatedByName: currentUserName,
    };

    // Auto-update sample status to DIGUNAKAN or SELESAI if progress advances
    if (isTargetAchieved && currentSample.status === 'DIGUNAKAN') {
      updates.status = 'SELESAI';
    } else if (completed > 0 && currentSample.status === 'DITERIMA') {
      updates.status = 'DIGUNAKAN';
    }

    await updateDoc(docRef, updates);

    // Sync with linked DailyTask if exists
    if (currentSample.taskId) {
      try {
        const taskRef = doc(db, 'dailyTasks', currentSample.taskId);
        const taskSnap = await getDoc(taskRef);
        if (taskSnap.exists()) {
          const taskData = taskSnap.data() as DailyTask;
          await updateDoc(taskRef, {
            currentOutput: completed,
            status: isTargetAchieved ? 'SELESAI' : 'SEDANG DIKERJAKAN',
            completedAt: isTargetAchieved ? serverTimestamp() : null,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (taskSyncErr) {
        console.warn('Sync to dailyTask notice:', taskSyncErr);
      }
    }

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'SAMPLE_CONTENT_PROGRESS_UPDATED',
      `Sampel: ${currentSample.productName}`,
      `Progress konten: ${completed}/${target} ${currentSample.unitContent || 'VT'} (${isTargetAchieved ? 'TARGET TERCAPAI' : 'BELUM SELESAI'})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SAMPLES_COLLECTION}/${id}`);
    throw error;
  }
}

// 6. Record Financial Expense with STRICT Anti-Double-Entry Protection
export async function recordSampleExpense(
  sampleId: string,
  sample: AffiliateSample,
  currentUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string; expenseId?: string }> {
  try {
    // Check 1: In sample document itself
    if (sample.isExpenseRecorded && sample.expenseId) {
      await catatAuditLog(
        currentUserId,
        currentUserName,
        'SAMPLE_EXPENSE_PREVENTED_DUPLICATE',
        `Sampel: ${sample.productName}`,
        `Percobaan pencatatan ganda dicegah. Pengeluaran sampel ${sampleId} sudah tercatat di Expense ID: ${sample.expenseId}`
      );
      return {
        success: false,
        message: 'Pengeluaran sampel ini sudah tercatat.',
        expenseId: sample.expenseId,
      };
    }

    // Check 2: Query Firestore 'expenses' collection for any doc with sampleId
    const expensesCol = collection(db, 'expenses');
    const q = query(expensesCol, where('sampleId', '==', sampleId));
    const existingSnap = await getDocs(q);

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      // Update sample reference if not already synced
      await updateDoc(doc(db, SAMPLES_COLLECTION, sampleId), {
        expenseId: existingDoc.id,
        isExpenseRecorded: true,
        expenseRecordedAt: serverTimestamp(),
      });

      await catatAuditLog(
        currentUserId,
        currentUserName,
        'SAMPLE_EXPENSE_PREVENTED_DUPLICATE',
        `Sampel: ${sample.productName}`,
        `Pengeluaran sampel ${sampleId} sudah ada di database (Expense ID: ${existingDoc.id}). Anti-double-entry aktif.`
      );

      return {
        success: false,
        message: 'Pengeluaran sampel ini sudah tercatat.',
        expenseId: existingDoc.id,
      };
    }

    // Amount to record
    const amount = Number(sample.totalCost) > 0 ? Number(sample.totalCost) : Number(sample.samplePrice) * Number(sample.quantity);

    // Create Expense in 'expenses' collection
    const expensePayload = {
      date: sample.purchaseDate || tanggalHariIni(),
      amount: amount,
      category: 'SAMPEL',
      scope: sample.scope || 'PRIBADI',
      accountId: sample.accountId || null,
      accountName: sample.accountName || null,
      employeeId: sample.employeeId || null,
      employeeName: sample.employeeName || null,
      sampleId: sampleId,
      productId: sample.productId || null,
      description: `Pembelian Sampel: ${sample.productName} (${sample.quantity} unit @ Rp ${Number(sample.samplePrice).toLocaleString('id-ID')})`,
      createdBy: currentUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const expenseDocRef = await addDoc(expensesCol, expensePayload);

    // Also add to master transactions collection with deterministic ID for unified ledger
    await createFinancialTransaction(
      {
        type: 'EXPENSE',
        scope: sample.scope || 'PRIBADI',
        amount: amount,
        date: sample.purchaseDate || tanggalHariIni(),
        category: 'SAMPEL',
        sourceType: 'SAMPLE',
        referenceId: sampleId,
        accountId: sample.accountId || null,
        accountName: sample.accountName || null,
        employeeId: sample.employeeId || null,
        employeeName: sample.employeeName || null,
        sampleId: sampleId,
        productId: sample.productId || null,
        description: expensePayload.description,
        createdBy: currentUserId,
        createdByName: currentUserName,
      },
      currentUserId,
      currentUserName
    );

    // Update Sample record with expense reference
    await updateDoc(doc(db, SAMPLES_COLLECTION, sampleId), {
      expenseId: expenseDocRef.id,
      isExpenseRecorded: true,
      expenseRecordedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'SAMPLE_EXPENSE_CREATED',
      `Sampel: ${sample.productName}`,
      `Pengeluaran dicatat: Rp ${amount.toLocaleString('id-ID')} (Expense ID: ${expenseDocRef.id}, Scope: ${sample.scope})`
    );

    return {
      success: true,
      message: `Pengeluaran sampel sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat ke Arus Kas.`,
      expenseId: expenseDocRef.id,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'expenses');
    throw error;
  }
}

// 7. Delete Sample
export async function deleteSample(
  id: string,
  currentSample: AffiliateSample,
  currentUserId: string,
  currentUserName: string
): Promise<void> {
  try {
    const docRef = doc(db, SAMPLES_COLLECTION, id);
    await deleteDoc(docRef);

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'SAMPLE_DELETED',
      `Sampel: ${currentSample.productName}`,
      `Sampel ID ${id} dihapus.`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SAMPLES_COLLECTION}/${id}`);
    throw error;
  }
}
