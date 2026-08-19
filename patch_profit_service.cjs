const fs = require('fs');
let code = fs.readFileSync('src/services/profitSharingService.ts', 'utf8');

code = code.replace(/voidTransaction/g, 'deleteTransaction');
fs.writeFileSync('src/services/profitSharingService.ts', code);
