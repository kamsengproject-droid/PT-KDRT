import React, { useState, useEffect } from 'react';
import {
  Camera,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  lakukanAbsenMasuk,
  lakukanAbsenPulang,
  subscribeEmployeeAttendance,
} from '../services/attendanceService';
import {
  subscribeWorkplaceSchedule,
  subscribeHolidays,
} from '../services/settingsService';
import { AttendanceRecord, Holiday, WorkplaceSchedule } from '../types';
import { formatJam, tanggalHariIni, formatHariTanggal } from '../utils/formatters';
import { CameraSelfieModal } from '../components/CameraSelfieModal';
import { DEFAULT_SCHEDULE, getJadwalHari } from '../utils/attendanceCalc';

export const AbsensiEmployeePage: React.FC = () => {
  const { userProfile, employeeProfile, loading, currentUser } = useAuth();

  // Settings & Schedule
  const [schedule, setSchedule] = useState<WorkplaceSchedule>(DEFAULT_SCHEDULE);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Current Attendance Record Today
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal Camera state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [attendanceMode, setAttendanceMode] = useState<'checkin' | 'checkout'>('checkin');

  // Determine active employee info
  const activeEmployeeId =
    employeeProfile?.id || (userProfile?.name === 'Desta' ? 'desta-id' : 'melinda-id');
  const activeEmployeeName = employeeProfile?.name || userProfile?.name || 'Melinda';

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    if (loading || !currentUser || !userProfile?.active) {
      return () => {
        clearInterval(clockTimer);
      };
    }
    const unsubSchedule = subscribeWorkplaceSchedule(setSchedule);
    const unsubHolidays = subscribeHolidays(setHolidays);

    return () => {
      clearInterval(clockTimer);
      unsubSchedule();
      unsubHolidays();
    };
  }, [loading, currentUser?.uid, userProfile?.role, userProfile?.active]);

  // Listen to today's attendance for this employee
  useEffect(() => {
    if (loading || !currentUser || !userProfile?.active) {
      return;
    }
    const today = tanggalHariIni();
    const unsub = subscribeEmployeeAttendance(activeEmployeeId, (records) => {
      const myRecord = records.find((r) => r.tanggal === today);
      setTodayRecord(myRecord || null);
    });

    return unsub;
  }, [loading, currentUser?.uid, userProfile?.role, userProfile?.active, activeEmployeeId]);

  const handleStartAbsenMasuk = () => {
    setActionError(null);
    setActionSuccess(null);
    setAttendanceMode('checkin');
    setIsCameraOpen(true);
  };

  const handleStartAbsenPulang = () => {
    setActionError(null);
    setActionSuccess(null);
    setAttendanceMode('checkout');
    setIsCameraOpen(true);
  };

  const todaySchedule = getJadwalHari(tanggalHariIni(), schedule);

  const handleCapturePhoto = async (dataUrl: string) => {
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (attendanceMode === 'checkin') {
        const result = await lakukanAbsenMasuk({
          employeeId: activeEmployeeId,
          employeeName: activeEmployeeName,
          fotoBase64: dataUrl,
          schedule,
          holidays,
          currentUserId: currentUser?.uid || userProfile?.uid || '',
          currentUserName: activeEmployeeName,
        });

        setActionSuccess(
          `Absen Masuk Berhasil! Status: ${result.status}${
            result.menitTerlambat > 0
              ? ` (Terlambat ${result.menitTerlambat} menit)`
              : ' (Tepat Waktu)'
          }`
        );
      } else {
        const result = await lakukanAbsenPulang({
          employeeId: activeEmployeeId,
          employeeName: activeEmployeeName,
          fotoBase64: dataUrl,
          schedule,
          currentUserId: currentUser?.uid || userProfile?.uid || '',
          currentUserName: activeEmployeeName,
        });

        if (result.isEarlyCheckout) {
          setActionSuccess(
            `Absen Pulang Berhasil dicatat! Status: PULANG TERLALU CEPAT (EARLY_CHECKOUT - ${
              result.earlyCheckoutMinutes || 0
            }m sebelum batas normal).`
          );
        } else {
          setActionSuccess(
            'Absen Pulang Berhasil! Status: NORMAL (Tepat Waktu). Terima kasih atas kerja keras Anda hari ini.'
          );
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Terjadi kesalahan saat absensi.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12">
      {/* Employee Greeting Card */}
      <div className="rounded-3xl bg-zinc-900 p-6 text-white shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                Talent &amp; Karyawan
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Halo, {activeEmployeeName}!
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
              {formatHariTanggal(currentTime)}
            </p>
          </div>
          <div className="text-right">
            <div className="rounded-2xl bg-zinc-800/80 px-3.5 py-2 border border-zinc-700/60 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold justify-end">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                <span>WIB (Jakarta)</span>
              </div>
              <span className="text-xl font-mono font-extrabold text-white">
                {formatJam(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Day-Specific Schedule Badge */}
        <div className="relative z-10 mt-5 pt-4 border-t border-zinc-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-400">Jadwal ({todaySchedule.namaHari}):</span>
              <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded-md">
                {todaySchedule.isLibur
                  ? 'LIBUR MINGGUAN'
                  : `${todaySchedule.checkInTime} – ${todaySchedule.checkOutTime} WIB`}
              </span>
            </div>
            {!todaySchedule.isLibur && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span>Boleh Pulang:</span>
                <span className="font-bold font-mono bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-emerald-300">
                  ≥ {todaySchedule.earliestCheckoutTime} WIB
                </span>
              </div>
            )}
          </div>
          {!todaySchedule.isLibur && (
            <p className="text-[10px] text-zinc-400">
              Absen pulang {todaySchedule.earliestCheckoutTime}–{todaySchedule.checkOutTime} WIB = Normal.
              Sebelum {todaySchedule.earliestCheckoutTime} = Pulang Terlalu Cepat (EARLY_CHECKOUT).
            </p>
          )}
        </div>
      </div>

      {/* Notifications Alert */}
      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 text-sm flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Absensi Gagal</span>
            <span>{actionError}</span>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-sm flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Berhasil!</span>
            <span>{actionSuccess}</span>
          </div>
        </div>
      )}

      {/* Main Attendance Action Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm text-center space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Status Absensi Hari Ini
          </span>
          <div className="mt-2">
            {!todayRecord ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-bold text-zinc-700">
                <Clock className="h-4 w-4 text-zinc-500" />
                Belum Absen Masuk
              </span>
            ) : todayRecord.waktuPulang ? (
              todayRecord.isEarlyCheckout || todayRecord.checkoutStatus === 'EARLY_CHECKOUT' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  PULANG TERLALU CEPAT ({todayRecord.waktuPulang} WIB •{' '}
                  {todayRecord.earlyCheckoutMinutes || 0}m sebelum batas)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-800">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Absensi Lengkap (Pulang {todayRecord.waktuPulang} WIB - NORMAL)
                </span>
              )
            ) : todayRecord.status === 'TERLAMBAT' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                TERLAMBAT {todayRecord.menitTerlambat} MENIT (Masuk {todayRecord.waktuMasuk} WIB)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                HADIR (Masuk {todayRecord.waktuMasuk} WIB)
              </span>
            )}
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="pt-2">
          {!todayRecord ? (
            <button
              onClick={handleStartAbsenMasuk}
              disabled={loadingAction}
              className="w-full rounded-2xl bg-emerald-600 py-4 px-6 text-base sm:text-lg font-extrabold text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Camera className="h-6 w-6" />
              <span>ABSEN MASUK</span>
            </button>
          ) : !todayRecord.waktuPulang ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Jam Masuk:</span>
                  <span className="font-bold text-zinc-900">{todayRecord.waktuMasuk} WIB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status Kedisiplinan:</span>
                  <span className="font-semibold text-zinc-800">{todayRecord.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Batas Absen Pulang Normal:</span>
                  <span className="font-bold text-emerald-700">
                    Mulai {todaySchedule.earliestCheckoutTime} WIB
                  </span>
                </div>
                {todayRecord.fotoMasuk && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={todayRecord.fotoMasuk}
                      alt="Selfie Masuk"
                      className="h-12 w-12 rounded-xl object-cover border border-zinc-200"
                    />
                    <span className="text-zinc-500 text-[11px]">Foto selfie masuk terverifikasi</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleStartAbsenPulang}
                disabled={loadingAction}
                className="w-full rounded-2xl bg-blue-600 py-4 px-6 text-base sm:text-lg font-extrabold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <LogOut className="h-6 w-6" />
                <span>ABSEN PULANG</span>
              </button>
            </div>
          ) : (
            <div
              className={`rounded-2xl p-5 border text-sm space-y-2 ${
                todayRecord.isEarlyCheckout || todayRecord.checkoutStatus === 'EARLY_CHECKOUT'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2 font-bold text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Tugas Hari Ini Selesai</span>
              </div>
              <p className="text-xs">
                Masuk: <strong>{todayRecord.waktuMasuk} WIB</strong> • Pulang:{' '}
                <strong>{todayRecord.waktuPulang} WIB</strong>
              </p>
              {todayRecord.isEarlyCheckout && (
                <p className="text-[11px] text-amber-800 font-semibold">
                  Catatan: Absen Pulang sebelum batas normal {todaySchedule.earliestCheckoutTime} WIB
                  (Status: PULANG TERLALU CEPAT).
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selfie Live Camera Modal */}
      <CameraSelfieModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        title={
          attendanceMode === 'checkin'
            ? 'Foto Selfie Absen Masuk'
            : 'Foto Selfie Absen Pulang'
        }
      />
    </div>
  );
};
