const fs = require('fs');
let code = fs.readFileSync('src/pages/SaldoAwalPage.tsx', 'utf8');

code = code.replace(/const tx: Partial<FinancialTransaction> =/g, 'const tx: any =');

fs.writeFileSync('src/pages/SaldoAwalPage.tsx', code);
