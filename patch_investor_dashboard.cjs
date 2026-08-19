const fs = require('fs');
let text = fs.readFileSync('src/pages/InvestorDashboardPage.tsx', 'utf8');

// 1. Add missing imports
if (!text.includes('subscribeDailyPerformance')) {
  text = text.replace(
    `import { subscribeTransactions } from '../services/transactionService';`,
    `import { subscribeTransactions } from '../services/transactionService';
import { subscribeDailyPerformance } from '../services/performanceService';
import { subscribeProducts } from '../services/productService';
import { subscribeAccounts } from '../services/accountService';
import { DailyPerformance, Product, Account } from '../types';
import { tanggalHariIni } from '../utils/formatters';`
  );
}

// 2. Add state
const stateInsert = `  const [sharingTransactions, setSharingTransactions] = useState<FinancialTransaction[]>([]);`;
if (!text.includes('setPerformances')) {
  text = text.replace(stateInsert, `${stateInsert}
  const [performances, setPerformances] = useState<DailyPerformance[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);`);
}

// 3. Add subscriptions
const subInsert = `    const unsubTx = subscribeTransactions(
      { scope: 'SHARING', status: 'ACTIVE' },
      setSharingTransactions
    );`;
if (!text.includes('subscribeDailyPerformance(')) {
  text = text.replace(subInsert, `${subInsert}
    const unsubPerf = subscribeDailyPerformance('SHARING', setPerformances);
    const unsubProd = subscribeProducts('SHARING', setProducts);
    const unsubAcc = subscribeAccounts('SHARING', setAccounts);`);
}

const unsubInsert = `      unsubTx();`;
if (!text.includes('unsubPerf()')) {
  text = text.replace(unsubInsert, `${unsubInsert}
      unsubPerf();
      unsubProd();
      unsubAcc();`);
}

// 4. Calculate metrics
const calcInsert = `  // All-time Cumulative Investor metrics`;
if (!text.includes('gmvBulanIni')) {
  text = text.replace(calcInsert, `  // Performance metrics for current month & today
  const { gmvHariIni, komisiRealHariIni, gmvBulanIni, komisiRealBulanIni } = useMemo(() => {
    const today = tanggalHariIni();
    const periodPrefix = \`\${year}-\${month.padStart(2, '0')}\`;
    
    let gHariIni = 0;
    let kHariIni = 0;
    let gBulanIni = 0;
    let kBulanIni = 0;

    performances.forEach((p) => {
      if (p.date === today) {
        gHariIni += p.gmv || 0;
        kHariIni += p.commissionReal || 0;
      }
      if (p.date?.startsWith(periodPrefix)) {
        gBulanIni += p.gmv || 0;
        kBulanIni += p.commissionReal || 0;
      }
    });

    return { gmvHariIni: gHariIni, komisiRealHariIni: kHariIni, gmvBulanIni: gBulanIni, komisiRealBulanIni: kBulanIni };
  }, [performances, year, month]);

  ${calcInsert}`);
}

// 5. Add UI elements for Performance
const uiInsert = `      {/* 2. Cumulative All-Time Metrics */}`;
if (!text.includes('Performa Sharing & Sales')) {
  const newUI = `      {/* 1.5 Performance Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          Performa Sharing & Sales (Berdasarkan Laporan Harian)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">GMV Hari Ini</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">{formatRupiah(gmvHariIni)}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Komisi Real Hari Ini</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">{formatRupiah(komisiRealHariIni)}</span>
          </div>
          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200">
            <span className="text-[10px] font-bold uppercase text-indigo-700 block">GMV Bulan Ini</span>
            <span className="text-xl font-black text-indigo-950 mt-1 block">{formatRupiah(gmvBulanIni)}</span>
          </div>
          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200">
            <span className="text-[10px] font-bold uppercase text-indigo-700 block">Komisi Real Bulan Ini</span>
            <span className="text-xl font-black text-indigo-950 mt-1 block">{formatRupiah(komisiRealBulanIni)}</span>
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
`;
  text = text.replace(uiInsert, `${newUI}\n\n${uiInsert}`);
}

fs.writeFileSync('src/pages/InvestorDashboardPage.tsx', text);
