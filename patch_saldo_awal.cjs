const fs = require('fs');
let text = fs.readFileSync('src/pages/SaldoAwalPage.tsx', 'utf8');

text = text.replace(/voidTransaction/g, 'deleteTransaction');
text = text.replace(/Dibatalkan oleh Owner/g, 'Dihapus oleh Owner (Saldo Awal)');
text = text.replace(/tx.status === 'VOID'/g, 'tx.status === "VOID"'); // just to avoid deleting if it's already deleted (which it shouldn't be now).

fs.writeFileSync('src/pages/SaldoAwalPage.tsx', text);
