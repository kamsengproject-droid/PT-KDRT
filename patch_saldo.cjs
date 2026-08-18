const fs = require('fs');
let text = fs.readFileSync('src/pages/SaldoAwalPage.tsx', 'utf8');

text = text.replace("const referenceId = \\`OPENING_BALANCE_\\${formData.scope}_\\${formData.accountName.replace(/\\\\s+/g, '_').toUpperCase()}_\\${formData.date.replace(/-/g, '')}\\`;", "const referenceId = `OPENING_BALANCE_${formData.scope}_${formData.accountName.replace(/\\s+/g, '_').toUpperCase()}_${formData.date.replace(/-/g, '')}`;");

text = text.replace("<span className={\\`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black \\${tx.scope === 'SHARING' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}\\`}>", "<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${tx.scope === 'SHARING' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>");

fs.writeFileSync('src/pages/SaldoAwalPage.tsx', text);
