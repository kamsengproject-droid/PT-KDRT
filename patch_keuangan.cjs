const fs = require('fs');
let text = fs.readFileSync('src/pages/KeuanganPage.tsx', 'utf8');

text = text.replace(/import \{ PengeluaranPage \} from '.\/PengeluaranPage';/, "import { PengeluaranPage } from './PengeluaranPage';\nimport { SaldoAwalPage } from './SaldoAwalPage';");

text = text.replace(/defaultTab\?: 'ARUS_KAS' \| 'PENGELUARAN' \| 'REKONSILIASI';/, "defaultTab?: 'ARUS_KAS' | 'PENGELUARAN' | 'REKONSILIASI' | 'SALDO_AWAL';");
text = text.replace(/const \[activeTab, setActiveTab\] = useState<'ARUS_KAS' \| 'PENGELUARAN' \| 'REKONSILIASI'>\(defaultTab\);/, "const [activeTab, setActiveTab] = useState<'ARUS_KAS' | 'PENGELUARAN' | 'REKONSILIASI' | 'SALDO_AWAL'>(defaultTab);");

text = text.replace(/: activeTab === 'REKONSILIASI'/, ": activeTab === 'SALDO_AWAL' ? 'SALDO AWAL & PENYESUAIAN' : activeTab === 'REKONSILIASI'");

const newTabs = `
        {role === 'OWNER' && (
          <button
            onClick={() => setActiveTab('SALDO_AWAL')}
            className={\`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all \${
              activeTab === 'SALDO_AWAL'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }\`}
          >
            <Wallet className="h-4 w-4 text-indigo-400" />
            <span>[ Saldo Awal ]</span>
          </button>
        )}
        {role === 'OWNER' && (`;
text = text.replace(/\{role === 'OWNER' && \(/, newTabs);

const newContent = `      {activeTab === 'ARUS_KAS' ? (
        <ArusKasPage />
      ) : activeTab === 'SALDO_AWAL' ? (
        <SaldoAwalPage />
      ) : activeTab === 'REKONSILIASI' ? (
        <RekonsiliasiKas />
      ) : (`;
text = text.replace(/\{activeTab === 'ARUS_KAS' \? \(\s*<ArusKasPage \/>\s*\) : activeTab === 'REKONSILIASI' \? \(/, newContent);

fs.writeFileSync('src/pages/KeuanganPage.tsx', text);
