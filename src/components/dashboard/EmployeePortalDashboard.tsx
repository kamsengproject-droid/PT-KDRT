import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Camera,
  ClipboardList,
  Package,
  Award,
  Sparkles,
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Building,
  User,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PtKdrtLogo } from '../PtKdrtLogo';
import {
  subscribeEmployeePayroll,
  subscribeAttendanceBonusesByEmployee,
} from '../../services/payrollService';
import { subscribeEmployeeAttendance } from '../../services/attendanceService';
import { subscribeDailyTasksByEmployee } from '../../services/taskService';
import { subscribeSamples } from '../../services/sampleService';
import {
  AttendanceBonusWeek,
  AttendanceRecord,
  DailyTask,
  AffiliateSample,
  PayrollRecord,
} from '../../types';
import {
  formatRupiah,
  tanggalHariIni,
  bulanSekarang,
  formatBulanTahun,
} from '../../utils/formatters';

interface EmployeePortalDashboardProps {
  onNavigate: (menuId: string, extraState?: any) => void;
}

export const EmployeePortalDashboard: React.FC<EmployeePortalDashboardProps> = ({ onNavigate }) => {
  const { userProfile, employeeProfile, role, loading: authLoading, currentUser } = useAuth();

  // Employee Identity (Auth UID -> users/{uid} -> employees.userId / employeeProfile.id)
  const activeEmployeeId =
    employeeProfile?.id ||
    userProfile?.employeeId ||
    (currentUser?.uid ? currentUser.uid : '') ||
    (userProfile?.name?.toLowerCase().includes('desta') ? 'desta-id' : 'melinda-id');
  const activeEmployeeName = employeeProfile?.name || userProfile?.name || 'Karyawan PT.KDRT';

  const [currentMonth] = useState<string>(bulanSekarang()); // YYYY-MM (WIB)
  const [todayDate] = useState<string>(tanggalHariIni()); // YYYY-MM-DD (WIB)

  // Real data states
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [weeklyBonuses, setWeeklyBonuses] = useState<AttendanceBonusWeek[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [samples, setSamples] = useState<AffiliateSample[]>([]);

  // Loading & error states
  const [loadingSalary, setLoadingSalary] = useState<boolean>(true);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(true);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [loadingSamples, setLoadingSamples] = useState<boolean>(true);
  const [hasSalaryError, setHasSalaryError] = useState<boolean>(false);

  useEffect(() => {
    if (authLoading || !currentUser || !userProfile?.active || !activeEmployeeId) {
      if (!authLoading) {
        setLoadingSalary(false);
      }
      return;
    }

    setLoadingSalary(true);
    setLoadingAttendance(true);
    setLoadingTasks(true);
    setLoadingSamples(true);
    setHasSalaryError(false);

    // Safety timeout to avoid infinite loading
    const safetyTimer = setTimeout(() => {
      setLoadingSalary(false);
    }, 4000);

    // 1. Subscribe Payroll Real Data (Isolated for current employee)
    const unsubPayroll = subscribeEmployeePayroll(
      activeEmployeeId,
      (list) => {
        clearTimeout(safetyTimer);
        setPayrolls(list);
        setLoadingSalary(false);
        setHasSalaryError(false);
      },
      (_err) => {
        clearTimeout(safetyTimer);
        setLoadingSalary(false);
        setHasSalaryError(true);
      }
    );

    // 2. Subscribe Weekly Attendance Bonuses Real Data
    const unsubBonuses = subscribeAttendanceBonusesByEmployee(
      activeEmployeeId,
      (list) => {
        setWeeklyBonuses(list);
      },
      (_err) => {
        setWeeklyBonuses([]);
      }
    );

    // 3. Subscribe Attendance Real Data
    const unsubAttendance = subscribeEmployeeAttendance(
      activeEmployeeId,
      (list) => {
        setAttendanceList(list);
        setLoadingAttendance(false);
      }
    );

    // 4. Subscribe Daily Tasks Real Data
    const unsubTasks = subscribeDailyTasksByEmployee(
      {
        employeeId: activeEmployeeId,
        userId: currentUser.uid,
        employeeName: activeEmployeeName,
      },
      todayDate,
      (tasks) => {
        setTodayTasks(tasks);
        setLoadingTasks(false);
      }
    );

    // 5. Subscribe Sharing Samples Real Data
    const unsubSamples = subscribeSamples(
      {
        scope: 'SHARING',
        employeeId: activeEmployeeId,
      },
      (sampleList) => {
        setSamples(sampleList);
        setLoadingSamples(false);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubPayroll();
      unsubBonuses();
      unsubAttendance();
      unsubTasks();
      unsubSamples();
    };
  }, [
    authLoading,
    currentUser?.uid,
    userProfile?.active,
    activeEmployeeId,
    activeEmployeeName,
    todayDate,
  ]);

  // Calculations strictly from real data
  const currentMonthPayroll = payrolls.find((p) => p.month === currentMonth);
  const currentMonthBonuses = weeklyBonuses.filter(
    (b) => b.month === currentMonth || (b.weekStart && b.weekStart.startsWith(currentMonth))
  );

  // 1. TOTAL BULAN INI
  let totalBulanIniValue: string | null = null;
  if (currentMonthPayroll) {
    const total = currentMonthPayroll.totalPay !== undefined
      ? currentMonthPayroll.totalPay
      : currentMonthPayroll.total !== undefined
      ? currentMonthPayroll.total
      : 0;
    totalBulanIniValue = formatRupiah(total);
  } else if (currentMonthBonuses.length > 0 || employeeProfile?.baseSalary !== undefined) {
    const baseSal = employeeProfile?.baseSalary || 0;
    const bonRajin = currentMonthBonuses.reduce((sum, b) => sum + (Number(b.finalBonus) || 0), 0);
    totalBulanIniValue = formatRupiah(baseSal + bonRajin);
  }

  // 2. UANG RAJIN
  let uangRajinValue: string | null = null;
  if (currentMonthPayroll && currentMonthPayroll.attendanceBonus !== undefined) {
    uangRajinValue = formatRupiah(currentMonthPayroll.attendanceBonus);
  } else if (currentMonthBonuses.length > 0) {
    const totalRajin = currentMonthBonuses.reduce((sum, b) => sum + (Number(b.finalBonus) || 0), 0);
    uangRajinValue = formatRupiah(totalRajin);
  }

  // 3. BONUS BULAN INI
  let bonusBulanIniValue: string | null = null;
  if (currentMonthPayroll && (currentMonthPayroll.bonus !== undefined || currentMonthPayroll.bonusAmount !== undefined)) {
    const bns = Number(currentMonthPayroll.bonus || currentMonthPayroll.bonusAmount || 0);
    bonusBulanIniValue = formatRupiah(bns);
  }

  // 4. GAJI (Gaji Pokok)
  let gajiPokokValue: string | null = null;
  if (currentMonthPayroll && currentMonthPayroll.baseSalary !== undefined) {
    gajiPokokValue = formatRupiah(currentMonthPayroll.baseSalary);
  } else if (employeeProfile?.baseSalary !== undefined) {
    gajiPokokValue = formatRupiah(employeeProfile.baseSalary);
  }

  // Real Attendance for today
  const todayAttendance = attendanceList.find((a) => a.tanggal === todayDate);
  const hasCheckedIn = Boolean(
    todayAttendance?.checkInAt ||
    todayAttendance?.waktuMasuk ||
    todayAttendance?.checkInTime
  );
  const hasCheckedOut = Boolean(
    todayAttendance?.checkOutAt ||
    todayAttendance?.waktuPulang ||
    todayAttendance?.checkOutTime
  );

  let attendanceStatusText = 'BELUM ABSEN';
  let attendanceBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let attendanceDetailText = 'Silakan lakukan foto selfie check-in';

  if (hasCheckedOut) {
    attendanceStatusText = 'SUDAH ABSEN PULANG';
    attendanceBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    attendanceDetailText = `Masuk: ${todayAttendance?.waktuMasuk || todayAttendance?.checkInTime || '-'} • Pulang: ${todayAttendance?.waktuPulang || todayAttendance?.checkOutTime || '-'}`;
  } else if (hasCheckedIn) {
    attendanceStatusText = 'SUDAH ABSEN MASUK';
    attendanceBadgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
    attendanceDetailText = `Masuk: ${todayAttendance?.waktuMasuk || todayAttendance?.checkInTime || '-'} WIB (Belum absen pulang)`;
  }

  // Real Tasks Summary
  const unfinishedTasks = todayTasks.filter(
    (t) => t.status !== 'SELESAI' && (Number(t.currentOutput) || 0) < (Number(t.targetOutput) || 1)
  );

  // Real Samples Summary
  const unfinishedSamples = samples.filter(
    (s) => s.status !== 'SELESAI' && (Number(s.completedContent) || 0) < (Number(s.targetContent) || 1)
  );

  const currentMonthLabel = formatBulanTahun(currentMonth);

  return (
    <div className="space-y-6 pb-12" id="employee-dashboard-root">
      {/* 1. Header Identitas KANTOR PT.KDRT Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PtKdrtLogo variant="horizontal" size="md" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              Pilih aplikasi yang ingin Anda akses.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-1.5 text-right">
              <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                Periode
              </div>
              <div className="text-xs font-black text-slate-900">
                {currentMonthLabel}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Status Peran
              </div>
              <div className="text-xs font-bold text-slate-800">
                👤 Karyawan ({employeeProfile?.position || 'Talent Sharing'})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EMPLOYEE DASHBOARD KPI GRID 2 x 2 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              RINGKASAN PENGHASILAN ({currentMonthLabel})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('slip-gaji-karyawan')}
            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
          >
            <span>Rincian Slip Gaji</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loadingSalary ? (
          /* SKELETON LOADING STATE (NO DUMMY NUMBERS) */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs animate-pulse space-y-3"
              >
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                <div className="h-6 w-28 bg-slate-200 rounded"></div>
                <div className="h-2 w-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : hasSalaryError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-rose-700 text-xs font-bold">
            <span className="font-black text-rose-900 block mb-1">DATA GAJI GAGAL DIMUAT</span>
            Silakan periksa koneksi jaringan atau coba muat ulang halaman.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* CARD 1: TOTAL BULAN INI (BLUE) */}
            <div
              id="kpi-total-bulan-ini"
              className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-blue-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-blue-900">
                    TOTAL BULAN INI
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                    <Wallet className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-base sm:text-xl md:text-2xl font-black text-blue-950 mt-2 tracking-tight">
                  {totalBulanIniValue !== null ? totalBulanIniValue : 'BELUM ADA DATA'}
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-blue-700 mt-2">
                Total pendapatan berjalan
              </div>
            </div>

            {/* CARD 2: UANG RAJIN (ORANGE) */}
            <div
              id="kpi-uang-rajin"
              className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/90 to-orange-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-orange-900">
                    UANG RAJIN
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white shadow-2xs">
                    <Award className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-base sm:text-xl md:text-2xl font-black text-orange-950 mt-2 tracking-tight">
                  {uangRajinValue !== null ? uangRajinValue : 'BELUM ADA DATA'}
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-orange-700 mt-2">
                Bonus kedisiplinan mingguan
              </div>
            </div>

            {/* CARD 3: BONUS BULAN INI (PURPLE) */}
            <div
              id="kpi-bonus-bulan-ini"
              className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/90 to-purple-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-purple-900">
                    BONUS BULAN INI
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-base sm:text-xl md:text-2xl font-black text-purple-950 mt-2 tracking-tight">
                  {bonusBulanIniValue !== null ? bonusBulanIniValue : 'BELUM ADA DATA'}
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-purple-700 mt-2">
                Bonus target & performa
              </div>
            </div>

            {/* CARD 4: GAJI (RED/PINK) */}
            <div
              id="kpi-gaji-pokok"
              className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/90 to-rose-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-rose-900">
                    GAJI
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-2xs">
                    <DollarSign className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-base sm:text-xl md:text-2xl font-black text-rose-950 mt-2 tracking-tight">
                  {gajiPokokValue !== null ? gajiPokokValue : 'BELUM ADA DATA'}
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-rose-700 mt-2">
                Gaji Pokok bulanan
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. APLIKASI UTAMA KARYAWAN (ABSENSI, KERJAAN HARI INI, PRODUK SAMPEL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: ABSENSI */}
        <div
          id="card-app-absensi"
          className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 shadow-2xs group-hover:scale-105 transition-transform">
                <Camera className="h-5 w-5" />
              </div>

              {/* Status Ringkasan Absensi Hari Ini */}
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${attendanceBadgeColor}`}
              >
                {attendanceStatusText}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
              ABSENSI
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Absensi masuk dan pulang dengan kamera selfie.
            </p>

            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{attendanceDetailText}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
              Akses Modul
            </span>
            <button
              type="button"
              onClick={() => onNavigate('absensi-karyawan')}
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:text-orange-700 transition-colors min-h-[44px] px-2 py-1"
            >
              <span>Buka Aplikasi</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* CARD 2: KERJAAN HARI INI */}
        <div
          id="card-app-kerjaan"
          className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
                <ClipboardList className="h-5 w-5" />
              </div>

              {/* Summary Kerjaan Belum Selesai */}
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                {loadingTasks ? (
                  'Memuat...'
                ) : (
                  `KERJAAN BELUM SELESAI: ${unfinishedTasks.length} tugas`
                )}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              KERJAAN HARI INI
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Daftar To-Do pekerjaan saya hari ini dan update progress target VT.
            </p>

            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center justify-between">
                <span>Total Tugas Hari Ini:</span>
                <span className="font-bold text-slate-900">{todayTasks.length} tugas</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
              Akses Modul
            </span>
            <button
              type="button"
              onClick={() => onNavigate('kerjaan-harian')}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:text-amber-700 transition-colors min-h-[44px] px-2 py-1"
            >
              <span>Buka Aplikasi</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* CARD 3: PRODUK SAMPEL */}
        <div
          id="card-app-sampel"
          className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 shadow-2xs group-hover:scale-105 transition-transform">
                <Package className="h-5 w-5" />
              </div>

              {/* Summary Sampel Belum Dikontenkan */}
              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
                {loadingSamples ? (
                  'Memuat...'
                ) : (
                  `SAMPEL BELUM DIKONTENKAN: ${unfinishedSamples.length} Produk`
                )}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              PRODUK SAMPEL
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Daftar sampel Sharing yang menjadi tanggung jawab saya.
            </p>

            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center justify-between">
                <span>Total Sampel Terdaftar:</span>
                <span className="font-bold text-slate-900">{samples.length} sampel</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
              Akses Modul
            </span>
            <button
              type="button"
              onClick={() => onNavigate('database-sampel')}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:text-purple-700 transition-colors min-h-[44px] px-2 py-1"
            >
              <span>Buka Aplikasi</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* BUG 7: PENATAAN LOKASI (Hanya ditampilkan untuk Non-Desta) */}
        {!((userProfile?.name || '').toLowerCase().includes('desta') || (employeeProfile?.name || '').toLowerCase().includes('desta') || (userProfile?.email || '').toLowerCase().includes('desta')) && (
          <div
            id="card-app-penataan-lokasi"
            className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                  Rak & Hanger
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                PENATAAN LOKASI
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Cari & atur posisi rak dan hanger sampel fisik studio.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
                Akses Modul
              </span>
              <button
                type="button"
                onClick={() => onNavigate('penataan-lokasi')}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors min-h-[44px] px-2 py-1"
              >
                <span>Buka Aplikasi</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* BUG 5 & BUG 6: DATA OMSET (Untuk Melinda / Desta / Employee yang diberi hak) */}
        {((userProfile?.name || '').toLowerCase().includes('melinda') ||
          (employeeProfile?.name || '').toLowerCase().includes('melinda') ||
          (userProfile?.name || '').toLowerCase().includes('desta') ||
          (employeeProfile?.name || '').toLowerCase().includes('desta') ||
          employeeProfile?.permissions?.canViewOmset) && (
          <div
            id="card-app-data-omset"
            className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Read-Only Performa
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                DATA OMSET & PERFORMA
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Pantau performa penjualan GMV dan komisi akun afiliasi secara berkala.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
                Akses Modul
              </span>
              <button
                type="button"
                onClick={() => onNavigate('performa-harian')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors min-h-[44px] px-2 py-1"
              >
                <span>Buka Aplikasi</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* BUG 6: INPUT KOMISI REAL (Khusus Desta / akun dengan hak input, DILARANG untuk Melinda) */}
        {(((userProfile?.name || '').toLowerCase().includes('desta') ||
          (employeeProfile?.name || '').toLowerCase().includes('desta') ||
          employeeProfile?.permissions?.canInputCommissionReal) &&
          !((userProfile?.name || '').toLowerCase().includes('melinda') ||
            (employeeProfile?.name || '').toLowerCase().includes('melinda'))) && (
          <div
            id="card-app-input-komisi"
            className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <DollarSign className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                  Input Form
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                INPUT KOMISI REAL & OMSET
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Form pencatatan omset/GMV harian dan realisasi komisi akun TikTok afiliasi.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
                Akses Modul
              </span>
              <button
                type="button"
                onClick={() => onNavigate('input-komisi-real')}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 group-hover:text-rose-700 transition-colors min-h-[44px] px-2 py-1"
              >
                <span>Buka Aplikasi</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
