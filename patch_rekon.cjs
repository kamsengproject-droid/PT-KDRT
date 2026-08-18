const fs = require('fs');
let text = fs.readFileSync('src/components/finance/RekonsiliasiKas.tsx', 'utf8');

const oldFilter = `  // Hitung saldo sistem kumulatif sampai tanggal/bulan yang dipilih
  const filteredTxs = transactions.filter((t) => t.date <= reconcileDate);`;

const newFilter = `  // Hitung saldo sistem kumulatif sampai tanggal/bulan yang dipilih
  const filteredTxs = transactions.filter((t) => t.date <= reconcileDate && (t.status || 'ACTIVE') === 'ACTIVE');`;

text = text.replace(oldFilter, newFilter);
fs.writeFileSync('src/components/finance/RekonsiliasiKas.tsx', text);
