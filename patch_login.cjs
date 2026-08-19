const fs = require('fs');
let text = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

// 1. Remove mode 'REGISTER', just default to LOGIN
text = text.replace(/const \[mode, setMode\] = useState<'LOGIN' \| 'REGISTER'>\('LOGIN'\);/, '');
text = text.replace(/mode === 'LOGIN'/g, 'true');
text = text.replace(/mode === 'REGISTER'/g, 'false');

// 2. Remove KD Box and Title section, replace with Image
const headerOld = `<div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-500 text-white font-black text-2xl shadow-xl shadow-orange-500/20 mb-4 border border-orange-400/30">
            KD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            KANTOR PT.KDRT
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Sistem Manajemen Bisnis & Operasional
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Mode Produksi Real • Firebase Auth</span>
          </div>
        </div>`;
const headerNew = `<div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/Logo_design_for_affiliate_company_202608190808.jpeg" 
            alt="PT KDRT Logo" 
            className="w-[150px] sm:w-[220px] h-auto object-contain mb-4 rounded-xl shadow-xl"
          />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            KANTOR PT.KDRT
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
            Selamat datang di sistem aplikasi KANTOR PT.KDRT
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium max-w-xs mx-auto leading-relaxed">
            Kelola operasional, keuangan, dan aktivitas kantor dalam satu sistem.
          </p>
        </div>`;
text = text.replace(headerOld, headerNew);

// 3. Remove Tab Switcher
const tabSwitcherOld = `{/* Tab Switcher: Login vs Register */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={\`py-2 px-3 text-xs font-bold rounded-lg transition-all \${
                true
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage(null);
              }}
              className={\`py-2 px-3 text-xs font-bold rounded-lg transition-all \${
                false
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
            >
              Daftar Akun Baru
            </button>
          </div>`;
const tabSwitcherNew = `<div className="text-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">Masuk Akun</h2>
          </div>`;
text = text.replace(tabSwitcherOld, tabSwitcherNew);

// 4. Remove Form Parts for Register
const registerFormOldRegex = /\{false && \(\s*<>\s*<div>[\s\S]*?<\/div>\s*<\/>\s*\)\}/;
text = text.replace(registerFormOldRegex, '');

// 5. Replace placeholders and error handling
text = text.replace(/placeholder="contoh: owner@kdrt.id \/ ferrymerry@kdrt.com"/g, 'placeholder="Masukkan email"');

const quickHelpRegex = /\{\/\* Quick Help for Team \/ Investor \*\/\}[\s\S]*?<\/div>/;
text = text.replace(quickHelpRegex, '');

// 6. Update submit button
text = text.replace(/\{true \? 'Masuk ke Sistem' : 'Daftarkan Akun'\}/g, "'Masuk ke Sistem'");
text = text.replace(/<span>Memproses Otentikasi\.\.\.<\/span>/g, "<span>Memproses...</span>");

// 7. Footer
text = text.replace(/PT\. KDRT MANAGEMENT • Hak Cipta Dilindungi/g, "PT. KDRT MANAGEMENT<br />Designed by Ko Kamseng");

// 8. Custom Error Handling in catch
const catchRegex = /catch \(\(error: any\) => \{[\s\S]*?\}\)/;
text = text.replace(catchRegex, `catch ((error: any) => {
        console.error('Auth Error:', error);
        setErrorMessage('Email atau kata sandi tidak sesuai.');
        setLoading(false);
      })`);

// 9. Remove default email values if any
text = text.replace(/const \[email, setEmail\] = useState\('owner@kamsengproject\.com'\);/, "const [email, setEmail] = useState('');");

fs.writeFileSync('src/pages/LoginPage.tsx', text);
