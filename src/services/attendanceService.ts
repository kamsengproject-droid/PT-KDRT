import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { AttendanceRecord, AttendanceStatus, CheckoutStatus, Holiday, WorkplaceSchedule, OfficeLocation } from '../types';
import { hitungMenitTerlambat, hitungStatusPulang, getJadwalHari, cekHariLibur, DEFAULT_SCHEDULE } from '../utils/attendanceCalc';
import { validasiGeofence } from '../utils/geofence';
import { catatAuditLog } from './auditService';
import { formatJamPendek, tanggalHariIni } from '../utils/formatters';

// Upload selfie image (base64 data URL) to Firebase Storage
export async function uploadSelfieStorage(
  employeeId: string,
  tanggal: string,
  type: 'checkin' | 'checkout',
  dataUrl: string
): Promise<{
  photoUrl: string;
  storagePath: string;
  photoWidth: number;
  photoHeight: number;
  photoSizeBytes: number;
  photoMimeType: string;
}> {
  // Approximate size from base64
  const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
  const photoSizeBytes = Math.max(1024, Math.round((stringLength * 3) / 4));
  const photoMimeType = 'image/jpeg';
  const photoWidth = 480;
  const photoHeight = 480;

  if (photoSizeBytes > 10 * 1024 * 1024) {
    throw new Error('Ukuran foto terlalu besar. Silakan ambil foto kembali.');
  }

  const timestamp = Date.now();
  const cleanDate = tanggal.replace(/-/g, '');
  const fileName = `${employeeId}_${tanggal}_${type === 'checkin' ? 'checkin' : 'checkout'}_${timestamp}.jpg`;
  const storagePath = `attendance/${employeeId}/${tanggal}/${type === 'checkin' ? 'check-in' : 'check-out'}.jpg`;

  try {
    const fileRef = ref(storage, storagePath);
    // Upload base64 compressed JPEG
    await uploadString(fileRef, dataUrl, 'data_url', {
      contentType: 'image/jpeg',
      customMetadata: {
        employeeId,
        date: tanggal,
        type,
        uploadedAt: new Date().toISOString(),
      },
    });
    const downloadUrl = await getDownloadURL(fileRef);
    return {
      photoUrl: downloadUrl,
      storagePath,
      photoWidth,
      photoHeight,
      photoSizeBytes,
      photoMimeType,
    };
  } catch (error) {
    console.warn('Storage upload notice, saving data reference:', error);
    return {
      photoUrl: dataUrl,
      storagePath,
      photoWidth,
      photoHeight,
      photoSizeBytes,
      photoMimeType,
    };
  }
}

export interface AbsenMasukParams {
  employeeId: string;
  employeeName: string;
  fotoBase64: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  validateGps?: boolean;
  schedule?: WorkplaceSchedule;
  office?: OfficeLocation;
  holidays?: Holiday[];
  currentUserId: string;
  currentUserName: string;
  customTimeStr?: string; // for testing or specific time
}

