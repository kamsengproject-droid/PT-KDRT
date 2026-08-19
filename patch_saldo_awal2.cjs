const fs = require('fs');
let code = fs.readFileSync('src/pages/SaldoAwalPage.tsx', 'utf8');

// fix deleteTransaction signature
code = code.replace(
  /await deleteTransaction\(tx\.id!, uid, name, 'Dihapus oleh Owner \(Saldo Awal\)'\);/,
  `await deleteTransaction(tx.id!, tx, 'Dihapus oleh Owner (Saldo Awal)', uid, name);`
);

// fix description property in addTransaction
code = code.replace(
  /scope: formData\.scope as any,\n\s*accountName: formData\.accountName,\n\s*notes: formData\.notes,\n\s*referenceId/g,
  `scope: formData.scope as any,\n        accountName: formData.accountName,\n        description: formData.notes,\n        notes: formData.notes,\n        referenceId`
);

fs.writeFileSync('src/pages/SaldoAwalPage.tsx', code);
