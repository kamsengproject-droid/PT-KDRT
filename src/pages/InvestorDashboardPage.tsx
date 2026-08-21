import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  Building,
  Home,
  Layers,
  Sparkles,
  Info,
  X,
  CreditCard,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';
import { Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeProfitSharingSettlements,
  subscribeWithdrawals,
  calculateProfitSharingFromTransactions,
  ProfitSharingCalculationResult,
} from '../services/profitSharingService';
import { subscribeTransactions } from '../services/transactionService';
import { subscribeDailyPerformance } from '../services/performanceService';
import { subscribeProducts } from '../services/productService';
import { subscribeAccounts } from '../services/accountService';
import { DailyPerformance, Product, Account } from '../types';
import {
  formatRupiah,
  formatTanggal,
  formatBulanTahun,
  bulanHariIni,
  tanggalHariIni,
  tanggalKemarin,
} from '../utils/formatters';
import {
  ProfitSharingSettlement,
  InvestorWithdrawal,
  FinancialTransaction,
} from '../types';

interface InvestorDashboardPageProps {
  onBackToPortal?: () => void;
}

export const InvestorDashboardPage: React.FC<InvestorDashboardPageProps> = ({
  onBackToPortal,
}) => {
  const { userProfile, role, loading: authLoading, currentUser } = useAuth();

  // Period filter
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(bulanHariIni());
  const [year, setYear] = useState<number>(parseInt(bulanHariIni().split('-')[0], 10));
  const [month, setMonth] = useState<string>(bulanHariIni().split('-')[1]);

  // Subscribed data
  const [settlements, setSettlements] = useState<ProfitSharingSettlement[]>([]);
  const [withdrawals, setWithdrawals] = useState<InvestorWithdrawal[]>([]);
  const [sharingTransactions, setSharingTransactions] = useState<FinancialTransaction[]>([]);
  const [performances, setPerformances] = useState<DailyPerformance[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Live calculation for selected month
  const [liveCalc, setLiveCalc] = useState<ProfitSharingCalculationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal preview receipt image
  
  const [showIncomeDetail, setShowIncomeDetail] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedSettlementDetail, setSelectedSettlementDetail] =
    useState<ProfitSharingSettlement | null>(null);

  // Handle month change
  const handleMonthChange = (val: string) => {
    setSelectedMonthStr(val);
    const [y, m] = val.split('-');
    setYear(parseInt(y, 10));
    setMonth(m);
  };

  // Subscriptions (Strictly SHARING only)
  useEffect(() => {
    if (authLoading || !currentUser || !userProfile?.active) {
      return;
    }
    const unsubSet = subscribeProfitSharingSettlements(setSettlements);
    const unsubWith = subscribeWithdrawals(setWithdrawals);

    // Subscribe to transactions strictly scoped to SHARING
    const unsubTx = subscribeTransactions(
      { scope: 'SHARING', status: 'ACTIVE' },
      setSharingTransactions
    );
    const unsubPerf = subscribeDailyPerformance('SHARING', setPerformances);
    const unsubProd = subscribeProducts({ scope: 'SHARING' }, setProducts);
    const unsubAcc = subscribeAccounts('SHARING', setAccounts);

    return () => {
      unsubSet();
      unsubWith();
      unsubTx();
      unsubPerf();
      unsubProd();
      unsubAcc();
    };
  }, [authLoading, currentUser?.uid, userProfile?.role, userProfile?.active]);

  // Compute live calculation when month changes
  useEffect(() => {
    if (authLoading || !currentUser || !userProfile?.active) {
      return;
    }
    let isMounted = true;
    setLoading(true);
    calculateProfitSharingFromTransactions(year, month)
      .then((res) => {
        if (isMounted) {
          setLiveCalc(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error calculating investor dashboard:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, currentUser?.uid, userProfile?.role, userProfile?.active, year, month]);

  // Active settlement for current month if approved
  const currentMonthSettlement = useMemo(() => {
    const monthKey = `${year}_${month}_SHARING`;
    return settlements.find((s) => s.settlementId === monthKey && s.status !== 'VOID');
  }, [settlements, year, month]);

  // Aggregated Expenses for current selected month (Grouped by Category)
  const aggregatedExpenses = useMemo(() => {
    const periodPrefix = `${year}-${month.padStart(2, '0')}`;
    const categoryTotals: Record<string, number> = {};

    sharingTransactions.forEach((tx) => {
      if (tx.type === 'EXPENSE' && tx.date?.startsWith(periodPrefix)) {
        const cat = tx.category || 'OPERASIONAL';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(tx.amount) || 0);
      }
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [sharingTransactions, year, month]);

  // Performance metrics for current month, today, and yesterday (WIB Asia/Jakarta)
  const {
    gmvHariIni,
    komisiRealHariIni,
    komisiEstimasiHariIni,
    gmvKemarin,
    komisiRealKemarin,
    komisiEstimasiKemarin,
    gmvBulanIni,
    komisiRealBulanIni,
    komisiEstimasiBulanIni,
  } = useMemo(() => {
    const today = tanggalHariIni();
    const yesterday = tanggalKemarin();
    const periodPrefix = `${year}-${month.padStart(2, '0')}`;
    
    let gHariIni = 0;
    let kRealHariIni = 0;
    let kEstHariIni = 0;

    let gKemarin = 0;
    let kRealKemarin = 0;
    let kEstKemarin = 0;

    let gBulanIni = 0;
    let kRealBulanIni = 0;
    let kEstBulanIni = 0;

    performances.forEach((p) => {
      if (p.date === today) {
        gHariIni += p.gmv || 0;
        kRealHariIni += p.commissionReal || 0;
        kEstHariIni += p.commissionEstimated || 0;
      }
      if (p.date === yesterday) {
        gKemarin += p.gmv || 0;
        kRealKemarin += p.commissionReal || 0;
        kEstKemarin += p.commissionEstimated || 0;
      }
      if (p.date?.startsWith(periodPrefix)) {
        gBulanIni += p.gmv || 0;
        kRealBulanIni += p.commissionReal || 0;
        kEstBulanIni += p.commissionEstimated || 0;
      }
    });

    return {
      gmvHariIni: gHariIni,
      komisiRealHariIni: kRealHariIni,
      komisiEstimasiHariIni: kEstHariIni,
      gmvKemarin: gKemarin,
      komisiRealKemarin: kRealKemarin,
      komisiEstimasiKemarin: kEstKemarin,
      gmvBulanIni: gBulanIni,
      komisiRealBulanIni: kRealBulanIni,
      komisiEstimasiBulanIni: kEstBulanIni,
    };
  }, [performances, year, month]);

    // DEBUG LOG SEMENTARA
  useEffect(() => {
    if (userProfile?.role === 'INVESTOR') {
      console.log('[INVESTOR_DEBUG]', {
        'Firebase UID': currentUser?.uid,
        'Role': userProfile?.role,
        'Selected Period': `${year}-${month.padStart(2, '0')}`,
        'Income Query Result Count': sharingTransactions.filter(t => t.type === 'INCOME').length,
        'Expense Query Result Count': sharingTransactions.filter(t => t.type === 'EXPENSE').length,
        'Performance Query Result Count': performances.length,
        'Account Query Result Count': accounts.length,
        'Investor Settlement Result Count': settlements.length
      });
    }
  }, [currentUser?.uid, userProfile?.role, year, month, sharingTransactions, performances, accounts, settlements]);

  // All-time Cumulative Investor metrics
  const totalHakSemuaPeriode = useMemo(() => {
    return settlements
      .filter((s) => s.status === 'APPROVED' || s.status === 'PARTIALLY_PAID' || s.status === 'PAID')
      .reduce((sum, s) => sum + (s.investorAmount || 0), 0);
  }, [settlements]);

  const totalDiterimaSemuaPeriode = useMemo(() => {
    return withdrawals
      .filter((w) => w.status === 'PAID')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [withdrawals]);

  const totalSisaHakKewajiban = Math.max(0, totalHakSemuaPeriode - totalDiterimaSemuaPeriode);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Periode',
      'Uang Masuk Sharing (Rp)',
      'Pengeluaran Sharing (Rp)',
      'Hak Investor (45%)',
      'Telah Dibayar (Rp)',
      'Sisa Belum Diterima (Rp)',
      'Status Settlement',
    ];

    const rows = settlements
      .filter((s) => s.status !== 'VOID')
      .map((s) => [
        s.periodLabel,
        s.totalIncome,
        s.totalExpense,
        s.investorAmount,
        s.totalPaidToInvestor || 0,
        s.remainingInvestorObligation || 0,
        s.status,
      ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Investor_Sharing_PT_KDRT_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-3">
        <nav className="flex items-center space-x-1.5 text-xs text-zinc-500 font-medium">
          <button
            onClick={onBackToPortal}
            className="flex items-center gap-1 hover:text-blue-600 font-bold transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>KANTOR PT.KDRT</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-bold text-zinc-900">PORTAL INVESTOR</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-bold text-blue-600">DASHBOARD SHARING & BAGI HASIL</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Laporan</span>
          </button>

          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-blue-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-400/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
              INVESTOR DASHBOARD • READ ONLY
            </span>
            <span className="text-xs text-blue-200 font-medium">PT. KARYA DIGITAL RAKYAT TERPADU</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Transparansi Keuangan Kategori Sharing
          </h2>
          <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
            Data terisolasi khusus kategori <strong>SHARING</strong> berdasarkan uang kas masuk dan keluar nyata. Laporan ini menjamin transparansi hak bagi hasil investor (45%) secara akurat dan tepat waktu.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/20 p-2 shrink-0">
          <Calendar className="h-4 w-4 text-blue-200 ml-1" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-blue-300">Pilih Periode:</span>
            <input
              type="month"
              value={selectedMonthStr}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="rounded-lg border border-white/20 bg-blue-950/80 px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      {/* 1. Primary KPI Metrics for Selected Month */}
      {liveCalc && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => setShowIncomeDetail(true)}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-2xs cursor-pointer hover:bg-emerald-100/60 transition-colors"
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-black uppercase tracking-wider">
                UANG MASUK SHARING
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-2">
              {formatRupiah(liveCalc.totalIncome)}
            </div>
            <div className="text-[11px] font-medium text-emerald-700 mt-1">
              Periode {formatBulanTahun(selectedMonthStr)}
            </div>
          </div>

          <div 
            onClick={() => setShowExpenseDetail(true)}
            className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-2xs cursor-pointer hover:bg-rose-100/60 transition-colors"
          >
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-[11px] font-black uppercase tracking-wider">
                PENGELUARAN SHARING
              </span>
              <DollarSign className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-950 mt-2">
              {formatRupiah(liveCalc.totalExpense)}
            </div>
            <div className="text-[11px] font-medium text-rose-700 mt-1">
              Biaya Operasional & Inventory
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-blue-800">
              <span className="text-[11px] font-black uppercase tracking-wider">
                HAK INVESTOR ({liveCalc.investorPercentage}%)
              </span>
              <PieChart className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-950 mt-2">
              {formatRupiah(
                currentMonthSettlement
                  ? currentMonthSettlement.investorAmount
                  : liveCalc.investorAmount
              )}
            </div>
            <div className="text-[11px] font-medium text-blue-700 mt-1">
              {currentMonthSettlement
                ? `Status: ${currentMonthSettlement.status}`
                : 'Estimasi Berjalan (Draft)'}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-black uppercase tracking-wider">
                SISA BELUM DITERIMA
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 mt-2">
              {formatRupiah(
                currentMonthSettlement?.remainingInvestorObligation !== undefined
                  ? currentMonthSettlement.remainingInvestorObligation
                  : liveCalc.investorAmount
              )}
            </div>
            <div className="text-[11px] font-medium text-amber-700 mt-1">
              Kewajiban Belum Ditransfer
            </div>
          </div>
        </div>
      )}

      {/* 1.5 Performance Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Performa Penjualan & Komisi Sharing (WIB Asia/Jakarta)</span>
          </h3>
          <span className="text-[11px] font-semibold text-zinc-500">
            Sumber Data: Catatan Kinerja Harian Terverifikasi
          </span>
        </div>

        {/* Grid Harian & Bulanan: Fokus Kemarin (H-1) & Akumulasi Bulan Ini */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. GMV Kemarin (WIB H-1) */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">
                GMV KEMARIN
              </span>
              <span className="text-[9px] font-black bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                H-1 WIB
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-950 mt-1">
              {formatRupiah(gmvKemarin)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Omset Penjualan Kemarin ({formatTanggal(tanggalKemarin())})
            </span>
          </div>

          {/* 2. Komisi Real Kemarin (WIB H-1) */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                KOMISI REAL KEMARIN
              </span>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                REAL H-1
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-950 mt-1">
              {komisiRealKemarin > 0 ? (
                formatRupiah(komisiRealKemarin)
              ) : (
                <span className="text-xs font-bold text-amber-700 block leading-tight">
                  DATA KOMISI AKTUAL BELUM TERSEDIA
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              {komisiRealKemarin > 0
                ? `Komisi Sah Kemarin (${formatTanggal(tanggalKemarin())})`
                : 'Data komisi aktual kemarin belum diinput'}
            </span>
          </div>

          {/* 3. GMV Bulan Ini */}
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">
                GMV BULAN INI
              </span>
              <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                BULANAN
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-950 mt-1">
              {formatRupiah(gmvBulanIni)}
            </div>
            <span className="text-[10px] text-blue-700 font-medium">
              Akumulasi Omset {formatBulanTahun(selectedMonthStr)}
            </span>
          </div>

          {/* 4. Komisi Real Bulan Ini */}
          <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-indigo-800 tracking-wider">
                KOMISI REAL BULAN INI
              </span>
              <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
                AKUMULASI
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-indigo-950 mt-1">
              {komisiRealBulanIni > 0 ? (
                formatRupiah(komisiRealBulanIni)
              ) : komisiEstimasiBulanIni > 0 ? (
                <span className="text-amber-800 text-base font-bold">
                  {formatRupiah(komisiEstimasiBulanIni)}{' '}
                  <span className="text-[10px] font-medium text-amber-700">(Est)</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-zinc-400">DATA KOMISI AKTUAL BELUM TERSEDIA</span>
              )}
            </div>
            <span className="text-[10px] text-indigo-700 font-medium">
              Periode {formatBulanTahun(selectedMonthStr)}
            </span>
          </div>
        </div>
      </div>

      {/* 1.6 Products & Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
               <Layers className="h-4 w-4 text-blue-600" />
               Produk Sharing Aktif
             </h3>
             <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{products.length}</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
             {products.slice(0, 5).map(p => (
               <div key={p.id} className="text-xs flex justify-between p-2 bg-zinc-50 border border-zinc-100 rounded-lg">
                 <span className="font-semibold text-zinc-700">{p.name}</span>
                 <span className="text-zinc-500">{formatRupiah(p.price)}</span>
               </div>
             ))}
             {products.length === 0 && <div className="text-xs text-zinc-400 p-2 text-center">Belum ada produk.</div>}
             {products.length > 5 && <div className="text-xs text-center text-blue-600 font-bold mt-2">+{products.length - 5} lainnya</div>}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
               <Building className="h-4 w-4 text-rose-600" />
               Akun Sharing Aktif
             </h3>
             <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">{accounts.length}</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
             {accounts.slice(0, 5).map(a => (
               <div key={a.id} className="text-xs flex justify-between p-2 bg-zinc-50 border border-zinc-100 rounded-lg">
                 <span className="font-semibold text-zinc-700">{a.name}</span>
                 <span className="text-zinc-500">{a.platform}</span>
               </div>
             ))}
             {accounts.length === 0 && <div className="text-xs text-zinc-400 p-2 text-center">Belum ada akun.</div>}
             {accounts.length > 5 && <div className="text-xs text-center text-rose-600 font-bold mt-2">+{accounts.length - 5} lainnya</div>}
          </div>
        </div>
      </div>


      {/* 2. Cumulative All-Time Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
          <Building className="h-4 w-4 text-blue-600" />
          Akumulasi Hak & Realisasi Pembayaran (Semua Periode)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">
              Total Hak Investor Terverifikasi
            </span>
            <span className="text-xl font-black text-zinc-900 mt-1 block">
              {formatRupiah(totalHakSemuaPeriode)}
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
              Total Telah Diterima (Transfer)
            </span>
            <span className="text-xl font-black text-emerald-950 mt-1 block">
              {formatRupiah(totalDiterimaSemuaPeriode)}
            </span>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">
              Total Sisa Hak Akumulatif
            </span>
            <span className="text-xl font-black text-amber-950 mt-1 block">
              {formatRupiah(totalSisaHakKewajiban)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Aggregated Expenses Breakdown for Selected Month */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <PieChart className="h-4 w-4 text-rose-600" />
          Rincian Pengeluaran Sharing Teragregasi ({formatBulanTahun(selectedMonthStr)})
        </h3>
        <p className="text-xs text-zinc-500">
          Ringkasan biaya operasional, gaji, sampel, dan perlengkapan untuk kategori Sharing.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {aggregatedExpenses.map((item) => (
            <div
              key={item.category}
              className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col justify-between"
            >
              <span className="text-[10px] font-bold uppercase text-zinc-500">
                {item.category}
              </span>
              <span className="text-sm font-black text-rose-700 mt-1">
                {formatRupiah(item.amount)}
              </span>
            </div>
          ))}

          {aggregatedExpenses.length === 0 && (
            <div className="col-span-full py-4 text-center text-zinc-400 text-xs">
              Belum ada data pengeluaran sharing tercatat untuk periode ini.
            </div>
          )}
        </div>
      </div>

      {/* 4. Table Riwayat Settlement Sharing Bulanan */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-purple-600" />
              Rekap Settlement Bagi Hasil Bulanan
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar rekapitulasi perhitungan bagi hasil bulanan PT.KDRT.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-black uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Uang Masuk Sharing</th>
                  <th className="py-3 px-4">Pengeluaran Sharing</th>
                  <th className="py-3 px-4">Hak Investor (45%)</th>
                  <th className="py-3 px-4">Terbayar</th>
                  <th className="py-3 px-4">Sisa Belum Diterima</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {settlements
                  .filter((s) => s.status !== 'VOID')
                  .map((s) => (
                    <tr key={s.id || s.settlementId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900">{s.periodLabel}</td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">
                        {formatRupiah(s.totalIncome)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-700">
                        {formatRupiah(s.totalExpense)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-blue-900">
                        {formatRupiah(s.investorAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        {formatRupiah(s.totalPaidToInvestor || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-amber-700">
                        {formatRupiah(
                          s.remainingInvestorObligation !== undefined
                            ? s.remainingInvestorObligation
                            : s.investorAmount
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            s.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : s.status === 'PAID'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : s.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedSettlementDetail(s)}
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors"
                          title="Lihat Rincian"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                {settlements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-400 text-xs">
                      Belum ada rekap settlement bagi hasil.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Table Riwayat Penerimaan Dana / Withdrawal Investor */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Riwayat Penerimaan Transfer / Penarikan Dana
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Bukti transfer dan realisasi pembayaran hak investor oleh manajemen PT.KDRT.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-black uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Tanggal Transfer</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Nominal Diterima</th>
                  <th className="py-3 px-4">Metode & Rekening</th>
                  <th className="py-3 px-4 text-center">Bukti Transfer</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {withdrawals
                  .filter((w) => w.status !== 'VOID')
                  .map((w) => (
                    <tr key={w.id || w.withdrawalId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900">
                        {formatTanggal(w.date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-900">{w.periodLabel}</td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">
                        {formatRupiah(w.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        <span className="font-bold text-zinc-900">{w.paymentMethod}</span>
                        {w.bankAccount && (
                          <span className="text-[10px] text-zinc-400 block">{w.bankAccount}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {w.receiptUrl ? (
                          <button
                            onClick={() => setPreviewImageUrl(w.receiptUrl!)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>Lihat Bukti</span>
                          </button>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                      Belum ada riwayat pembayaran transfer yang diterima.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Preview Gambar Bukti Transfer */}
      
      {/* Income Detail Modal */}
      {showIncomeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-zinc-200 flex flex-col h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                  SUMBER UANG MASUK SHARING
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Detail pendapatan untuk periode {formatBulanTahun(selectedMonthStr)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Pendapatan</div>
                  <div className="font-black text-lg">{formatRupiah(liveCalc?.totalIncome || 0)}</div>
                </div>
                <button onClick={() => setShowIncomeDetail(false)} className="rounded-full p-2 bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-zinc-50/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-white text-zinc-500 uppercase tracking-wider text-[10px] font-bold sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl border-b border-zinc-200">Tanggal</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Sumber Dana</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Kategori</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Akun</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Deskripsi</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Nominal (Rp)</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Metode</th>
                    <th className="px-4 py-3 rounded-tr-xl border-b border-zinc-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700 bg-white">
                  {sharingTransactions.filter(t => t.date.startsWith(selectedMonthStr) && t.type === 'INCOME').length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-zinc-400 font-medium">BELUM ADA TRANSAKSI</td>
                    </tr>
                  ) : (
                    sharingTransactions.filter(t => t.date.startsWith(selectedMonthStr) && t.type === 'INCOME')
                    .sort((a,b) => b.date.localeCompare(a.date))
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-zinc-900 whitespace-nowrap">{formatTanggal(item.date)}</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">{item.sourceType || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">{item.category}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-800">{item.accountName || '-'}</td>
                        <td className="px-4 py-3 text-zinc-600">{item.description}</td>
                        <td className="px-4 py-3 font-black text-emerald-600">{formatRupiah(item.amount)}</td>
                        <td className="px-4 py-3"><span className="text-[10px] font-bold text-zinc-500">{item.paymentMethod || 'TRANSFER'}</span></td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">AKTIF</span>
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

      {/* Expense Detail Modal */}
      {showExpenseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-zinc-200 flex flex-col h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-rose-900 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-rose-600" />
                  RINCIAN UANG KELUAR SHARING
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Detail pengeluaran untuk periode {formatBulanTahun(selectedMonthStr)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Pengeluaran</div>
                  <div className="font-black text-lg">{formatRupiah(liveCalc?.totalExpense || 0)}</div>
                </div>
                <button onClick={() => setShowExpenseDetail(false)} className="rounded-full p-2 bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-zinc-50/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-white text-zinc-500 uppercase tracking-wider text-[10px] font-bold sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl border-b border-zinc-200">Tanggal</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Kategori</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Deskripsi</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Nominal (Rp)</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Metode</th>
                    <th className="px-4 py-3 border-b border-zinc-200">Bukti</th>
                    <th className="px-4 py-3 rounded-tr-xl border-b border-zinc-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700 bg-white">
                  {sharingTransactions.filter(t => t.date.startsWith(selectedMonthStr) && t.type === 'EXPENSE').length === 0 ? (
                    <tr>
                      <td col colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">BELUM ADA TRANSAKSI</td>
                    </tr>
                  ) : (
                    sharingTransactions.filter(t => t.date.startsWith(selectedMonthStr) && t.type === 'EXPENSE')
                    .sort((a,b) => b.date.localeCompare(a.date))
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-zinc-900 whitespace-nowrap">{formatTanggal(item.date)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">{item.category}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{item.description}</td>
                        <td className="px-4 py-3 font-black text-rose-600">{formatRupiah(item.amount)}</td>
                        <td className="px-4 py-3"><span className="text-[10px] font-bold text-zinc-500">{item.paymentMethod || 'TRANSFER'}</span></td>
                        <td className="px-4 py-3">
                           {item.receiptUrl ? (
                             <button onClick={() => setPreviewImageUrl(item.receiptUrl!)} className="text-blue-500 hover:underline font-bold text-[10px]">Lihat Bukti</button>
                           ) : (
                             <span className="text-zinc-400 italic text-[10px]">-</span>
                           )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">AKTIF</span>
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

      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Bukti Transfer"
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Modal Detail Settlement */}
      {selectedSettlementDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  RINCIAN PERIODE
                </span>
                <h3 className="text-base font-black text-zinc-900 mt-1">
                  Settlement {selectedSettlementDetail.periodLabel}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSettlementDetail(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900">Uang Masuk Sharing:</span>
                <span className="font-black text-emerald-950">
                  {formatRupiah(selectedSettlementDetail.totalIncome)}
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="font-bold text-rose-900">Pengeluaran Sharing:</span>
                <span className="font-black text-rose-950">
                  {formatRupiah(selectedSettlementDetail.totalExpense)}
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900">
                  Hak Investor ({selectedSettlementDetail.investorPercentage}%):
                </span>
                <span className="font-black text-blue-950">
                  {formatRupiah(selectedSettlementDetail.investorAmount)}
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-zinc-100 rounded-xl border border-zinc-200">
                <span className="font-bold text-zinc-700">Telah Ditransfer:</span>
                <span className="font-black text-emerald-700">
                  {formatRupiah(selectedSettlementDetail.totalPaidToInvestor || 0)}
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900">Sisa Belum Diterima:</span>
                <span className="font-black text-amber-950">
                  {formatRupiah(
                    selectedSettlementDetail.remainingInvestorObligation !== undefined
                      ? selectedSettlementDetail.remainingInvestorObligation
                      : selectedSettlementDetail.investorAmount
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSettlementDetail(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
