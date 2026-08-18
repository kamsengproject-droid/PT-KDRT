const fs = require('fs');
let text = fs.readFileSync('src/pages/ArusKasPage.tsx', 'utf8');

const oldTotalMasuk = `  const totalUangMasuk = useMemo(() => {
    return activeTxs
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [activeTxs]);`;

const newTotalMasuk = `  const totalUangMasuk = useMemo(() => {
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
  
  const saldoBerjalan = saldoAwal + totalUangMasuk - totalUangKeluar;
`;
text = text.replace(oldTotalMasuk, newTotalMasuk);

const oldSaldoKasBersih = `  const saldoKasBersih = totalUangMasuk - totalUangKeluar;`;
const newSaldoKasBersih = ``;
text = text.replace(oldSaldoKasBersih, newSaldoKasBersih);

// Update Dashboard UI
const oldDashboard = `      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pemasukan */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Total Uang Masuk</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-emerald-900 relative z-10">{formatRupiah(totalUangMasuk)}</p>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingUp className="h-24 w-24 text-emerald-600" />
          </div>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700">Total Uang Keluar</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-rose-900 relative z-10">{formatRupiah(totalUangKeluar)}</p>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingDown className="h-24 w-24 text-rose-600" />
          </div>
        </div>

        {/* Card 3: Saldo Kas Bersih */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700">Saldo Kas Bersih</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-indigo-900 relative z-10">{formatRupiah(saldoKasBersih)}</p>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <DollarSign className="h-24 w-24 text-indigo-600" />
          </div>
        </div>
      </div>`;

const newDashboard = `      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Awal */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Saldo Awal</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-slate-900 relative z-10">{formatRupiah(saldoAwal)}</p>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Uang Masuk</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-emerald-900 relative z-10">{formatRupiah(totalUangMasuk)}</p>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Uang Keluar</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-rose-900 relative z-10">{formatRupiah(totalUangKeluar)}</p>
        </div>

        {/* Card 4: Saldo Berjalan */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Saldo Berjalan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-indigo-900 relative z-10">{formatRupiah(saldoBerjalan)}</p>
        </div>
      </div>`;

text = text.replace(oldDashboard, newDashboard);
text = text.replace(/import \{/, "import {\n  Wallet,");

fs.writeFileSync('src/pages/ArusKasPage.tsx', text);
