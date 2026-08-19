const fs = require('fs');

function addImport(file) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes('CurrencyInput')) {
     return;
  }
  if (!text.includes('import { CurrencyInput }')) {
    text = text.replace(
      /import React[\s\S]*?;/,
      match => match + `\nimport { CurrencyInput } from '../components/CurrencyInput';`
    );
    fs.writeFileSync(file, text);
  }
}

addImport('src/pages/PengeluaranPage.tsx');
addImport('src/pages/PenggajianPage.tsx');
addImport('src/pages/SaldoAwalPage.tsx');

