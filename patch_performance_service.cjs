const fs = require('fs');
let text = fs.readFileSync('src/services/performanceService.ts', 'utf8');

text = text.replace(/category: 'COMMISSION_REAL',/, "category: 'KOMISI TIKTOK',\n        sourceType: 'TIKTOK_COMMISSION',\n        accountName: entry.accountName,");

fs.writeFileSync('src/services/performanceService.ts', text);
