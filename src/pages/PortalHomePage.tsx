import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Smartphone,
  TrendingUp,
  Users,
  Camera,
  DollarSign,
  Package,
  Boxes,
  ShoppingBag,
  ClipboardList,
  Calendar,
  Handshake,
  FileBarChart,
  Settings,
  ArrowRight,
  ShieldCheck,
  Building,
  Lock,
  Download,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeDailyPerformance } from '../services/performanceService';
import { subscribeExpenses } from '../services/expenseService';
import { subscribeTodayContent } from '../services/contentCalendarService';
import { ContentProductionDashboardWidget } from '../components/contentCalendar/ContentProductionDashboardWidget';
import { DailyPerformance, Expense, ContentCalendarItem } from '../types';
import { formatRupiah, tanggalHariIni } from '../utils/formatters';

interface PortalHomePageProps {
  onNavigate: (menuId: string, extraState?: any) => void;
}

interface PortalCard {
  id: string;
  title: string;
  icon: React.ElementType;
  desc: string;
  color: string;
  badge?: string;
  isComingSoon?: boolean;
  action: () => void;
}

export const PortalHomePage: React.FC<PortalHomePageProps> = ({ onNavigate }) => {
  const { role, userProfile, loading: authLoading, currentUser } = useAuth();
  const [performances, setPerformances] = useState<DailyPerformance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayContents, setTodayContents] = useState<ContentCalendarItem[]>([]);
  const [todayDate] = useState<string>(tanggalHariIni());

  useEffect(() => {
    if (authLoading || !currentUser || !userProfile?.active) {
      return;
    }
    
    let unsubPerf = () => {};
    let unsubExp = () => {};
    
    if (userProfile.role !== 'EMPLOYEE') {
      unsubPerf = subscribeDailyPerformance(undefined, (list) => {
        setPerformances(list);
      });
      unsubExp = subscribeExpenses(undefined, (list) => {
        setExpenses(list);
      });
    }

    const unsubCont = subscribeTodayContent((items) => {
      setTodayContents(items);
    }, userProfile || undefined);

    return () => {
      unsubPerf();
      unsubExp();
      unsubCont();
    };
  }, [authLoading, currentUser?.uid, userProfile?.role, userProfile?.active]);

  // Filter today's data from Firestore
  const todayPerformances = performances.filter((p) => p.date === todayDate);
  const todayExpenses = expenses.filter((e) => e.date === todayDate);

  const komisiRealHariIni = todayPerformances.reduce(
    (acc, curr) => acc + (Number(curr.realCommission) || 0),
    0
  );
  const uangMasukHariIni = komisiRealHariIni; // Real commission received
  const uangKeluarHariIni = todayExpenses.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const saldoBersihHariIni = uangMasukHariIni - uangKeluarHariIni;

  // 1. OWNER Cards (12 Modul Inti)
  const ownerCards: PortalCard[] = [
    {
      id: 'keuangan',
      title: 'KEUANGAN & ARUS KAS',
      icon: Wallet,
      desc: 'Dashboard keuangan, arus kas masuk, keluar dan expense.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: () => onNavigate('keuangan'),
    },
    {
      id: 'akun',
      title: 'AKUN TIKTOK & MEDSOS',
      icon: Smartphone,
      desc: 'Kelola akun Pribadi dan Sharing TikTok & Medsos.',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      action: () => onNavigate('akun'),
    },
    {
      id: 'performa-harian',
      title: 'DATA OMSET',
      icon: TrendingUp,
      desc: 'GMV, Estimasi Komisi, Komisi Real dan analisa harian per akun.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('performa-harian'),
    },
    {
      id: 'input-komisi-real',
      title: 'INPUT KOMISI REAL',
      icon: TrendingUp,
      desc: 'Input omset harian dan komisi.',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      action: () => onNavigate('input-komisi-real'),
    },

    {
      id: 'database-sampel',
      title: 'PRODUK SAMPEL',
      icon: Package,
      desc: 'Database produk affiliate & pelacakan sampel lengkap.',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => onNavigate('database-sampel'),
    },
    {
      id: 'inventory',
      title: 'INVENTARIS & ASET',
      icon: Boxes,
      desc: 'Catatan perlengkapan kantor, studio live, laptop dan kondisi aset.',
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      action: () => onNavigate('inventory'),
    },
    {
      id: 'karyawan',
      title: 'DATA KARYAWAN',
      icon: Users,
      desc: 'Data karyawan, jabatan, gaji dan informasi pekerjaan tim.',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      action: () => onNavigate('karyawan'),
    },
    {
      id: 'absensi-owner',
      title: 'ABSENSI',
      icon: Camera,
      desc: 'Absensi masuk/pulang, selfie kamera, GPS dan keterlambatan.',
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      action: () => onNavigate('absensi-owner'),
    },
    {
      id: 'penggajian',
      title: 'SALARY KARYAWAN',
      icon: DollarSign,
      desc: 'Salary bulanan, Uang Rajin mingguan, bonus dan pembayaran.',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      action: () => onNavigate('penggajian'),
    },
    {
      id: 'kerjaan-harian',
      title: 'KERJAAN HARI INI',
      icon: ClipboardList,
      desc: 'Daftar To-Do pekerjaan harian, progress dan target produksi tim.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: () => onNavigate('kerjaan-harian'),
    },
    {
      id: 'profit-sharing',
      title: 'PROFIT SHARING & INVESTOR',
      icon: Handshake,
      desc: 'Kalkulator bagi hasil, settlement bulanan, withdrawal & dashboard investor.',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => onNavigate('profit-sharing'),
    },
    {
      id: 'laporan',
      title: 'LAPORAN & REKAPITULASI',
      icon: FileBarChart,
      desc: 'Laporan keuangan, performa, rekapitulasi data dan export CSV/XLSX.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('laporan'),
    },
    {
      id: 'pengaturan',
      title: 'PENGATURAN & AUDIT',
      icon: Settings,
      desc: 'Konfigurasi kantor, user & permission, geofence, libur & audit log.',
      color: 'text-slate-700 bg-slate-100 border-slate-300',
      action: () => onNavigate('pengaturan'),
    },
  ];

  // 2. MANAGER Cards
  const managerCards: PortalCard[] = [
    {
      id: 'keuangan',
      title: 'KEUANGAN & ARUS KAS',
      icon: Wallet,
      desc: 'Dashboard keuangan dan pencatatan kas operasional.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: () => onNavigate('keuangan'),
    },
    {
      id: 'akun',
      title: 'AKUN TIKTOK & MEDSOS',
      icon: Smartphone,
      desc: 'Kelola akun media sosial dan operasional tim.',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      action: () => onNavigate('akun'),
    },
    {
      id: 'performa-harian',
      title: 'DATA OMSET',
      icon: TrendingUp,
      desc: 'GMV, Estimasi Komisi, Komisi Real akun Sharing & tim.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('performa-harian'),
    },
    {
      id: 'input-komisi-real',
      title: 'INPUT KOMISI REAL',
      icon: TrendingUp,
      desc: 'Input omset harian dan komisi.',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      action: () => onNavigate('input-komisi-real'),
    },

    {
      id: 'database-sampel',
      title: 'PRODUK SAMPEL',
      icon: Package,
      desc: 'Database produk affiliate & pelacakan sampel lengkap.',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => onNavigate('database-sampel'),
    },
    {
      id: 'inventory',
      title: 'INVENTARIS & ASET',
      icon: Boxes,
      desc: 'Catatan inventaris dan perlengkapan operasional.',
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      action: () => onNavigate('inventory'),
    },
    {
      id: 'karyawan',
      title: 'DATA KARYAWAN',
      icon: Users,
      desc: 'Data karyawan, jabatan dan informasi pekerjaan tim.',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      action: () => onNavigate('karyawan'),
    },
    {
      id: 'absensi-owner',
      title: 'ABSENSI',
      icon: Camera,
      desc: 'Absensi masuk/pulang, selfie, GPS dan rekapitulasi tim.',
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      action: () => onNavigate('absensi-owner'),
    },
    {
      id: 'kerjaan-harian',
      title: 'KERJAAN HARI INI',
      icon: ClipboardList,
      desc: 'Daftar To-Do pekerjaan harian, progress dan target produksi tim.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: () => onNavigate('kerjaan-harian'),
    },
    {
      id: 'profit-sharing',
      title: 'PROFIT SHARING & INVESTOR',
      icon: Handshake,
      desc: 'Informasi bagi hasil dan performa sharing.',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => onNavigate('profit-sharing'),
    },
    {
      id: 'laporan',
      title: 'LAPORAN & REKAPITULASI',
      icon: FileBarChart,
      desc: 'Laporan keuangan, performa akun & ekspor data.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('laporan'),
    },
  ];

  // 3. EMPLOYEE Cards (3 Modul Utama)
  const employeeCards: PortalCard[] = [
    {
      id: 'absensi-karyawan',
      title: 'ABSENSI',
      icon: Camera,
      desc: 'Absensi masuk dan pulang dengan kamera selfie & GPS.',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      action: () => onNavigate('absensi-karyawan'),
    },
    {
      id: 'kerjaan-harian',
      title: 'KERJAAN HARI INI',
      icon: ClipboardList,
      desc: 'Daftar To-Do pekerjaan saya hari ini dan update progress target VT.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: () => onNavigate('kerjaan-harian'),
    },
    {
      id: 'database-sampel',
      title: 'PRODUK SAMPEL',
      icon: Package,
      desc: 'Daftar produk afiliasi dan request sampel.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      action: () => onNavigate('database-sampel'),
    },
  ];

  // 4. INVESTOR Cards (3 Modul Utama)
  const investorCards: PortalCard[] = [
    {
      id: 'profit-sharing',
      title: 'PROFIT SHARING & INVESTOR',
      icon: Handshake,
      desc: 'Transparansi hak profit sharing investor, settlement dan withdrawal.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      action: () => onNavigate('profit-sharing'),
    },
    {
      id: 'performa-harian',
      title: 'DATA OMSET',
      icon: TrendingUp,
      desc: 'Data performa akun Sharing (GMV & Komisi).',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => onNavigate('performa-harian'),
    },
    {
      id: 'database-sampel',
      title: 'PRODUK SAMPEL',
      icon: Package,
      desc: 'Daftar sampel & produk affiliate sharing.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('database-sampel'),
    },
    {
      id: 'laporan',
      title: 'LAPORAN & REKAPITULASI',
      icon: FileBarChart,
      desc: 'Laporan Sharing transparan dan ekspor data CSV / Excel.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('laporan'),
    },
  ];

  // Select card list according to user role
  const activeCards =
    role === 'OWNER'
      ? ownerCards
      : role === 'MANAGER'
      ? managerCards
      : role === 'EMPLOYEE'
      ? employeeCards
      : investorCards;

  return (
    <div className="space-y-6 pb-12">
      {/* Portal Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white font-black text-sm shadow-xs">
                KD
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                KANTOR PT.KDRT
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Pilih aplikasi yang ingin Anda akses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Status Peran
              </div>
              <div className="text-xs font-bold text-slate-800">
                {role === 'OWNER'
                  ? '👑 Owner'
                  : role === 'MANAGER'
                  ? '💼 Manager'
                  : role === 'EMPLOYEE'
                  ? '👤 Karyawan'
                  : '📈 Investor'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Kartu Aplikasi: Desktop 3 col, Tablet 2 col, Mobile 1 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCards.map((card) => {
          const IconComp = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.isComingSoon ? undefined : card.action}
              className={`group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all flex flex-col justify-between ${
                card.isComingSoon
                  ? 'opacity-80 cursor-not-allowed bg-slate-50/60'
                  : 'hover:border-orange-400 hover:shadow-md cursor-pointer hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${card.color} shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>

                  {card.badge && (
                    <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
                  {card.isComingSoon ? 'Dalam Pengembangan' : 'Akses Modul'}
                </span>
                <button
                  type="button"
                  disabled={card.isComingSoon}
                  className={`inline-flex items-center gap-1 text-xs font-bold transition-colors ${
                    card.isComingSoon
                      ? 'text-slate-400'
                      : 'text-orange-600 group-hover:text-orange-700'
                  }`}
                >
                  <span>{card.isComingSoon ? 'Segera' : 'Buka Aplikasi'}</span>
                  {!card.isComingSoon && (
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DASHBOARD OWNER MINI SUMMARY (KEUANGAN HARI INI) */}
      {role === 'OWNER' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-tight">
                KEUANGAN HARI INI ({todayDate})
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Data terverifikasi real-time dari Firestore
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Komisi Real */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-[11px] font-semibold text-slate-500">Komisi Real</div>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {formatRupiah(komisiRealHariIni)}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-1">
                Total komisi valid hari ini
              </div>
            </div>

            {/* 2. Uang Masuk */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-[11px] font-semibold text-slate-500">Uang Masuk</div>
              <div className="text-base sm:text-lg font-black text-emerald-700 mt-1">
                {formatRupiah(uangMasukHariIni)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">
                Penerimaan kas hari ini
              </div>
            </div>

            {/* 3. Uang Keluar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-[11px] font-semibold text-slate-500">Uang Keluar</div>
              <div className="text-base sm:text-lg font-black text-rose-700 mt-1">
                {formatRupiah(uangKeluarHariIni)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">
                Total biaya operasional
              </div>
            </div>

            {/* 4. Saldo Bersih */}
            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
              <div className="text-[11px] font-bold text-orange-900">Saldo Bersih</div>
              <div
                className={`text-base sm:text-lg font-black mt-1 ${
                  saldoBersihHariIni >= 0 ? 'text-slate-900' : 'text-rose-700'
                }`}
              >
                {formatRupiah(saldoBersihHariIni)}
              </div>
              <div className="text-[10px] text-orange-800 font-medium mt-1">
                Net cashflow harian
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD PRODUKSI KONTEN (HARI INI) */}
      {(role === 'OWNER' || role === 'MANAGER') && (
        <ContentProductionDashboardWidget
          todayItems={todayContents}
          onNavigateToCalendar={() => onNavigate('jadwal-konten')}
        />
      )}
    </div>
  );
};
