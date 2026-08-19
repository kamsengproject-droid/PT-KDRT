const fs = require('fs');
let code = fs.readFileSync('src/pages/InvestorDashboardPage.tsx', 'utf8');

// Add imports
code = code.replace(
  /import \{[\s\S]*?\} from 'lucide-react';/,
  `$&
import { Filter } from 'lucide-react';`
);

// Add states
const stateInjection = `
  const [showIncomeDetail, setShowIncomeDetail] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
`;
code = code.replace(/const \[previewImageUrl, setPreviewImageUrl\] = useState<string \| null>\(null\);/, stateInjection + '\n  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);');

// Make cards clickable
const incomeCardReplace = `
          <div 
            onClick={() => setShowIncomeDetail(true)}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-2xs cursor-pointer hover:bg-emerald-100/60 transition-colors"
          >
`;
code = code.replace(/<div className="rounded-2xl border border-emerald-200 bg-emerald-50\/60 p-5 shadow-2xs">/, incomeCardReplace.trim());

const expenseCardReplace = `
          <div 
            onClick={() => setShowExpenseDetail(true)}
            className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-2xs cursor-pointer hover:bg-rose-100/60 transition-colors"
          >
`;
code = code.replace(/<div className="rounded-2xl border border-rose-200 bg-rose-50\/60 p-5 shadow-2xs">/, expenseCardReplace.trim());

// Render detail modals
const renderDetailModals = `
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
`;

code = code.replace(/\{previewImageUrl && \(/, renderDetailModals + '\n      {previewImageUrl && (');

fs.writeFileSync('src/pages/InvestorDashboardPage.tsx', code);
