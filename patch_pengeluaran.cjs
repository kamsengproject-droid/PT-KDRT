const fs = require('fs');
let code = fs.readFileSync('src/pages/PengeluaranPage.tsx', 'utf8');

const today = `tanggalHariIni()`;

// Update state to handle daily expense
code = code.replace(
  /const \[formData, setFormData\] = useState<\{[\s\S]*?\}\>(\{[\s\S]*?\});/,
  `const [formData, setFormData] = useState<{
    date: string;
    category: string;
    scope: ScopeType;
    amount: number | string;
    description: string;
    receiptUrl: string;
    paymentMethod: string;
    notes: string;
  }>({
    date: tanggalHariIni(),
    category: 'Operasional',
    scope: 'SHARING',
    amount: '',
    description: '',
    receiptUrl: '',
    paymentMethod: 'TRANSFER',
    notes: ''
  });`
);

// Add mode for Daily Expense
code = code.replace(
  /const \[showModal, setShowModal\] = useState<boolean>\(false\);/,
  `const [showModal, setShowModal] = useState<boolean>(false);
  const [isDailyExpense, setIsDailyExpense] = useState<boolean>(false);`
);

// handleOpenAdd
code = code.replace(
  /const handleOpenAdd = \(\) => \{/,
  `const handleOpenAdd = () => {
    setIsDailyExpense(false);`
);
code = code.replace(
  /category: 'OPERASIONAL',/,
  `category: 'Operasional',
      paymentMethod: 'TRANSFER',
      notes: '',`
);

// handleOpenDailyExpense
const handleOpenDailyExpense = `
  const handleOpenDailyExpense = () => {
    setIsDailyExpense(true);
    setEditingItem(null);
    setFormData({
      date: tanggalHariIni(),
      category: 'Makan/Minum',
      scope: 'SHARING',
      amount: '',
      description: '',
      receiptUrl: '',
      paymentMethod: 'TRANSFER',
      notes: ''
    });
    setShowModal(true);
  };
`;
code = code.replace(/const handleOpenEdit = \(item: Expense\) => \{/, handleOpenDailyExpense + '\n  const handleOpenEdit = (item: Expense) => {');

// handleOpenEdit update
code = code.replace(
  /category: item\.category,[\s\S]*?scope: item\.scope,/,
  `category: item.category,
      scope: item.scope,
      paymentMethod: item.paymentMethod || 'TRANSFER',
      notes: item.attachment || '',` // Just mapping attachment to notes if any
);

// Form submit
code = code.replace(
  /await tambahExpense\([\s\S]*?formData,\n\s*userProfile\?\.uid \|\| 'user',\n\s*userProfile\?\.name \|\| 'User'\n\s*\);/,
  `await tambahExpense(
          {
             ...formData,
             sourceType: isDailyExpense ? 'DAILY_EXPENSE' : 'MANUAL',
             amount: Number(formData.amount) || 0
          },
          userProfile?.uid || 'user',
          userProfile?.name || 'User'
        );`
);

// Edit updateExpense
code = code.replace(
  /await updateExpense\([\s\S]*?editingItem\.id,\n\s*formData,\n\s*userProfile\?\.uid \|\| 'user',\n\s*userProfile\?\.name \|\| 'User'\n\s*\);/,
  `await updateExpense(
          editingItem.id,
          {
             ...formData,
             amount: Number(formData.amount) || 0
          },
          userProfile?.uid || 'user',
          userProfile?.name || 'User'
        );`
);

// Keep modal open option for daily expense
const handleSubmitUpdate = `
      if (isDailyExpense && !editingItem) {
        if (window.confirm('Pengeluaran berhasil disimpan. Ingin input uang belanja lagi?')) {
          setFormData({
            ...formData,
            amount: '',
            description: '',
            receiptUrl: '',
            notes: ''
          });
          return; // keep modal open
        }
      }
      setShowModal(false);
`;
code = code.replace(/setShowModal\(false\);/, handleSubmitUpdate);

// Update Categories
const catReplace = `
  const categories: string[] = [
    'Operasional',
    'Transportasi',
    'Makan/Minum',
    'Sampel',
    'Perlengkapan',
    'Inventory',
    'Jasa',
    'Lainnya'
  ];
`;
code = code.replace(/const categories: ExpenseCategory\[\] = \[[\s\S]*?\];/, catReplace.trim());

// Render summary
const summaryReplace = `
  const todayDate = tanggalHariIni();
  const expensesToday = expenses.filter(e => e.date === todayDate);
  const sumTodaySharing = expensesToday.filter(e => e.scope === 'SHARING').reduce((acc, curr) => acc + curr.amount, 0);
  const sumTodayPribadi = expensesToday.filter(e => e.scope === 'PRIVATE' || e.scope === 'PRIBADI').reduce((acc, curr) => acc + curr.amount, 0);
  
  const sumMonthSharing = filteredExpenses.filter(e => e.scope === 'SHARING').reduce((acc, curr) => acc + curr.amount, 0);
  const sumMonthPribadi = filteredExpenses.filter(e => e.scope === 'PRIVATE' || e.scope === 'PRIBADI').reduce((acc, curr) => acc + curr.amount, 0);
`;
code = code.replace(/const totalAmount = filteredExpenses\.reduce\(\(sum, e\) => sum \+ e\.amount, 0\);/, summaryReplace.trim());

// Update Header to show buttons and summary
const headerReplace = `
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Pengeluaran & Belanja Harian
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Catatan biaya operasional, belanja harian, dan pengeluaran kantor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <Plus className="h-4 w-4" /> Pengeluaran Biasa
          </button>
          <button
            onClick={handleOpenDailyExpense}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
          >
            <DollarSign className="h-4 w-4" /> UANG BELANJA HARIAN
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">TOTAL BELANJA HARI INI</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-500 font-semibold mb-0.5">BELANJA SHARING</div>
              <div className="text-lg font-black text-emerald-600">{formatRupiah(sumTodaySharing)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-zinc-500 font-semibold mb-0.5">BELANJA PRIBADI</div>
              <div className="text-lg font-black text-blue-600">{formatRupiah(sumTodayPribadi)}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">TOTAL BELANJA BULAN INI</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-500 font-semibold mb-0.5">BELANJA SHARING</div>
              <div className="text-lg font-black text-emerald-600">{formatRupiah(sumMonthSharing)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-zinc-500 font-semibold mb-0.5">BELANJA PRIBADI</div>
              <div className="text-lg font-black text-blue-600">{formatRupiah(sumMonthPribadi)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-zinc-200 p-1.5 shadow-2xs">
`;
code = code.replace(/\{\/\* Header \*\/\}[\s\S]*?\{\/\* Scope Filter & Total \*\/\}\n\s*<div className="flex flex-col sm:flex-row items-center justify-between gap-3">/, headerReplace.trim());

// Remove old total box
code = code.replace(/<div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700">\n\s*Total Pengeluaran Bulan Ini: <span className="font-extrabold text-rose-600 text-sm ml-1">\{formatRupiah\(totalAmount\)\}<\/span>\n\s*<\/div>/, '');

// Update table cols
code = code.replace(/<th className="px-4 py-3">Scope<\/th>/, `<th className="px-4 py-3">Metode & Scope</th>`);

// Table rows
const trReplace = `
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={\`rounded-full px-2 py-0.5 text-[9px] font-bold \${
                          item.scope === 'SHARING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }\`}>
                          {item.scope}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-bold">{item.paymentMethod || 'TRANSFER'}</span>
                      </div>
                    </td>
`;
code = code.replace(/<td className="px-4 py-3.5">\n\s*<span\n\s*className=\{\`rounded-full px-2 py-0.5 text-\[10px\] font-bold \$\{\n\s*item\.scope === 'SHARING'\n\s*\? 'bg-emerald-100 text-emerald-800'\n\s*: 'bg-blue-100 text-blue-800'\n\s*\}\`\}\n\s*>\n\s*\{item\.scope\}\n\s*<\/span>\n\s*<\/td>/, trReplace.trim());

// Modal title
code = code.replace(/\{editingItem \? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'\}/, `{editingItem ? 'Edit Pengeluaran' : (isDailyExpense ? 'Input Uang Belanja Harian' : 'Catat Pengeluaran Baru')}`);

// Modal form
const formInject = `
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Beli kopi, atk, dll"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Scope</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as ScopeType })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5"
                  >
                    <option value="SHARING">SHARING</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Metode Bayar</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5"
                  >
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="CASH">CASH</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nominal (Rp)</label>
                  <CurrencyInput
                    value={formData.amount}
                    onChange={(val) => setFormData({ ...formData, amount: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-rose-600"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="catatan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5"
                />
              </div>
`;
code = code.replace(/<div>\n\s*<label className="block font-semibold text-zinc-700 mb-1">Tanggal<\/label>[\s\S]*?<\/div>\n\s*<div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">/, formInject.trim() + '\n              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">');

fs.writeFileSync('src/pages/PengeluaranPage.tsx', code);
