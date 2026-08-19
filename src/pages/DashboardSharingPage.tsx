import React, { useState, useEffect } from 'react';
import {
  Share2,
  TrendingUp,
  DollarSign,
  Users,
  CalendarCheck,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeDailyPerformance } from '../services/performanceService';
import { subscribeExpenses } from '../services/expenseService';
import { subscribeTransactions } from '../services/transactionService';
import { FinancialTransaction, DailyPerformance, Expense, AttendanceRecord, Employee } from '../types';
import { subscribeTodayAttendance } from '../services/attendanceService';
import { subscribeEmployees } from '../services/employeeService';
import { formatBulanTahun, formatRupiah, formatTanggal, tanggalHariIni, bulanHariIni } from '../utils/formatters';

export const DashboardSharingPage: React.FC = () => {
  const { role, userProfile, loading: authLoading, currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(bulanHariIni());
  const [performance, setPerformance] = useState<DailyPerformance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [showIncomeDetail, setShowIncomeDetail] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (authLoading || !currentUser || !userProfile?.active) {
      return;
    }
    const unsubPerf = subscribeDailyPerformance('SHARING', setPerformance);
    const unsubExp = subscribeExpenses('SHARING', setExpenses);
    const unsubTx = subscribeTransactions({ scope: 'SHARING', status: 'ACTIVE' }, setTransactions);
    const unsubAtt = subscribeTodayAttendance(tanggalHariIni(), setAttendance);
    const unsubEmp = subscribeEmployees('SHARING', setEmployees);

    return () => {
      unsubPerf();
      unsubExp();
      unsubTx();
      unsubAtt();
      unsubEmp();
    };
  }, [authLoading, currentUser?.uid, userProfile?.role, userProfile?.active]);

  const filteredPerf = performance.filter((p) => p.date.startsWith(selectedMonth));
  const filteredExp = expenses.filter((e) => e.date.startsWith(selectedMonth));

  // Financial calculations
  const totalGmv = filteredPerf.reduce((sum, p) => sum + p.gmv, 0);
  const totalKomisiKotor = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalPengeluaran = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const labaBersihSharing = totalKomisiKotor - totalPengeluaran;

  // Split: Owner 50%, Investor 50%
  const bagiHasilOwner = labaBersihSharing > 0 ? labaBersihSharing * 0.5 : 0;
  const bagiHasilInvestor = labaBersihSharing > 0 ? labaBersihSharing * 0.5 : 0;

  // Attendance quick summary
  const hadirCount = attendance.filter((a) => a.waktuMasuk).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Dashboard Sharing (Bisnis Bersama)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan GMV penjualan, komisi kotor, pengeluaran operasional, dan skema bagi hasil 50:50.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-2 py-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Periode:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded border-none bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Main KPI Grid - High Density */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total GMV Penjualan</span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Bulan Ini</span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatRupiah(totalGmv)}</p>
          <span className="text-[10px] text-slate-400 font-medium">Bulan {formatBulanTahun(selectedMonth)}</span>
        </div>

        <div 
    onClick={() => setShowIncomeDetail(true)}
    className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs cursor-pointer hover:bg-emerald-100/50 transition-colors"
  >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Komisi Kotor Masuk</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">Omset</span>
          </div>
          <p className="text-xl font-black text-emerald-800 mt-2">{formatRupiah(totalKomisiKotor)}</p>
          <span className="text-[10px] text-emerald-700/80 font-medium">Pendapatan Tim Sharing</span>
        </div>

        <div 
    onClick={() => setShowExpenseDetail(true)}
    className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-xs cursor-pointer hover:bg-rose-100/50 transition-colors"
  >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Biaya Operasional</span>
            <span className="text-[10px] text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded font-bold">{filteredExp.length} Tx</span>
          </div>
          <p className="text-xl font-black text-rose-800 mt-2">{formatRupiah(totalPengeluaran)}</p>
          <span className="text-[10px] text-rose-700/80 font-medium">Payroll & Pengeluaran</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-white shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Laba Bersih Sharing</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded font-bold">50:50</span>
          </div>
          <p className="text-xl font-black text-emerald-400 mt-2">{formatRupiah(labaBersihSharing)}</p>
          <span className="text-[10px] text-slate-400 font-medium">Sebelum Dibagi Dua</span>
        </div>
      </div>

      {/* Profit Sharing Split Banner (50:50) */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                PROFIT SHARING 50% : 50%
              </span>
              <span className="text-xs text-slate-400 font-medium">Periode {formatBulanTahun(selectedMonth)}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">Pembagian Hasil Bersih Kerjasama</h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-lg">
              Sesuai kesepakatan kerjasama, laba bersih dibagi rata antara Pengelola (Owner) dan Pemodal (Investor).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner (50%)</span>
              <span className="text-base font-extrabold text-white mt-0.5 block">{formatRupiah(bagiHasilOwner)}</span>
            </div>
            <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Investor (50%)</span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">{formatRupiah(bagiHasilInvestor)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Operational Status (Absensi & Staff) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
              <CalendarCheck className="h-4 w-4 text-blue-600" />
              <span>Status Kehadiran Tim Hari Ini</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {hadirCount} / {employees.length} Hadir
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {employees.map((emp) => {
              const rec = attendance.find((a) => a.employeeId === emp.id);
              return (
                <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">{emp.name} <span className="text-[10px] text-slate-400">({emp.position})</span></span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rec?.waktuMasuk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {rec?.waktuMasuk ? `Masuk ${rec.waktuMasuk} WIB` : 'Belum Absen'}
                  </span>
                </div>
              );
            })}
            {employees.length === 0 && (
              <p className="text-center text-slate-400 py-3 text-xs">Belum ada data karyawan.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span>Pengeluaran Operasional Terbaru</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Total {filteredExp.length}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {filteredExp.slice(0, 4).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800 block leading-tight">{exp.description}</span>
                  <span className="text-[10px] text-slate-400">{exp.category} • {exp.date}</span>
                </div>
                <span className="font-bold text-rose-600 text-xs">{formatRupiah(exp.amount)}</span>
              </div>
            ))}
            {filteredExp.length === 0 && (
              <p className="text-center text-slate-400 py-3 text-xs">Belum ada pengeluaran di periode ini.</p>
            )}
          </div>
        </div>
      </div>

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
                  Detail pendapatan untuk periode {formatBulanTahun(selectedMonth)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Pendapatan</div>
                  <div className="font-black text-lg">{formatRupiah(totalKomisiKotor)}</div>
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
                  {transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'INCOME').length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-zinc-400 font-medium">BELUM ADA TRANSAKSI</td>
                    </tr>
                  ) : (
                    transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'INCOME')
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
                  Detail pengeluaran untuk periode {formatBulanTahun(selectedMonth)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Pengeluaran</div>
                  <div className="font-black text-lg">{formatRupiah(totalPengeluaran)}</div>
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
                  {transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'EXPENSE').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">BELUM ADA TRANSAKSI</td>
                    </tr>
                  ) : (
                    transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'EXPENSE')
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
                             <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold text-[10px]">Lihat</a>
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

    </div>
  );
};
