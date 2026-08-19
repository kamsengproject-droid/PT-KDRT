const fs = require('fs');
let code = fs.readFileSync('src/services/transactionService.ts', 'utf8');

code = code.replace(
  /updateDoc,/g,
  'updateDoc, deleteDoc,'
);

fs.writeFileSync('src/services/transactionService.ts', code);
