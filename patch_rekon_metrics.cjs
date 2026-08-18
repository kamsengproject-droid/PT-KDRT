const fs = require('fs');
let text = fs.readFileSync('src/components/finance/RekonsiliasiKas.tsx', 'utf8');

const oldLogic = `  // Hitung saldo sistem kumulatif sampai tanggal/bulan yang dipilih
  const filteredTxs = transactions.filter((t) => t.date <= reconcileDate && (t.status || 'ACTIVE') === 'ACTIVE');
  const totalIncome = filteredTxs
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTxs
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const systemCalculatedBalance = totalIncome - totalExpense;`;

const newLogic = `  // Hitung saldo sistem kumulatif sampai tanggal/bulan yang dipilih
  const filteredTxs = transactions.filter((t) => t.date <= reconcileDate && (t.status || 'ACTIVE') === 'ACTIVE');
  
  const openingBalance = filteredTxs
    .filter((t) => t.sourceType === 'OPENING_BALANCE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
  const totalIncome = filteredTxs
    .filter((t) => t.type === 'INCOME' && t.sourceType !== 'OPENING_BALANCE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
  const totalExpense = filteredTxs
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
  const systemCalculatedBalance = openingBalance + totalIncome - totalExpense;`;

text = text.replace(oldLogic, newLogic);

const oldDash = `      {/* KPI Cards (Read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Pemasukan (Kumulatif)</span>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">{formatRupiah(totalIncome)}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Dari {filteredTxs.filter((t) => t.type === 'INCOME').length} catatan pendapatan</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Pengeluaran (Kumulatif)</span>
          <p className="text-2xl font-extrabold text-rose-900 mt-1">{formatRupiah(totalExpense)}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Dari {filteredTxs.filter((t) => t.type === 'EXPENSE').length} pengeluaran</span>
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Saldo Buku Kas Sistem Saat Ini</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{formatRupiah(systemCalculatedBalance)}</p>
          <span className="text-[11px] text-zinc-400 font-medium">Status Buku Kas Terkini</span>
        </div>
      </div>`;

const newDash = `      {/* KPI Cards (Read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Saldo Awal (Kumulatif)</span>
          <p className="text-xl font-extrabold text-indigo-900 mt-1">{formatRupiah(openingBalance)}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Posisi kas awal</span>
        </div>
        
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Uang Masuk Aktif</span>
          <p className="text-xl font-extrabold text-emerald-900 mt-1">{formatRupiah(totalIncome)}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Transaksi kas masuk</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Uang Keluar Aktif</span>
          <p className="text-xl font-extrabold text-rose-900 mt-1">{formatRupiah(totalExpense)}</p>
          <span className="text-[11px] text-zinc-500 font-medium">Transaksi operasional</span>
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Saldo Sistem Berjalan</span>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">{formatRupiah(systemCalculatedBalance)}</p>
          <span className="text-[11px] text-zinc-400 font-medium">Posisi kas terkini</span>
        </div>
      </div>`;

text = text.replace(oldDash, newDash);
fs.writeFileSync('src/components/finance/RekonsiliasiKas.tsx', text);