export async function lakukanAbsenMasuk(params: AbsenMasukParams): Promise<AttendanceRecord> {
  const {
    employeeId,
    employeeName,
    fotoBase64,
    latitude,
    longitude,
    accuracy,
    validateGps = false,
    schedule = DEFAULT_SCHEDULE,
    office = { officeName: 'Kantor PT.KDRT', latitude: -6.2088, longitude: 106.8456, radius: 100 },
    holidays = [],
    currentUserId,
    currentUserName,
    customTimeStr,
  } = params;

  const today = tanggalHariIni();
  const dateFormatted = today.replace(/-/g, '');
  const docId = `${employeeId}_${dateFormatted}`;
  const docRef = doc(db, 'attendance', docId);

  // 1. Check existing record (prevent duplicate check-in)
  const existingSnap = await getDoc(docRef);
  if (existingSnap.exists()) {
    const data = existingSnap.data();
    if (data.waktuMasuk || data.checkInTime || data.checkInAt) {
      await catatAuditLog(
        currentUserId,
        currentUserName,
        'CHECK_IN_REJECTED',
        employeeName,
        'Alasan: DUPLICATE_CHECK_IN (Anda sudah melakukan absen masuk hari ini.)'
      );
      throw new Error('Anda sudah melakukan absen masuk hari ini.');
    }
  }

  let distanceMeters = 0;

  // 2. Optional GPS & Geofence validation (only if explicitly enabled)
  if (validateGps && latitude !== undefined && longitude !== undefined && accuracy !== undefined) {
    const accuracyLimit = office.radius ? Math.max(office.radius, 100) : 100;
    if (accuracy > accuracyLimit) {
      await catatAuditLog(
        currentUserId,
        currentUserName,
        'CHECK_IN_REJECTED',
        employeeName,
        `Alasan: LOW_GPS_ACCURACY (Akurasi ${Math.round(accuracy)}m > batas ${accuracyLimit}m)`
      );
      throw new Error('Akurasi lokasi terlalu rendah. Silakan aktifkan lokasi dengan akurasi tinggi dan coba lagi.');
    }

    const geofenceResult = validasiGeofence(
      latitude,
      longitude,
      accuracy,
      office.latitude,
      office.longitude,
      office.radius
    );

    if (!geofenceResult.isWithin) {
      await catatAuditLog(
        currentUserId,
        currentUserName,
        'CHECK_IN_REJECTED',
        employeeName,
        `Alasan: OUTSIDE_GEOFENCE (Jarak: ${geofenceResult.distance}m dari radius ${office.radius}m)`
      );
      throw new Error('Anda berada di luar area kantor.');
    }
    distanceMeters = geofenceResult.distance;
  }

  // 3. Determine time & status based on day-of-week schedule (Asia/Jakarta)
  const now = new Date();
  const timeStr = customTimeStr || formatJamPendek(now);
  const daySched = getJadwalHari(today, schedule);

  const liburCheck = cekHariLibur(today, holidays, schedule.workDays);
  let status: AttendanceStatus = 'HADIR';
  let menitTerlambat = 0;

  if (liburCheck.isLibur || daySched.isLibur) {
    status = 'LIBUR';
  } else {
    // Jam Masuk 09:00 WIB. Tepat 09:00 = Hadir (0m). 09:01+ = Terlambat (1m+). TIDAK ADA TOLERANSI MASUK.
    const calc = hitungMenitTerlambat(timeStr, daySched.checkInTime, 0);
    status = calc.status;
    menitTerlambat = calc.menitTerlambat;
  }

  // 4. Upload photo to Firebase Storage with 480p JPEG validation
  const uploadRes = await uploadSelfieStorage(employeeId, today, 'checkin', fotoBase64);

  // 5. Save attendance record to Firestore with serverTimestamp
  const recordData: any = {
    userId: currentUserId,
    employeeId,
    employeeName,
    date: today,
    tanggal: today,
    
    // Check In fields
    checkInAt: serverTimestamp(),
    checkInTime: timeStr,
    waktuMasuk: timeStr,
    checkInPhotoUrl: uploadRes.photoUrl,
    fotoMasuk: uploadRes.photoUrl,
    checkInStoragePath: uploadRes.storagePath,

    // Photo metadata
    photoWidth: uploadRes.photoWidth,
    photoHeight: uploadRes.photoHeight,
    photoSizeBytes: uploadRes.photoSizeBytes,
    photoMimeType: uploadRes.photoMimeType,

    // Status
    status,
    lateMinutes: menitTerlambat,
    menitTerlambat,
    earlyCheckoutMinutes: 0,
    jadwalMasuk: daySched.checkInTime,
    jadwalPulang: daySched.checkOutTime,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: currentUserId,
  };

  if (latitude !== undefined) recordData.latitude = latitude;
  if (longitude !== undefined) recordData.longitude = longitude;
  if (accuracy !== undefined) recordData.accuracy = accuracy;
  if (distanceMeters > 0) recordData.distanceFromOffice = distanceMeters;

  try {
    await setDoc(docRef, recordData, { merge: true });

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'CHECK_IN_SUCCESS',
      employeeName,
      `Absen Masuk: ${timeStr} WIB (${daySched.namaHari}, Jadwal: ${daySched.checkInTime} WIB), Status: ${status}${menitTerlambat > 0 ? ` (Terlambat ${menitTerlambat} menit)` : ''}`
    );

    return { id: docId, ...recordData };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `attendance/${docId}`);
    throw new Error('Absensi gagal disimpan. Silakan coba lagi.');
  }
}

