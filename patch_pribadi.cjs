const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPribadiPage.tsx', 'utf8');

// Add imports
code = code.replace(
  /import \{[\s\S]*?\} from 'lucide-react';/,
  `$&
import { Filter, TrendingUp, DollarSign, X } from 'lucide-react';`
);
code = code.replace(/import \{ subscribeExpenses \} from '\.\.\/services\/expenseService';/, 
  `$&
import { subscribeTransactions } from '../services/transactionService';
import { FinancialTransaction } from '../types';`
);

// Add states
code = code.replace(/const \[expenses, setExpenses\] = useState<Expense\[\]>\(\[\]\);/, 
  `const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [showIncomeDetail, setShowIncomeDetail] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);`
);

// Add subscribe
code = code.replace(/const unsubExp = subscribeExpenses\('PRIBADI', setExpenses\);/,
  `$&
    const unsubTx = subscribeTransactions({ scope: 'PRIVATE', status: 'ACTIVE' }, setTransactions);`
);
code = code.replace(/unsubExp\(\);/, `$&
      unsubTx();`);
      
// Fix cards to open modals
code = code.replace(/<div className="rounded-2xl border border-emerald-100 bg-emerald-50\/50 p-5 shadow-2xs">/, 
  `<div 
    onClick={() => setShowIncomeDetail(true)}
    className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-2xs cursor-pointer hover:bg-emerald-100/50 transition-colors"
  >`
);
code = code.replace(/<div className="rounded-2xl border border-rose-100 bg-rose-50\/50 p-5 shadow-2xs">/, 
  `<div 
    onClick={() => setShowExpenseDetail(true)}
    className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-2xs cursor-pointer hover:bg-rose-100/50 transition-colors"
  >`
);

// Calculate totals directly from transactions (for KPI consistency!)
code = code.replace(/const totalKomisiKotor = filteredPerf.reduce\(\(sum, p\) => sum \+ p\.komisiKotor, 0\);/,
  `const totalKomisiKotor = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);`
);
code = code.replace(/const totalPengeluaran = filteredExp.reduce\(\(sum, e\) => sum \+ e\.amount, 0\);/,
  `const totalPengeluaran = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);`
);

// Add modals before closing div
const modals = `
      {/* Income Detail Modal */}
      {showIncomeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-zinc-200 flex flex-col h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                  SUMBER UANG MASUK PRIBADI
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
                  RINCIAN UANG KELUAR PRIBADI
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
                    <th className="px-4 py-3 rounded-tr-xl border-b border-zinc-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700 bg-white">
                  {transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'EXPENSE').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">BELUM ADA TRANSAKSI</td>
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
`;

code = code.replace(/    <\/div>\n  \);\n\};/, modals + '\n    </div>\n  );\n};');

fs.writeFileSync('src/pages/DashboardPribadiPage.tsx', code);
