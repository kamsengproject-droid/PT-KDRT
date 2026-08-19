const fs = require('fs');
let code = fs.readFileSync('src/pages/InputKomisiRealPage.tsx', 'utf8');
code = code.replace(/a\.accountId \|\| a\.id/g, 'a.id');
fs.writeFileSync('src/pages/InputKomisiRealPage.tsx', code);

code = fs.readFileSync('src/pages/PerformaHarianPage.tsx', 'utf8');
code = code.replace(/a\.accountId \|\| a\.id/g, 'a.id');
fs.writeFileSync('src/pages/PerformaHarianPage.tsx', code);