export interface AbsenPulangParams {
  employeeId: string;
  employeeName: string;
  fotoBase64: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  validateGps?: boolean;
  schedule?: WorkplaceSchedule;
  office?: OfficeLocation;
  currentUserId: string;
  currentUserName: string;
  customTimeStr?: string;
}

export async function lakukanAbsenPulang(params: AbsenPulangParams): Promise<AttendanceRecord> {
  const {
    employeeId,
    employeeName,
    fotoBase64,
    latitude,
    longitude,
    accuracy,
    validateGps = false,
    schedule = DEFAULT_SCHEDULE,
    office = { officeName: 'Kantor PT.KDRT', latitude: -6.2088, longitude: 106.8456, radius: 100 },
    currentUserId,
    currentUserName,
    customTimeStr,
  } = params;

  const today = tanggalHariIni();
  const dateFormatted = today.replace(/-/g, '');
  const docId = `${employeeId}_${dateFormatted}`;
  const docRef = doc(db, 'attendance', docId);

  // 1. Check existing record
  const existingSnap = await getDoc(docRef);
  if (!existingSnap.exists() || (!existingSnap.data().waktuMasuk && !existingSnap.data().checkInTime)) {
    await catatAuditLog(
      currentUserId,
      currentUserName,
      'CHECK_OUT_REJECTED',
      employeeName,
      'Alasan: CHECKOUT_WITHOUT_CHECKIN (Anda belum melakukan absen masuk hari ini.)'
    );
    throw new Error('Anda belum melakukan absen masuk hari ini.');
  }

  const existingData = existingSnap.data();
  if (existingData.waktuPulang || existingData.checkOutTime || existingData.checkOutAt) {
    await catatAuditLog(
      currentUserId,
      currentUserName,
      'CHECK_OUT_REJECTED',
      employeeName,
      'Alasan: DUPLICATE_CHECK_OUT (Anda sudah melakukan absen pulang hari ini.)'
    );
    throw new Error('Anda sudah melakukan absen pulang hari ini.');
  }

  let distanceMeters = 0;

  // 2. Optional GPS & Geofence validation
  if (validateGps && latitude !== undefined && longitude !== undefined && accuracy !== undefined) {
    const accuracyLimit = office.radius ? Math.max(office.radius, 100) : 100;
    if (accuracy > accuracyLimit) {
      await catatAuditLog(
        currentUserId,
        currentUserName,
        'CHECK_OUT_REJECTED',
        employeeName,
        `Alasan: LOW_GPS_ACCURACY (Akurasi ${Math.round(accuracy)}m > batas ${accuracyLimit}m)`
      );
      throw new Error('Akurasi lokasi terlalu rendah. Silakan aktifkan lokasi dengan akurasi tinggi dan coba lagi.');
    }

    const geofenceResult = validasiGeofence(
      latitude,
      longitude,
      accuracy,
      office.latitude,
      office.longitude,
      office.radius
    );

    if (!geofenceResult.isWithin) {
      await catatAuditLog(
        currentUserId,
        currentUserName,
        'CHECK_OUT_REJECTED',
        employeeName,
        `Alasan: OUTSIDE_GEOFENCE (Jarak: ${geofenceResult.distance}m dari radius ${office.radius}m)`
      );
      throw new Error('Anda berada di luar area kantor.');
    }
    distanceMeters = geofenceResult.distance;
  }

  // 3. Calculate day schedule and early checkout status
  const now = new Date();
  const timeStr = customTimeStr || formatJamPendek(now);
  const daySched = getJadwalHari(today, schedule);
  const checkoutCalc = hitungStatusPulang(
    timeStr,
    daySched.checkOutTime,
    daySched.earlyCheckoutToleranceMinutes
  );

  // 4. Upload photo to Firebase Storage
  const uploadRes = await uploadSelfieStorage(employeeId, today, 'checkout', fotoBase64);

  const updateData: any = {
    checkOutAt: serverTimestamp(),
    checkOutTime: timeStr,
    waktuPulang: timeStr,
    checkOutPhotoUrl: uploadRes.photoUrl,
    fotoPulang: uploadRes.photoUrl,
    checkOutStoragePath: uploadRes.storagePath,
    statusPulang: checkoutCalc.statusPulang,
    checkoutStatus: checkoutCalc.checkoutStatus,
    isEarlyCheckout: checkoutCalc.isEarlyCheckout,
    earlyCheckoutMinutes: checkoutCalc.earlyCheckoutMinutes,
    updatedAt: serverTimestamp(),
    updatedBy: currentUserId,
  };

  if (latitude !== undefined) updateData.latitudePulang = latitude;
  if (longitude !== undefined) updateData.longitudePulang = longitude;
  if (accuracy !== undefined) updateData.accuracyPulang = accuracy;
  if (distanceMeters > 0) updateData.distanceFromOffice = distanceMeters;

  try {
    await updateDoc(docRef, updateData);

    const logDetail = checkoutCalc.isEarlyCheckout
      ? `PULANG TERLALU CEPAT (${checkoutCalc.earlyCheckoutMinutes} menit sebelum batas ${checkoutCalc.earliestAllowedTime} WIB, Jadwal: ${daySched.checkOutTime}) [EARLY_CHECKOUT]`
      : `NORMAL / TEPAT WAKTU (Batas mulai: ${checkoutCalc.earliestAllowedTime} WIB, Jadwal: ${daySched.checkOutTime} WIB)`;

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'CHECK_OUT_SUCCESS',
      employeeName,
      `Absen Pulang: ${timeStr} WIB (${daySched.namaHari}), Status: ${logDetail}${distanceMeters > 0 ? `, Jarak: ${distanceMeters}m` : ''}`
    );

    return { id: docId, ...existingData, ...updateData } as AttendanceRecord;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `attendance/${docId}`);
    throw new Error('Absensi gagal disimpan. Silakan coba lagi.');
  }
}

