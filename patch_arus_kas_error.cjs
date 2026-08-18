const fs = require('fs');
let text = fs.readFileSync('src/pages/SaldoAwalPage.tsx', 'utf8');

text = text.replace(/import \{ subscribeTransactions, addTransaction, voidTransaction \} from '\.\.\/services\/transactionService';/, "import { subscribeTransactions, createFinancialTransaction as addTransaction, voidTransaction } from '../services/transactionService';");

fs.writeFileSync('src/pages/SaldoAwalPage.tsx', text);

let arusText = fs.readFileSync('src/pages/ArusKasPage.tsx', 'utf8');
arusText = arusText.replace(/const saldoKasBersih = totalUangMasuk - totalUangKeluar;/g, "const saldoKasBersih = saldoBerjalan;");
fs.writeFileSync('src/pages/ArusKasPage.tsx', arusText);
