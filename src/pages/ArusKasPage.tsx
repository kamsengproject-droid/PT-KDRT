import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, CurrencyInput } from '../components/CurrencyInput';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Download,
  Plus,
  Search,
  FileText,
  Lock,
  Layers,
  XCircle,
  Eye,
  Trash2,
  Paperclip,
  Tag,
  CreditCard,
  Building2,
  Sparkles,
  PieChart as PieIcon,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeTransactions,
  createFinancialTransaction,
  recordTikTokIncome,
  voidTransaction,
  uploadTransactionReceipt,
} from '../services/transactionService';
import {
  FinancialTransaction,
  ScopeType,
  TransactionType,
  TransactionStatus,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  PaymentMethod,
} from '../types';
import {
  formatBulanTahun,
  formatRupiah,
  formatTanggal,
  tanggalHariIni,
  bulanHariIni,
} from '../utils/formatters';

export const ArusKasPage: React.FC = () => {
  const { userProfile, role, loading: authLoading, currentUser } = useAuth();

  // Period Filter State
  const [periodType, setPeriodType] = useState<'BULAN_INI' | 'HARI_INI' | 'MINGGU_INI' | 'BULAN_LALU' | 'CUSTOM'>('BULAN_INI');
  const [selectedMonth, setSelectedMonth] = useState<string>(bulanHariIni());
  const [startDate, setStartDate] = useState<string>(tanggalHariIni());
  const [endDate, setEndDate] = useState<string>(tanggalHariIni());

  // Scope & Data Filter State
  const [selectedScope, setSelectedScope] = useState<ScopeType | 'ALL'>(
    role === 'INVESTOR' ? 'SHARING' : 'ALL'
  );
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'VOID'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transactions Master State
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals State
  const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showVoidModal, setShowVoidModal] = useState<boolean>(false);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<FinancialTransaction | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<FinancialTransaction | null>(null);

  // Form States - Income
  const [incomeForm, setIncomeForm] = useState<{
    date: string;
    scope: ScopeType;
    category: string;
    sourceType: string;
    accountName: string;
    gmv: number;
    estimatedCommission: number;
    realCommission: number;
    amount: number | '';
    paymentMethod: PaymentMethod;
    description: string;
    notes: string;
    receiptFile: File | null;
  }>({
    date: tanggalHariIni(),
    scope: 'SHARING',
    category: 'KOMISI TIKTOK',
    sourceType: 'TIKTOK_COMMISSION',
    accountName: '',
    gmv: '',
    estimatedCommission: '',
    realCommission: '',
    amount: '',
    paymentMethod: 'TRANSFER',
    description: '',
    notes: '',
    receiptFile: null,
  });

  // Form States - Expense
  const [expenseForm, setExpenseForm] = useState<{
    date: string;
    scope: ScopeType;
    category: string;
    amount: number;
    paymentMethod: PaymentMethod;
    description: string;
    notes: string;
    receiptFile: File | null;
  }>({
    date: tanggalHariIni(),
    scope: 'SHARING',
    category: 'OPERASIONAL',
    amount: '',
    paymentMethod: 'TRANSFER',
    description: '',
    notes: '',
    receiptFile: null,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Enforce Investor Scope Constraint
  useEffect(() => {
    if (role === 'INVESTOR' && selectedScope !== 'SHARING') {
      setSelectedScope('SHARING');
    }
  }, [role, selectedScope]);

  // Subscribe to Transactions Real-time
  useEffect(() => {
    if (authLoading || !userProfile?.active) {
      return;
    }
    setLoading(true);
    const unsub = subscribeTransactions(
      {
        scope: selectedScope === 'ALL' ? undefined : selectedScope,
      },
      (list) => {
        setTransactions(list);
        setLoading(false);
      }
    );
    return unsub;
  }, [authLoading, currentUser?.uid, userProfile?.role, userProfile?.active, selectedScope]);

  // Determine Active Date Boundaries
  const dateRange = useMemo(() => {
    const today = new Date();
    const todayStr = tanggalHariIni();

    if (periodType === 'HARI_INI') {
      return { start: todayStr, end: todayStr };
    }

    if (periodType === 'MINGGU_INI') {
      const day = today.getDay(); // 0 is Sunday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const start = monday.toISOString().slice(0, 10);
      const end = sunday.toISOString().slice(0, 10);
      return { start, end };
    }

    if (periodType === 'BULAN_LALU') {
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const year = prevMonthDate.getFullYear();
      const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      const lastDay = new Date(year, prevMonthDate.getMonth() + 1, 0).getDate();
      return { start: `${monthStr}-01`, end: `${monthStr}-${lastDay}` };
    }

    if (periodType === 'CUSTOM') {
      return { start: startDate, end: endDate };
    }

    // Default: BULAN_INI
    const yearMonth = selectedMonth || bulanHariIni();
    const [y, m] = yearMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { start: `${yearMonth}-01`, end: `${yearMonth}-${lastDay}` };
  }, [periodType, selectedMonth, startDate, endDate]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Date Range
      if (tx.date < dateRange.start || tx.date > dateRange.end) return false;

      // 2. Type Filter
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // 3. Status Filter
      if (statusFilter !== 'ALL' && (tx.status || 'ACTIVE') !== statusFilter) return false;

      // 4. Category Filter
      if (categoryFilter !== 'SEMUA' && tx.category !== categoryFilter) return false;

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (tx.description || '').toLowerCase().includes(q);
        const catMatch = (tx.category || '').toLowerCase().includes(q);
        const accMatch = (tx.accountName || '').toLowerCase().includes(q);
        const noteMatch = (tx.notes || '').toLowerCase().includes(q);
        if (!descMatch && !catMatch && !accMatch && !noteMatch) return false;
      }

      return true;
    });
  }, [transactions, dateRange, typeFilter, statusFilter, categoryFilter, searchQuery]);

  // Financial KPI Calculations (Only ACTIVE transactions affect Cashflow)
  const activeTxs = useMemo(() => {
    return filteredTransactions.filter((tx) => (tx.status || 'ACTIVE') === 'ACTIVE');
  }, [filteredTransactions]);

  const totalUangMasuk = useMemo(() => {
    return activeTxs
      .filter((tx) => tx.type === 'INCOME' && tx.sourceType !== 'OPENING_BALANCE')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [activeTxs]);

  const saldoAwal = useMemo(() => {
    let balance = 0;
    transactions.forEach(tx => {
      if ((tx.status || 'ACTIVE') !== 'ACTIVE') return;
      // Saldo awal = semua opening balance + cashflow SEBELUM periode ini
      if (tx.date < dateRange.start || tx.sourceType === 'OPENING_BALANCE') {
        // Jika opening balance tapi setelah/di dalam periode ini, tetap anggap saldo awal
        // Jika transaksi biasa tapi sebelum periode, masuk ke carry over saldo awal
        if (tx.type === 'INCOME') balance += Number(tx.amount) || 0;
        if (tx.type === 'EXPENSE') balance -= Number(tx.amount) || 0;
      }
    });
    return balance;
  }, [transactions, dateRange.start]);
  
  const totalUangKeluar = useMemo(() => {
    return activeTxs
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [activeTxs]);

  const saldoBerjalan = saldoAwal + totalUangMasuk - totalUangKeluar;



  // Breakdown GMV (Hanya metrik performa afiliasi, bukan uang masuk kas)
  const totalGmvRef = useMemo(() => {
    return activeTxs
      .filter((tx) => tx.sourceType === 'TIKTOK_COMMISSION' && tx.gmv)
      .reduce((sum, tx) => sum + (Number(tx.gmv) || 0), 0);
  }, [activeTxs]);

  // Category Breakdown for Expenses
  const categoryExpenses = useMemo(() => {
    const map = new Map<string, number>();
    activeTxs
      .filter((tx) => tx.type === 'EXPENSE')
      .forEach((tx) => {
        const cat = tx.category || 'LAINNYA';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
      });
    return Array.from(map.entries())
      .map(([cat, amount]) => ({ category: cat, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeTxs]);

  // Category Breakdown for Income
  const categoryIncomes = useMemo(() => {
    const map = new Map<string, number>();
    activeTxs
      .filter((tx) => tx.type === 'INCOME')
      .forEach((tx) => {
        const cat = tx.category || 'KOMISI TIKTOK';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
      });
    return Array.from(map.entries())
      .map(([cat, amount]) => ({ category: cat, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeTxs]);

  // Handlers
  const handleOpenIncomeModal = () => {
    setIncomeForm({
      date: tanggalHariIni(),
      scope: selectedScope === 'PRIBADI' ? 'PRIBADI' : 'SHARING',
      category: 'KOMISI TIKTOK',
      sourceType: 'TIKTOK_COMMISSION',
      accountName: '',
      gmv: '',
      estimatedCommission: '',
      realCommission: '',
      amount: '',
      paymentMethod: 'TRANSFER',
      description: '',
      notes: '',
      receiptFile: null,
    });
    setShowIncomeModal(true);
  };

  const handleOpenExpenseModal = () => {
    setExpenseForm({
      date: tanggalHariIni(),
      scope: selectedScope === 'PRIBADI' ? 'PRIBADI' : 'SHARING',
      category: 'OPERASIONAL',
      amount: '',
      paymentMethod: 'TRANSFER',
      description: '',
      notes: '',
      receiptFile: null,
    });
    setShowExpenseModal(true);
  };

  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);

    try {
      let attachmentUrl: string | undefined = undefined;
      let attachmentStoragePath: string | undefined = undefined;

      if (incomeForm.receiptFile) {
        const uploadRes = await uploadTransactionReceipt(incomeForm.receiptFile, 'income');
        attachmentUrl = uploadRes.downloadUrl;
        attachmentStoragePath = uploadRes.storagePath;
      }

      if (incomeForm.sourceType === 'TIKTOK_COMMISSION') {
        const res = await recordTikTokIncome(
          {
            date: incomeForm.date,
            accountId: incomeForm.accountName || 'akun_tiktok',
            accountName: incomeForm.accountName || 'Akun TikTok PT.KDRT',
            scope: incomeForm.scope,
            gmv: Number(incomeForm.gmv) || 0,
            estimatedCommission: Number(incomeForm.estimatedCommission) || 0,
            realCommission: Number(incomeForm.realCommission) || 0,
            notes: incomeForm.notes,
          },
          userProfile?.uid || 'user',
          userProfile?.name || 'Owner'
        );

        if (!res.success) {
          alert(res.message);
          return;
        }
      } else {
        const res = await createFinancialTransaction(
          {
            type: 'INCOME',
            amount: Number(incomeForm.amount) || 0,
            date: incomeForm.date,
            category: incomeForm.category,
            scope: incomeForm.scope,
            sourceType: incomeForm.sourceType as any,
            paymentMethod: incomeForm.paymentMethod,
            description: incomeForm.description || `Uang Masuk: ${incomeForm.category}`,
            notes: incomeForm.notes,
            attachmentUrl,
            attachmentStoragePath,
            createdBy: userProfile?.uid || 'user',
            createdByName: userProfile?.name || 'Owner',
          },
          userProfile?.uid || 'user',
          userProfile?.name || 'Owner'
        );

        if (!res.success) {
          alert(res.message);
          return;
        }
      }

      setShowIncomeModal(false);
      setActionMessage({ text: 'Uang masuk berhasil dicatat ke buku kas.', type: 'success' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal mencatat transaksi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);

    try {
      let attachmentUrl: string | undefined = undefined;
      let attachmentStoragePath: string | undefined = undefined;

      if (expenseForm.receiptFile) {
        const uploadRes = await uploadTransactionReceipt(expenseForm.receiptFile, 'expense');
        attachmentUrl = uploadRes.downloadUrl;
        attachmentStoragePath = uploadRes.storagePath;
      }

      const res = await createFinancialTransaction(
        {
          type: 'EXPENSE',
          amount: Number(expenseForm.amount) || 0,
          date: expenseForm.date,
          category: expenseForm.category,
          scope: expenseForm.scope,
          sourceType: 'MANUAL',
          paymentMethod: expenseForm.paymentMethod,
          description: expenseForm.description || `Pengeluaran ${expenseForm.category}`,
          notes: expenseForm.notes,
          attachmentUrl,
          attachmentStoragePath,
          createdBy: userProfile?.uid || 'user',
          createdByName: userProfile?.name || 'Owner',
        },
        userProfile?.uid || 'user',
        userProfile?.name || 'Owner'
      );

      if (!res.success) {
        alert(res.message);
        return;
      }

      setShowExpenseModal(false);
      setActionMessage({ text: 'Pengeluaran kas berhasil dicatat ke buku kas.', type: 'success' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal mencatat pengeluaran: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenVoidModal = (tx: FinancialTransaction) => {
    setSelectedTxForVoid(tx);
    setVoidReason('');
    setShowVoidModal(true);
  };

  const handleConfirmVoid = async () => {
    if (!selectedTxForVoid?.id) return;
    if (!voidReason.trim()) {
      alert('Alasan pembatalan (VOID) wajib diisi untuk audit trail.');
      return;
    }

    setSubmitting(true);
    try {
      await voidTransaction(
        selectedTxForVoid.id,
        selectedTxForVoid,
        voidReason.trim(),
        userProfile?.uid || 'user',
        userProfile?.name || 'Owner'
      );
      setShowVoidModal(false);
      setActionMessage({ text: 'Transaksi berhasil di-VOID (dibatalkan).', type: 'success' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal melakukan VOID transaksi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const headers = [
      'ID Transaksi',
      'Tanggal',
      'Tipe',
      'Kategori',
      'Scope',
      'Sumber',
      'Deskripsi',
      'Nominal (Rp)',
      'Status',
      'Metode Pembayaran',
      'Akun/Karyawan',
      'Alasan VOID',
      'Dibuat Oleh',
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.id || ''}"`,
      `"${tx.date}"`,
      `"${tx.type === 'INCOME' ? 'UANG MASUK' : 'UANG KELUAR'}"`,
      `"${tx.category}"`,
      `"${tx.scope}"`,
      `"${tx.sourceType || 'MANUAL'}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.amount,
      `"${tx.status || 'ACTIVE'}"`,
      `"${tx.paymentMethod || 'TRANSFER'}"`,
      `"${tx.accountName || tx.employeeName || '-'}"`,
      `"${(tx.voidReason || '').replace(/"/g, '""')}"`,
      `"${tx.createdByName || 'Owner'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Kas_PT_KDRT_${selectedScope}_${dateRange.start}_sd_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header & Main Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              <DollarSign className="h-3.5 w-3.5" />
              Buku Kas Master & Cashflow
            </span>
            {role === 'INVESTOR' && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700">
                Mode Investor (Read-Only)
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-1">
            Laporan Arus Kas Pusat PT.KDRT
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Semua transaksi uang masuk (Komisi Real & Pendapatan) dan uang keluar (Biaya operasional, gaji, aset) tercatat transparan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-all"
          >
            <Download className="h-4 w-4 text-zinc-500" />
            <span>Export CSV</span>
          </button>

          {role === 'OWNER' && (
            <>
              <button
                onClick={handleOpenIncomeModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>+ Uang Masuk</span>
              </button>

              <button
                onClick={handleOpenExpenseModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>- Pengeluaran Kas</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scope Selector Tabs & Period Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs">
        {/* Scope Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
          {role !== 'INVESTOR' && (
            <button
              onClick={() => setSelectedScope('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedScope === 'ALL'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              [ GABUNGAN SEMUA ]
            </button>
          )}
          <button
            onClick={() => setSelectedScope('SHARING')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedScope === 'SHARING'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            [ BISNIS SHARING ]
          </button>
          {role !== 'INVESTOR' && (
            <button
              onClick={() => setSelectedScope('PRIBADI')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedScope === 'PRIBADI'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              [ BISNIS PRIBADI ]
            </button>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriodType('BULAN_INI')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                periodType === 'BULAN_INI' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriodType('MINGGU_INI')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                periodType === 'MINGGU_INI' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setPeriodType('HARI_INI')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                periodType === 'HARI_INI' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriodType('BULAN_LALU')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                periodType === 'BULAN_LALU' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => setPeriodType('CUSTOM')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                periodType === 'CUSTOM' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
              }`}
            >
              Custom
            </button>
          </div>

          {periodType === 'BULAN_INI' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-800"
            />
          )}

          {periodType === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-2 py-1 font-bold text-zinc-800"
              />
              <span className="text-zinc-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-2 py-1 font-bold text-zinc-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main KPI Cards (Uang Masuk, Uang Keluar, Saldo Bersih, GMV Info) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Uang Masuk */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              1. Total Uang Masuk (Kas)
            </span>
            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 mt-2">
            {formatRupiah(totalUangMasuk)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium mt-1">
            <span>Komisi Real + Endorse/Jasa</span>
            <span className="font-bold">{activeTxs.filter((t) => t.type === 'INCOME').length} Trx</span>
          </div>
        </div>

        {/* Total Uang Keluar */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              2. Total Uang Keluar (Beban)
            </span>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-800 mt-2">
            {formatRupiah(totalUangKeluar)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-rose-700 font-medium mt-1">
            <span>Operasional, Gaji, Aset, dll</span>
            <span className="font-bold">{activeTxs.filter((t) => t.type === 'EXPENSE').length} Trx</span>
          </div>
        </div>

        {/* Saldo Kas Bersih */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              3. Saldo Bersih Kas (Cash Flow)
            </span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className={`text-2xl font-extrabold mt-2 ${saldoBerjalan >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(saldoBerjalan)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium mt-1">
            <span>Formula: Masuk - Keluar</span>
            <span className={`font-bold ${saldoBerjalan >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {saldoBerjalan >= 0 ? 'SURPLUS' : 'DEFISIT'}
            </span>
          </div>
        </div>

        {/* Info GMV Referensi (Not Cash) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              4. Total GMV Referensi
            </span>
            <HelpCircle className="h-4 w-4 text-zinc-400" title="GMV adalah omset penjualan di TikTok Shop, BUKAN uang masuk kas." />
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 mt-2">
            {formatRupiah(totalGmvRef)}
          </p>
          <div className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2 py-0.5 font-bold mt-1 inline-block">
            *GMV bukan uang masuk kantor
          </div>
        </div>
      </div>

      {/* Breakdown Kategori Ringkas (Pengeluaran & Uang Masuk) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Breakdown Pengeluaran */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-3">
            <h3 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-rose-600" />
              Pengeluaran Berdasarkan Kategori
            </h3>
            <span className="text-xs font-bold text-rose-600">{formatRupiah(totalUangKeluar)}</span>
          </div>

          {categoryExpenses.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Belum ada pengeluaran pada periode ini.</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {categoryExpenses.slice(0, 6).map((item) => {
                const pct = totalUangKeluar > 0 ? (item.amount / totalUangKeluar) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>{item.category}</span>
                      <span className="text-rose-600">{formatRupiah(item.amount)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Breakdown Uang Masuk */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-3">
            <h3 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Sumber Pendapatan / Uang Masuk
            </h3>
            <span className="text-xs font-bold text-emerald-600">{formatRupiah(totalUangMasuk)}</span>
          </div>

          {categoryIncomes.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Belum ada uang masuk pada periode ini.</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {categoryIncomes.map((item) => {
                const pct = totalUangMasuk > 0 ? (item.amount / totalUangMasuk) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>{item.category}</span>
                      <span className="text-emerald-600">{formatRupiah(item.amount)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabel Mutasi Buku Kas Lengkap */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
        {/* Table Filters Bar */}
        <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari deskripsi, kategori, akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tipe Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none"
            >
              <option value="ALL">Semua Jenis (Masuk & Keluar)</option>
              <option value="INCOME">Hanya + Uang Masuk</option>
              <option value="EXPENSE">Hanya - Uang Keluar</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Status AKTIF</option>
              <option value="VOID">Hanya Status VOID (Batal)</option>
            </select>

            {/* Kategori Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none"
            >
              <option value="SEMUA">Semua Kategori</option>
              {DEFAULT_INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  [Masuk] {c}
                </option>
              ))}
              {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  [Keluar] {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Mutasi Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-3 py-3">Jenis</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Deskripsi Transaksi</th>
                <th className="px-3 py-3">Scope</th>
                <th className="px-3 py-3">Metode / Bukti</th>
                <th className="px-5 py-3 text-right">Nominal (Rp)</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-400 font-medium">
                    Belum ada catatan mutasi kas pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isVoid = tx.status === 'VOID';
                  const isIncome = tx.type === 'INCOME';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        isVoid ? 'bg-zinc-50/50 opacity-60' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-bold text-zinc-900 whitespace-nowrap">
                        {formatTanggal(tx.date)}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIncome ? '+ MASUK' : '- KELUAR'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-800">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-800 line-clamp-1">{tx.description}</div>
                        {tx.accountName && (
                          <div className="text-[10px] text-zinc-500 font-medium">Akun: {tx.accountName}</div>
                        )}
                        {tx.employeeName && (
                          <div className="text-[10px] text-zinc-500 font-medium">Karyawan: {tx.employeeName}</div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tx.scope === 'SHARING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.scope}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold">
                          <CreditCard className="h-3 w-3 text-zinc-400" />
                          <span>{tx.paymentMethod || 'TRANSFER'}</span>
                        </div>
                        {tx.attachmentUrl && (
                          <a
                            href={tx.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold hover:underline mt-0.5"
                          >
                            <Paperclip className="h-2.5 w-2.5" />
                            <span>Nota</span>
                          </a>
                        )}
                      </td>
                      <td
                        className={`px-5 py-3.5 text-right font-extrabold text-sm whitespace-nowrap ${
                          isVoid
                            ? 'line-through text-zinc-400'
                            : isIncome
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                      </td>
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isVoid
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isVoid ? 'VOID (BATAL)' : 'AKTIF'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => {
                            setSelectedTxDetail(tx);
                            setShowDetailModal(true);
                          }}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 transition-colors"
                          title="Lihat Detail Transaksi"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {role === 'OWNER' && !isVoid && (
                          <button
                            onClick={() => handleOpenVoidModal(tx)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Batalkan Transaksi (VOID)"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Uang Masuk */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Catat Uang Masuk Kas
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Tambah catatan pendapatan komisi atau uang masuk lainnya ke buku kas.</p>
              </div>
              <button
                onClick={() => setShowIncomeModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitIncome} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Scope</label>
                  <select
                    value={incomeForm.scope}
                    onChange={(e) => setIncomeForm({ ...incomeForm, scope: e.target.value as ScopeType })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  >
                    <option value="SHARING">SHARING (Bagi Hasil)</option>
                    <option value="PRIBADI">PRIBADI (100% Owner)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Sumber Pendapatan</label>
                <select
                  value={incomeForm.sourceType}
                  onChange={(e) => {
                    const st = e.target.value;
                    let cat = 'KOMISI TIKTOK';
                    if (st === 'ENDORSE') cat = 'ENDORSE';
                    else if (st === 'SPONSOR') cat = 'SPONSOR';
                    else if (st === 'SERVICE') cat = 'JASA';
                    else if (st === 'OTHER') cat = 'LAINNYA';

                    setIncomeForm({
                      ...incomeForm,
                      sourceType: st,
                      category: cat,
                    });
                  }}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                >
                  <option value="TIKTOK_COMMISSION">Komisi Afiliasi TikTok</option>
                  <option value="ENDORSE">Endorsement Brand</option>
                  <option value="SPONSOR">Sponsorship</option>
                  <option value="SERVICE">Jasa / Live Streaming Service</option>
                  <option value="OTHER">Uang Masuk Lainnya</option>
                </select>
              </div>

              {incomeForm.sourceType === 'TIKTOK_COMMISSION' ? (
                <div className="rounded-xl bg-emerald-50/50 border border-emerald-200 p-3.5 space-y-3">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Nama Akun TikTok</label>
                    <input
                      type="text"
                      required
                      placeholder="contoh: @ptkdrt_official"
                      value={incomeForm.accountName}
                      onChange={(e) => setIncomeForm({ ...incomeForm, accountName: e.target.value })}
                      className="w-full rounded-xl border border-emerald-300 bg-white p-2.5 font-bold text-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">GMV Penjualan (Metrik)</label>
                      <CurrencyInput
                        placeholder="Rp 0"
                        value={incomeForm.gmv || ''}
                        onChange={(val) => setIncomeForm({ ...incomeForm, gmv: val })}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Estimasi Komisi (Metrik)</label>
                      <CurrencyInput
                        placeholder="Rp 0"
                        value={incomeForm.estimatedCommission || ''}
                        onChange={(val) => setIncomeForm({ ...incomeForm, estimatedCommission: val })}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-extrabold text-emerald-900 mb-1">
                      Komisi Real Masuk Kas (Rp) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      placeholder="Nominal komisi bersih yang dicairkan"
                      value={incomeForm.realCommission}
                      onChange={(e) => setIncomeForm({ ...incomeForm, realCommission: Number(e.target.value) })}
                      className="w-full rounded-xl border border-emerald-400 bg-white p-2.5 font-extrabold text-emerald-700 text-base"
                    />
                    <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                      *Hanya nominal Komisi Real ini yang diakui sebagai UANG MASUK KAS kantor.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-extrabold text-zinc-800 mb-1">Nominal Uang Masuk (Rp) *</label>
                  <CurrencyInput
                    required
                    value={incomeForm.amount || ''}
                    onChange={(val) => setIncomeForm({ ...incomeForm, amount: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-extrabold text-emerald-700 text-base"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Metode Penerimaan</label>
                  <select
                    value={incomeForm.paymentMethod}
                    onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  >
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CASH">Tunai (Cash)</option>
                    <option value="EWALLET">E-Wallet</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Bukti Transfer / Invoice</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setIncomeForm({ ...incomeForm, receiptFile: e.target.files[0] });
                      }
                    }}
                    className="w-full text-[11px] text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Payout Komisi TikTok Periode 1-15 Agustus"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Uang Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Pengeluaran */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-rose-600" />
                  Catat Pengeluaran Kas Kantor
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Tambah catatan biaya operasional, tagihan, atau beban kas PT.KDRT.</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Tanggal Pengeluaran</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Scope</label>
                  <select
                    value={expenseForm.scope}
                    onChange={(e) => setExpenseForm({ ...expenseForm, scope: e.target.value as ScopeType })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  >
                    <option value="SHARING">SHARING (Bagi Hasil)</option>
                    <option value="PRIBADI">PRIBADI (100% Owner)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Kategori Biaya</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  >
                    {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  >
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CASH">Tunai (Cash)</option>
                    <option value="EWALLET">E-Wallet</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-zinc-800 mb-1">Nominal Biaya (Rp) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="Rp 0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-extrabold text-rose-600 text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Keterangan / Rincian *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran Tagihan Internet Indihome Studio"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Upload Bukti Nota / Kwitansi</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setExpenseForm({ ...expenseForm, receiptFile: e.target.files[0] });
                    }
                  }}
                  className="w-full text-[11px] text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-500 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal VOID Transaksi */}
      {showVoidModal && selectedTxForVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 rounded-xl bg-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Batalkan Transaksi (VOID)?</h3>
                <p className="text-xs text-zinc-500">Transaksi tidak dihapus permanen, tetapi dikeluarkan dari saldo kas.</p>
              </div>
            </div>

            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs space-y-1 my-3">
              <div><strong>Keterangan:</strong> {selectedTxForVoid.description}</div>
              <div><strong>Kategori:</strong> {selectedTxForVoid.category} ({selectedTxForVoid.scope})</div>
              <div><strong>Nominal:</strong> <span className="font-extrabold text-rose-600">{formatRupiah(selectedTxForVoid.amount)}</span></div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-zinc-800">
                Alasan Pembatalan (VOID) * <span className="text-zinc-400 font-normal">(Wajib untuk audit trail)</span>
              </label>
              <textarea
                rows={3}
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Contoh: Terjadi salah input nominal / transaksi ganda dengan ref..."
                className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting || !voidReason.trim()}
                onClick={handleConfirmVoid}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Memproses VOID...' : 'Ya, VOID Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi & Sumber */}
      {showDetailModal && selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Rincian Transaksi Keuangan
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">ID: {selectedTxDetail.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Header Box */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  selectedTxDetail.type === 'INCOME'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {selectedTxDetail.type === 'INCOME' ? 'UANG MASUK KAS' : 'UANG KELUAR (BEBAN)'}
                  </span>
                  <div className="text-xl font-extrabold mt-0.5 text-zinc-900">
                    {formatRupiah(selectedTxDetail.amount)}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    selectedTxDetail.status === 'VOID'
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {selectedTxDetail.status === 'VOID' ? 'STATUS: VOID' : 'STATUS: AKTIF'}
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-zinc-700">
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Tanggal Transaksi</span>
                  <p className="font-bold text-zinc-900 mt-0.5">{formatTanggal(selectedTxDetail.date)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Scope Bisnis</span>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedTxDetail.scope}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Kategori</span>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedTxDetail.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Metode Pembayaran</span>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedTxDetail.paymentMethod || 'TRANSFER'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Sumber Integrasi</span>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedTxDetail.sourceType || 'MANUAL'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Dicatat Oleh</span>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedTxDetail.createdByName || 'Owner'}</p>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Keterangan & Deskripsi</span>
                <p className="mt-1 font-medium text-zinc-800 bg-white p-3 rounded-xl border border-zinc-200">
                  {selectedTxDetail.description || '-'}
                </p>
              </div>

              {/* Referensi Modul Sumber */}
              {(selectedTxDetail.sampleId || selectedTxDetail.inventoryId || selectedTxDetail.payrollId || selectedTxDetail.referenceId) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800">Referensi Modul Asal</span>
                  <div className="text-xs font-bold text-zinc-800">
                    {selectedTxDetail.sampleId && `Sampel ID: ${selectedTxDetail.sampleId}`}
                    {selectedTxDetail.inventoryId && `Inventory ID: ${selectedTxDetail.inventoryId}`}
                    {selectedTxDetail.payrollId && `Payroll ID: ${selectedTxDetail.payrollId}`}
                    {!selectedTxDetail.sampleId && !selectedTxDetail.inventoryId && !selectedTxDetail.payrollId && selectedTxDetail.referenceId && `Ref ID: ${selectedTxDetail.referenceId}`}
                  </div>
                </div>
              )}

              {/* Bukti Nota Attachment */}
              {selectedTxDetail.attachmentUrl && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Lampiran Bukti Nota</span>
                  <div className="mt-1.5 rounded-xl border border-zinc-200 overflow-hidden max-h-60 bg-zinc-100 flex items-center justify-center">
                    <img
                      src={selectedTxDetail.attachmentUrl}
                      alt="Bukti Nota"
                      className="max-h-60 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* VOID info if voided */}
              {selectedTxDetail.status === 'VOID' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 space-y-1 text-rose-900">
                  <span className="text-[10px] font-bold uppercase text-rose-700">Informasi Pembatalan (VOID)</span>
                  <p className="font-semibold text-xs">Alasan: {selectedTxDetail.voidReason || 'Tidak ada alasan dicantumkan.'}</p>
                  <p className="text-[10px] text-rose-700">Dibatalkan oleh: {selectedTxDetail.voidedByName || 'Owner'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100 mt-4">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800"
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