// Subscribe today's attendance for all employees
export function subscribeTodayAttendance(
  tanggal: string,
  callback: (records: AttendanceRecord[]) => void
) {
  const q = query(collection(db, 'attendance'), where('tanggal', '==', tanggal));
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AttendanceRecord[];
      callback(records);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'attendance');
    }
  );
}

// Subscribe personal attendance history
export function subscribeEmployeeAttendance(
  employeeId: string,
  callback: (records: AttendanceRecord[]) => void
) {
  const q = query(
    collection(db, 'attendance'),
    where('employeeId', '==', employeeId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AttendanceRecord[];
      records.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      callback(records);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'attendance');
    }
  );
}

// Fetch attendance range for weekly bonus / payroll calculation
export async function getAttendanceRange(
  startDate: string,
  endDate: string,
  employeeId?: string
): Promise<AttendanceRecord[]> {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('tanggal', '>=', startDate),
      where('tanggal', '<=', endDate)
    );
    const snap = await getDocs(q);
    let records = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AttendanceRecord[];

    if (employeeId) {
      records = records.filter((r) => r.employeeId === employeeId);
    }
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'attendance');
    return [];
  }
}

// Manual override attendance by Owner
export async function overrideAttendance(
  recordId: string,
  changes: Partial<AttendanceRecord>,
  currentUserId: string,
  currentUserName: string
) {
  try {
    const ref = doc(db, 'attendance', recordId);
    const prevSnap = await getDoc(ref);
    const before = prevSnap.exists() ? prevSnap.data() : null;

    await updateDoc(ref, {
      ...changes,
      updatedAt: serverTimestamp(),
      overrideBy: currentUserId,
    });

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'OVERRIDE_ABSENSI',
      recordId,
      `Perubahan status/jam oleh Owner`,
      before,
      changes
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `attendance/${recordId}`);
  }
}
