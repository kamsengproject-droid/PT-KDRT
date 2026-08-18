import React, { useState, useEffect, useMemo } from 'react';
import { CurrencyInput } from '../components/CurrencyInput';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Share2,
  Lock,
  ChevronRight,
  Home,
  Calendar,
  DollarSign,
  Smartphone,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  hapusPerformaHarian,
  tambahPerformaHarian,
  subscribeDailyPerformance,
} from '../services/performanceService';
import { subscribeAccounts } from '../services/accountService';
import { Account, DailyPerformance, ScopeType } from '../types';
import {
  formatBulanTahun,
  formatRupiah,
  formatTanggal,
  tanggalHariIni,
  bulanHariIni,
} from '../utils/formatters';

interface PerformaHarianPageProps {
  onBackToPortal?: () => void;
}

export const PerformaHarianPage: React.FC<PerformaHarianPageProps> = ({ onBackToPortal }) => {
  const { userProfile, role, loading, currentUser } = useAuth();
  const isOwner = role === 'OWNER';
  const isInvestor = role === 'INVESTOR';

  const [selectedMonth, setSelectedMonth] = useState<string>(bulanHariIni());
  const [chartPeriodSharing, setChartPeriodSharing] = useState<'7_DAYS' | '30_DAYS'>('7_DAYS');
  const [chartPeriodPrivate, setChartPeriodPrivate] = useState<'7_DAYS' | '30_DAYS'>('7_DAYS');

  const [performance, setPerformance] = useState<DailyPerformance[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Account Detail Modal (Drilldown)
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<{
    account: Account;
    scope: ScopeType;
  } | null>(null);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DailyPerformance | null>(null);
  const [formData, setFormData] = useState<{
    date: string;
    accountId: string;
    accountName: string;
    scope: ScopeType;
    gmv: number | '';
    estimatedCommission: number | '';
    realCommission: number | '';
    notes: string;
  }>({
    date: tanggalHariIni(),
    accountId: '',
    accountName: '',
    scope: 'SHARING',
    gmv: '',
    estimatedCommission: '',
    realCommission: '',
    notes: '',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !userProfile?.active) {
      return;
    }
    const unsubPerf = subscribeDailyPerformance(
      isInvestor ? 'SHARING' : undefined,
      setPerformance
    );
    const unsubAcc = subscribeAccounts(
      isInvestor ? 'SHARING' : undefined,
      setAccounts
    );

    return () => {
      unsubPerf();
      unsubAcc();
    };
  }, [loading, currentUser?.uid, userProfile?.role, userProfile?.active, isInvestor]);

  // Today's date string
  const todayStr = tanggalHariIni();

  // Filtered by Selected Month
  const monthlyPerf = useMemo(() => {
    return performance.filter((p) => p.date.startsWith(selectedMonth));
  }, [performance, selectedMonth]);

  // ================= SHARING DATA =================
  const sharingAccounts = useMemo(() => {
    return accounts.filter((a) => a.scope === 'SHARING');
  }, [accounts]);

  const sharingPerfMonth = useMemo(() => {
    return monthlyPerf.filter((p) => p.scope === 'SHARING');
  }, [monthlyPerf]);

  const sharingTodayPerf = useMemo(() => {
    return performance.filter((p) => p.scope === 'SHARING' && p.date === todayStr);
  }, [performance, todayStr]);

  const sharingMetrics = useMemo(() => {
    const todayGmv = sharingTodayPerf.reduce((sum, p) => sum + (p.gmv || 0), 0);
    const todayEstimasi = sharingTodayPerf.reduce((sum, p) => sum + (p.estimatedCommission || 0), 0);
    const todayKomisiReal = sharingTodayPerf.reduce((sum, p) => sum + (p.realCommission || 0), 0);

    const monthGmv = sharingPerfMonth.reduce((sum, p) => sum + (p.gmv || 0), 0);
    const monthEstimasi = sharingPerfMonth.reduce((sum, p) => sum + (p.estimatedCommission || 0), 0);
    const monthKomisiReal = sharingPerfMonth.reduce((sum, p) => sum + (p.realCommission || 0), 0);

    return {
      todayGmv,
      todayEstimasi,
      todayKomisiReal,
      monthGmv,
      monthEstimasi,
      monthKomisiReal,
    };
  }, [sharingTodayPerf, sharingPerfMonth]);

  // ================= PRIVATE DATA =================
  const privateAccounts = useMemo(() => {
    return accounts.filter((a) => a.scope === 'PRIBADI' || (a.scope as string) === 'PRIVATE');
  }, [accounts]);

  const privatePerfMonth = useMemo(() => {
    return monthlyPerf.filter((p) => p.scope === 'PRIBADI' || (p.scope as string) === 'PRIVATE');
  }, [monthlyPerf]);

  const privateTodayPerf = useMemo(() => {
    return performance.filter(
      (p) => (p.scope === 'PRIBADI' || (p.scope as string) === 'PRIVATE') && p.date === todayStr
    );
  }, [performance, todayStr]);

  const privateMetrics = useMemo(() => {
    const todayGmv = privateTodayPerf.reduce((sum, p) => sum + (p.gmv || 0), 0);
    const todayEstimasi = privateTodayPerf.reduce((sum, p) => sum + (p.estimatedCommission || 0), 0);
    const todayKomisiReal = privateTodayPerf.reduce((sum, p) => sum + (p.realCommission || 0), 0);

    const monthGmv = privatePerfMonth.reduce((sum, p) => sum + (p.gmv || 0), 0);
    const monthEstimasi = privatePerfMonth.reduce((sum, p) => sum + (p.estimatedCommission || 0), 0);
    const monthKomisiReal = privatePerfMonth.reduce((sum, p) => sum + (p.realCommission || 0), 0);

    return {
      todayGmv,
      todayEstimasi,
      todayKomisiReal,
      monthGmv,
      monthEstimasi,
      monthKomisiReal,
    };
  }, [privateTodayPerf, privatePerfMonth]);

  // Generate Daily Trend Data for Charts
  const getTrendData = (scope: ScopeType, daysCount: number) => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const scopePerf = performance.filter((p) =>
      scope === 'SHARING'
        ? p.scope === 'SHARING'
        : p.scope === 'PRIBADI' || (p.scope as string) === 'PRIVATE'
    );

    return dates.map((dateStr) => {
      const dayRecords = scopePerf.filter((p) => p.date === dateStr);
      const gmv = dayRecords.reduce((sum, r) => sum + (r.gmv || 0), 0);
      const komisi = dayRecords.reduce((sum, r) => sum + (r.realCommission || 0), 0);
      return {
        date: dateStr,
        label: dateStr.slice(5), // "08-18"
        gmv,
        komisi,
      };
    });
  };

  const sharingTrend = useMemo(() => {
    return getTrendData('SHARING', chartPeriodSharing === '7_DAYS' ? 7 : 30);
  }, [performance, chartPeriodSharing]);

  const privateTrend = useMemo(() => {
    return getTrendData('PRIBADI', chartPeriodPrivate === '7_DAYS' ? 7 : 30);
  }, [performance, chartPeriodPrivate]);

  // Account aggregate for current month
  const getAccountAggregates = (scope: ScopeType) => {
    const accList = scope === 'SHARING' ? sharingAccounts : privateAccounts;
    const perfList = scope === 'SHARING' ? sharingPerfMonth : privatePerfMonth;

    return accList.map((acc) => {
      const records = perfList.filter((p) => p.accountId === acc.id);
      const gmv = records.reduce((sum, p) => sum + (p.gmv || 0), 0);
      const estimasi = records.reduce((sum, p) => sum + (p.estimatedCommission || 0), 0);
      const komisi = records.reduce((sum, p) => sum + (p.realCommission || 0), 0);
      const count = records.length;
      return {
        account: acc,
        gmv,
        estimasi,
        komisi,
        recordCount: count,
        latestRecord: records[0] || null,
      };
    });
  };

  const sharingAccountAggs = useMemo(() => getAccountAggregates('SHARING'), [sharingAccounts, sharingPerfMonth]);
  const privateAccountAggs = useMemo(() => getAccountAggregates('PRIBADI'), [privateAccounts, privatePerfMonth]);

  // Handlers for Add/Edit
  const handleOpenAdd = (defaultScope: ScopeType = 'SHARING') => {
    setEditingItem(null);
    setErrorMessage(null);
    const targetAccounts = defaultScope === 'SHARING' ? sharingAccounts : privateAccounts;
    const defaultAcc = targetAccounts[0] || accounts[0];

    setFormData({
      date: tanggalHariIni(),
      accountId: defaultAcc?.id || '',
      accountName: defaultAcc?.accountName || '',
      scope: isInvestor ? 'SHARING' : (defaultAcc?.scope || defaultScope),
      gmv: 0,
      estimatedCommission: 0,
      realCommission: 0,
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: DailyPerformance) => {
    setEditingItem(item);
    setErrorMessage(null);
    setFormData({
      date: item.date,
      accountId: item.accountId,
      accountName: item.accountName || '',
      scope: item.scope,
      gmv: item.gmv,
      estimatedCommission: item.estimatedCommission || 0,
      realCommission: item.realCommission || 0,
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) {
      setErrorMessage('Pilih akun medsos.');
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    try {
      const uid = userProfile?.uid || 'user';
      const name = userProfile?.name || 'User';
      await tambahPerformaHarian(formData, uid, name);
      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data performa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (window.confirm(`Hapus catatan performa "${desc}"?`)) {
      const uid = userProfile?.uid || 'user';
      const name = userProfile?.name || 'User';
      await hapusPerformaHarian(id, desc, uid, name);
    }
  };

  // Helper render simple SVG Bar Chart
  const renderTrendChart = (
    data: { date: string; label: string; gmv: number; komisi: number }[],
    colorScheme: 'emerald' | 'blue'
  ) => {
    const maxGmv = Math.max(...data.map((d) => d.gmv), 100000);
    const maxKomisi = Math.max(...data.map((d) => d.komisi), 10000);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-zinc-700">
              <span className={`h-3 w-3 rounded-md ${colorScheme === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'}`} />
              GMV Omzet
            </span>
            <span className="flex items-center gap-1.5 font-bold text-zinc-700">
              <span className="h-3 w-3 rounded-md bg-amber-500" />
              Komisi Real (Uang Masuk)
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-semibold">
            Puncak: {formatRupiah(maxGmv)}
          </span>
        </div>

        {/* Visual Bars */}
        <div className="grid grid-flow-col auto-cols-fr gap-1.5 sm:gap-2 items-end h-32 pt-4 pb-1 bg-zinc-50/60 rounded-2xl border border-zinc-100 px-2">
          {data.map((item, idx) => {
            const gmvHeight = Math.max(4, Math.round((item.gmv / maxGmv) * 100));
            const komisiHeight = Math.max(4, Math.round((item.komisi / maxKomisi) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-zinc-900 text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap shadow-lg">
                  <span className="font-bold">{formatTanggal(item.date)}</span>
                  <span>GMV: {formatRupiah(item.gmv)}</span>
                  <span className="text-amber-300 font-bold">Komisi: {formatRupiah(item.komisi)}</span>
                </div>

                <div className="w-full flex items-end justify-center gap-0.5 h-24">
                  {/* GMV Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      colorScheme === 'emerald'
                        ? 'bg-emerald-500 hover:bg-emerald-400'
                        : 'bg-blue-500 hover:bg-blue-400'
                    }`}
                    style={{ height: `${gmvHeight}%` }}
                  />
                  {/* Komisi Bar */}
                  <div
                    className="w-full rounded-t-md bg-amber-500 hover:bg-amber-400 transition-all"
                    style={{ height: `${komisiHeight}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-zinc-500 truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-3">
        <nav className="flex items-center space-x-1.5 text-xs text-zinc-500 font-medium">
          <button
            onClick={onBackToPortal}
            className="flex items-center gap-1 hover:text-emerald-600 font-bold transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>KANTOR PT.KDRT</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-bold text-zinc-900">PERFORMA AKUN</span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-zinc-200 px-3 py-1.5 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-none bg-transparent text-xs font-black text-zinc-900 focus:outline-none cursor-pointer"
            />
          </div>

          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Kembali</span>
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-2.5">
            <TrendingUp className="h-7 w-7 text-emerald-600" />
            Performa Harian (GMV & Komisi Real)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Pencatatan omzet GMV dan Komisi Real harian. <strong>Komisi Real = Uang Masuk</strong> (tercatat di Arus Kas).
          </p>
        </div>

        {!isInvestor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdd('SHARING')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-500 transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Input Performa Sharing
            </button>
            <button
              onClick={() => handleOpenAdd('PRIBADI')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Input Performa Pribadi
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PERFORMA HARIAN — SHARING (INVESTOR & KANTOR) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border-2 border-emerald-300/80 bg-white p-5 sm:p-7 shadow-sm space-y-6">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                  PERFORMA HARIAN — SHARING
                </h2>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 border border-emerald-200">
                  Investor & Kantor
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Omzet & Komisi Real akun affiliate yang masuk dalam pembagian profit sharing investor.
              </p>
            </div>
          </div>
        </div>

        {/* KPIs Sharing Hari Ini & Bulan Ini */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: GMV */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              GMV HARI INI ({formatTanggal(todayStr)})
            </span>
            <p className="text-2xl font-black text-zinc-900">{formatRupiah(sharingMetrics.todayGmv)}</p>
            <div className="pt-2 border-t border-zinc-100 flex justify-between text-xs text-zinc-500 font-medium">
              <span>Total Bulan {formatBulanTahun(selectedMonth)}:</span>
              <strong className="text-zinc-900 font-bold">{formatRupiah(sharingMetrics.monthGmv)}</strong>
            </div>
          </div>

          {/* Card 2: Estimasi Komisi */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              ESTIMASI KOMISI HARI INI
            </span>
            <p className="text-2xl font-black text-zinc-700">{formatRupiah(sharingMetrics.todayEstimasi)}</p>
            <div className="pt-2 border-t border-zinc-100 flex justify-between text-xs text-zinc-500 font-medium">
              <span>Estimasi Bulan Ini:</span>
              <strong className="text-zinc-700 font-bold">{formatRupiah(sharingMetrics.monthEstimasi)}</strong>
            </div>
          </div>

          {/* Card 3: Komisi Real (Uang Masuk) */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                KOMISI REAL HARI INI (UANG MASUK)
              </span>
              <span className="rounded-md bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5">
                INCOME SHARING
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900">
              {formatRupiah(sharingMetrics.todayKomisiReal)}
            </p>
            <div className="pt-2 border-t border-emerald-200 flex justify-between text-xs text-emerald-800 font-medium">
              <span>Total Uang Masuk Bulan Ini:</span>
              <strong className="text-emerald-950 font-black">{formatRupiah(sharingMetrics.monthKomisiReal)}</strong>
            </div>
          </div>
        </div>

        {/* Grafik Tren Performa Sharing */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-emerald-600" />
              Grafik Tren GMV & Komisi Real Sharing
            </h3>
            <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1 text-xs">
              <button
                onClick={() => setChartPeriodSharing('7_DAYS')}
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  chartPeriodSharing === '7_DAYS'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => setChartPeriodSharing('30_DAYS')}
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  chartPeriodSharing === '30_DAYS'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                30 Hari
              </button>
            </div>
          </div>

          {renderTrendChart(sharingTrend, 'emerald')}
        </div>

        {/* Daftar Akun Sharing & Pencapaian */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-900">
              Daftar Akun Sharing & Perolehan Bulan {formatBulanTahun(selectedMonth)}
            </h3>
            <span className="text-xs text-zinc-400 font-semibold">
              {sharingAccountAggs.length} Akun Sharing
            </span>
          </div>

          {sharingAccountAggs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/20 p-8 text-center text-xs text-zinc-400">
              Belum ada akun sharing terdaftar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharingAccountAggs.map((item) => (
                <div
                  key={item.account.id}
                  className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-sm text-zinc-900">{item.account.accountName}</h4>
                        <span className="text-xs text-zinc-500 font-medium">@{item.account.username}</span>
                      </div>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5">
                        SHARING
                      </span>
                    </div>

                    <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">GMV Bulan Ini:</span>
                        <strong className="text-zinc-900 font-bold">{formatRupiah(item.gmv)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Estimasi Komisi:</span>
                        <span className="text-zinc-700 font-semibold">{formatRupiah(item.estimasi)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-emerald-200">
                        <span className="text-emerald-800 font-bold">Komisi Real (Uang Masuk):</span>
                        <strong className="text-emerald-900 font-black">{formatRupiah(item.komisi)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400">
                      {item.recordCount} entri catatan
                    </span>
                    <button
                      onClick={() => setSelectedAccountForDetail({ account: item.account, scope: 'SHARING' })}
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" /> Analisis Akun
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabel Rincian Input Harian Sharing */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
          <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">
              Riwayat Input Performa Harian Sharing ({formatBulanTahun(selectedMonth)})
            </h4>
            <span className="text-xs text-zinc-400 font-bold">{sharingPerfMonth.length} Baris</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-100">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Akun Medsos</th>
                  <th className="px-4 py-3">GMV (Rp)</th>
                  <th className="px-4 py-3">Estimasi Komisi</th>
                  <th className="px-4 py-3">Komisi Real (Uang Masuk)</th>
                  <th className="px-4 py-3">Catatan</th>
                  {!isInvestor && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {sharingPerfMonth.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 font-medium">
                      Belum ada catatan performa sharing di bulan {formatBulanTahun(selectedMonth)}.
                    </td>
                  </tr>
                ) : (
                  sharingPerfMonth.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-zinc-900">{formatTanggal(item.date)}</td>
                      <td className="px-4 py-3 font-medium text-zinc-800">{item.accountName}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900">{formatRupiah(item.gmv)}</td>
                      <td className="px-4 py-3 text-zinc-600">{formatRupiah(item.estimatedCommission || 0)}</td>
                      <td className="px-4 py-3 font-black text-emerald-700">{formatRupiah(item.realCommission)}</td>
                      <td className="px-4 py-3 text-zinc-500">{item.notes || '-'}</td>
                      {!isInvestor && (
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
                            title="Edit Performa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(item.id!, `${item.accountName} (${item.date})`)}
                              className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PERFORMA HARIAN — PRIBADI (OWNER PT.KDRT ONLY) */}
      {/* ========================================================================= */}
      {!isInvestor && (
        <div className="rounded-3xl border-2 border-blue-300/80 bg-white p-5 sm:p-7 shadow-sm space-y-6">
          {/* Section Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                    PERFORMA HARIAN — PRIBADI
                  </h2>
                  <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 border border-blue-200">
                    Owner PT.KDRT (Private)
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Omzet & Komisi Real akun pribadi owner, 100% terisolasi dari profit sharing investor.
                </p>
              </div>
            </div>
          </div>

          {/* KPIs Pribadi Hari Ini & Bulan Ini */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Card 1: GMV */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                GMV HARI INI ({formatTanggal(todayStr)})
              </span>
              <p className="text-2xl font-black text-zinc-900">{formatRupiah(privateMetrics.todayGmv)}</p>
              <div className="pt-2 border-t border-zinc-100 flex justify-between text-xs text-zinc-500 font-medium">
                <span>Total Bulan {formatBulanTahun(selectedMonth)}:</span>
                <strong className="text-zinc-900 font-bold">{formatRupiah(privateMetrics.monthGmv)}</strong>
              </div>
            </div>

            {/* Card 2: Estimasi Komisi */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                ESTIMASI KOMISI HARI INI
              </span>
              <p className="text-2xl font-black text-zinc-700">{formatRupiah(privateMetrics.todayEstimasi)}</p>
              <div className="pt-2 border-t border-zinc-100 flex justify-between text-xs text-zinc-500 font-medium">
                <span>Estimasi Bulan Ini:</span>
                <strong className="text-zinc-700 font-bold">{formatRupiah(privateMetrics.monthEstimasi)}</strong>
              </div>
            </div>

            {/* Card 3: Komisi Real (Uang Masuk) */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-4 sm:p-5 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-800">
                  KOMISI REAL HARI INI (UANG MASUK)
                </span>
                <span className="rounded-md bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5">
                  INCOME PRIVATE
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-blue-900">
                {formatRupiah(privateMetrics.todayKomisiReal)}
              </p>
              <div className="pt-2 border-t border-blue-200 flex justify-between text-xs text-blue-800 font-medium">
                <span>Total Uang Masuk Bulan Ini:</span>
                <strong className="text-blue-950 font-black">{formatRupiah(privateMetrics.monthKomisiReal)}</strong>
              </div>
            </div>
          </div>

          {/* Grafik Tren Performa Pribadi */}
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-600" />
                Grafik Tren GMV & Komisi Real Pribadi
              </h3>
              <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setChartPeriodPrivate('7_DAYS')}
                  className={`rounded-lg px-3 py-1 font-bold transition-all ${
                    chartPeriodPrivate === '7_DAYS'
                      ? 'bg-white text-zinc-900 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  7 Hari Terakhir
                </button>
                <button
                  onClick={() => setChartPeriodPrivate('30_DAYS')}
                  className={`rounded-lg px-3 py-1 font-bold transition-all ${
                    chartPeriodPrivate === '30_DAYS'
                      ? 'bg-white text-zinc-900 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  30 Hari
                </button>
              </div>
            </div>

            {renderTrendChart(privateTrend, 'blue')}
          </div>

          {/* Daftar Akun Pribadi & Pencapaian */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900">
                Daftar Akun Pribadi & Perolehan Bulan {formatBulanTahun(selectedMonth)}
              </h3>
              <span className="text-xs text-zinc-400 font-semibold">
                {privateAccountAggs.length} Akun Pribadi
              </span>
            </div>

            {privateAccountAggs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/20 p-8 text-center text-xs text-zinc-400">
                Belum ada akun pribadi terdaftar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {privateAccountAggs.map((item) => (
                  <div
                    key={item.account.id}
                    className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs hover:border-blue-400 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-sm text-zinc-900">{item.account.accountName}</h4>
                          <span className="text-xs text-zinc-500 font-medium">@{item.account.username}</span>
                        </div>
                        <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5">
                          PRIBADI
                        </span>
                      </div>

                      <div className="bg-blue-50/40 rounded-xl p-3 border border-blue-100 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">GMV Bulan Ini:</span>
                          <strong className="text-zinc-900 font-bold">{formatRupiah(item.gmv)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Estimasi Komisi:</span>
                          <span className="text-zinc-700 font-semibold">{formatRupiah(item.estimasi)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-blue-200">
                          <span className="text-blue-800 font-bold">Komisi Real (Uang Masuk):</span>
                          <strong className="text-blue-900 font-black">{formatRupiah(item.komisi)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-400">
                        {item.recordCount} entri catatan
                      </span>
                      <button
                        onClick={() => setSelectedAccountForDetail({ account: item.account, scope: 'PRIBADI' })}
                        className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" /> Analisis Akun
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabel Rincian Input Harian Pribadi */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
            <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">
                Riwayat Input Performa Harian Pribadi ({formatBulanTahun(selectedMonth)})
              </h4>
              <span className="text-xs text-zinc-400 font-bold">{privatePerfMonth.length} Baris</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-100">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Akun Medsos</th>
                    <th className="px-4 py-3">GMV (Rp)</th>
                    <th className="px-4 py-3">Estimasi Komisi</th>
                    <th className="px-4 py-3">Komisi Real (Uang Masuk)</th>
                    <th className="px-4 py-3">Catatan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {privatePerfMonth.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 font-medium">
                        Belum ada catatan performa pribadi di bulan {formatBulanTahun(selectedMonth)}.
                      </td>
                    </tr>
                  ) : (
                    privatePerfMonth.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-zinc-900">{formatTanggal(item.date)}</td>
                        <td className="px-4 py-3 font-medium text-zinc-800">{item.accountName}</td>
                        <td className="px-4 py-3 font-semibold text-zinc-900">{formatRupiah(item.gmv)}</td>
                        <td className="px-4 py-3 text-zinc-600">{formatRupiah(item.estimatedCommission || 0)}</td>
                        <td className="px-4 py-3 font-black text-blue-700">{formatRupiah(item.realCommission)}</td>
                        <td className="px-4 py-3 text-zinc-500">{item.notes || '-'}</td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
                            title="Edit Performa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(item.id!, `${item.accountName} (${item.date})`)}
                              className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ANALISIS PER AKUN (DRILLDOWN) ================= */}
      {selectedAccountForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl border border-zinc-200 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-zinc-900">
                    Analisis Performa: {selectedAccountForDetail.account.accountName}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      selectedAccountForDetail.scope === 'SHARING'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedAccountForDetail.scope}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  @{selectedAccountForDetail.account.username} • PIC: {selectedAccountForDetail.account.managerName || '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedAccountForDetail(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Riwayat 7 Hari Akun ini */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-zinc-600">
                Riwayat Catatan Harian Bulan Ini ({formatBulanTahun(selectedMonth)})
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-100">
                    <tr>
                      <th className="px-4 py-2.5">Tanggal</th>
                      <th className="px-4 py-2.5">GMV</th>
                      <th className="px-4 py-2.5">Estimasi</th>
                      <th className="px-4 py-2.5">Komisi Real</th>
                      <th className="px-4 py-2.5">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {monthlyPerf
                      .filter((p) => p.accountId === selectedAccountForDetail.account.id)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2 font-bold text-zinc-900">{formatTanggal(p.date)}</td>
                          <td className="px-4 py-2 font-medium">{formatRupiah(p.gmv)}</td>
                          <td className="px-4 py-2 text-zinc-500">{formatRupiah(p.estimatedCommission || 0)}</td>
                          <td className="px-4 py-2 font-black text-emerald-700">{formatRupiah(p.realCommission)}</td>
                          <td className="px-4 py-2 text-zinc-400">{p.notes || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAccountForDetail(null)}
                className="rounded-xl bg-zinc-900 text-white px-5 py-2.5 text-xs font-bold"
              >
                Tutup Analisis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INPUT / EDIT PERFORMA ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                {editingItem ? 'Edit Performa Harian' : 'Tambah Performa Harian'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Pilih Akun Medsos *</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value);
                    setFormData({
                      ...formData,
                      accountId: e.target.value,
                      accountName: acc?.accountName || '',
                      scope: acc?.scope || 'SHARING',
                    });
                  }}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                >
                  <option value="">-- Pilih Akun --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.scope})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Scope Terdeteksi</label>
                  <input
                    type="text"
                    disabled
                    value={formData.scope}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 p-2.5 font-black text-zinc-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">GMV Omzet (Rp) *</label>
                  <CurrencyInput
                    required
                    value={formData.gmv}
                    onChange={(val) => setFormData({ ...formData, gmv: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Estimasi Komisi (Rp)</label>
                  <CurrencyInput
                    value={formData.estimatedCommission}
                    onChange={(val) => setFormData({ ...formData, estimatedCommission: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-800 mb-1">Komisi Real / Uang Masuk (Rp) *</label>
                  <CurrencyInput
                    required
                    value={formData.realCommission}
                    onChange={(val) => setFormData({ ...formData, realCommission: val })}
                    className="w-full rounded-xl border-2 border-emerald-400 bg-emerald-50/40 p-2.5 font-black text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan live streaming / video viral..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 font-black shadow-md cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'SIMPAN PERFORMA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
