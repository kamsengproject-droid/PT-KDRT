import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Employee, ScopeType } from '../types';
import { catatAuditLog } from './auditService';

export function subscribeEmployees(
  scope?: ScopeType,
  callback?: (employees: Employee[]) => void
) {
  const colRef = collection(db, 'employees');
  const q = scope
    ? query(colRef, where('scope', '==', scope))
    : colRef;

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Employee[];
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      if (callback) callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'employees');
    }
  );
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const snap = await getDoc(doc(db, 'employees', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Employee;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `employees/${id}`);
    return null;
  }
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  try {
    const q = query(collection(db, 'employees'), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Employee;
    }
    return null;
  } catch (err) {
    console.warn('Gagal mencari employee by userId:', err);
    return null;
  }
}

export async function tambahKaryawan(
  employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employee,
      baseSalary: Number(employee.baseSalary) || 0,
      active: employee.active !== undefined ? employee.active : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUserId,
    });

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'TAMBAH_KARYAWAN',
      employee.name,
      `Jabatan: ${employee.position}, Scope: ${employee.scope}, Gaji Pokok: Rp ${Number(employee.baseSalary).toLocaleString('id-ID')}`
    );

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'employees');
  }
}

export async function updateKaryawan(
  id: string,
  employee: Partial<Employee>,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const ref = doc(db, 'employees', id);
    const prevSnap = await getDoc(ref);
    const before = prevSnap.exists() ? prevSnap.data() : null;

    const payload: any = {
      ...employee,
      updatedAt: serverTimestamp(),
    };
    if (employee.baseSalary !== undefined) {
      payload.baseSalary = Number(employee.baseSalary) || 0;
    }

    await updateDoc(ref, payload);

    const isGajiChanged = before && employee.baseSalary !== undefined && before.baseSalary !== employee.baseSalary;
    const actionName = isGajiChanged ? 'EDIT_GAJI_KARYAWAN' : 'EDIT_KARYAWAN';

    await catatAuditLog(
      currentUserId,
      currentUserName,
      actionName,
      employee.name || (before ? before.name : id),
      isGajiChanged
        ? `Gaji Pokok diubah dari Rp ${Number(before?.baseSalary).toLocaleString('id-ID')} menjadi Rp ${Number(employee.baseSalary).toLocaleString('id-ID')}`
        : `Update data karyawan ${employee.name || id}`,
      before,
      employee
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `employees/${id}`);
  }
}

export async function toggleStatusKaryawan(
  id: string,
  newActive: boolean,
  employeeName: string,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const ref = doc(db, 'employees', id);
    await updateDoc(ref, {
      active: newActive,
      updatedAt: serverTimestamp(),
    });

    const actionName = newActive ? 'AKTIFKAN_KARYAWAN' : 'NONAKTIFKAN_KARYAWAN';
    await catatAuditLog(
      currentUserId,
      currentUserName,
      actionName,
      employeeName,
      `Status karyawan diubah menjadi ${newActive ? 'Aktif' : 'Nonaktif'}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `employees/${id}`);
  }
}
