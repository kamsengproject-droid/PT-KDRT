import React, { useState, useEffect } from 'react';
import {
  Lock,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  ShieldCheck,
} from 'lucide-react';
import { subscribeDailyPerformance } from '../services/performanceService';
import { subscribeExpenses } from '../services/expenseService';
import { DailyPerformance, Expense } from '../types';
import { formatBulanTahun, formatRupiah, bulanHariIni } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const DashboardPribadiPage: React.FC = () => {
  const { userProfile, loading: authLoading, currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(bulanHariIni());
  const [performance, setPerformance] = useState<DailyPerformance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (authLoading || !currentUser || !userProfile?.active) {
      return;
    }
    const unsubPerf = subscribeDailyPerformance('PRIBADI', setPerformance);
    const unsubExp = subscribeExpenses('PRIBADI', setExpenses);

    return () => {
      unsubPerf();
      unsubExp();
    };
  }, [authLoading, currentUser?.uid, userProfile?.role, userProfile?.active]);

  const filteredPerf = performance.filter((p) => p.date.startsWith(selectedMonth));
  const filteredExp = expenses.filter((e) => e.date.startsWith(selectedMonth));

  const totalGmv = filteredPerf.reduce((sum, p) => sum + p.gmv, 0);
  const totalKomisiKotor = filteredPerf.reduce((sum, p) => sum + p.komisiKotor, 0);
  const totalPengeluaran = filteredExp.reduce((sum, e) => sum + e.amount, 0);
  const labaBersihPribadi = totalKomisiKotor - totalPengeluaran;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-zinc-900 px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wide">
              Khusus Owner
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2.5 mt-1">
            <Lock className="h-6 w-6 text-zinc-800" />
            Dashboard Bisnis Pribadi
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Rekap pendapatan GMV, komisi afiliasi pribadi, dan pengeluaran mandiri tanpa bagi hasil (100% Milik Owner).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl border border-zinc-200 p-1.5 shadow-2xs">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border-none bg-transparent px-2 py-1 text-xs font-bold text-zinc-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">GMV Akun Pribadi</span>
          <p className="text-2xl font-extrabold text-zinc-900 mt-2">{formatRupiah(totalGmv)}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Bulan {formatBulanTahun(selectedMonth)}</span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Komisi Bersih</span>
          <p className="text-2xl font-extrabold text-emerald-800 mt-2">{formatRupiah(totalKomisiKotor)}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Masuk Kas Pribadi</span>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Pengeluaran Pribadi</span>
          <p className="text-2xl font-extrabold text-rose-800 mt-2">{formatRupiah(totalPengeluaran)}</p>
          <span className="text-[11px] text-rose-700 font-medium">{filteredExp.length} Transaksi</span>
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Laba Bersih 100%</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{formatRupiah(labaBersihPribadi)}</p>
          <span className="text-[11px] text-zinc-400 font-medium">Keuntungan Bersih Owner</span>
        </div>
      </div>
    </div>
  );
};
