const fs = require('fs');
let text = fs.readFileSync('src/pages/ArusKasPage.tsx', 'utf8');

text = text.replace(/saldoKasBersih/g, "saldoBerjalan");

fs.writeFileSync('src/pages/ArusKasPage.tsx', text);
