const fs = require('fs');
let text = fs.readFileSync('src/types.ts', 'utf8');

text = text.replace(/export type TransactionType = 'INCOME' \| 'EXPENSE';/g, "export type TransactionType = 'INCOME' | 'EXPENSE' | 'OPENING_BALANCE';");
text = text.replace(/  \| 'OTHER';/g, "  | 'OTHER'\n  | 'OPENING_BALANCE';");

fs.writeFileSync('src/types.ts', text);
