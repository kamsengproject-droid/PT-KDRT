const fs = require('fs');
let code = fs.readFileSync('src/pages/InputKomisiRealPage.tsx', 'utf8');

const importTarget = `import { tanggalHariIni } from '../utils/formatters';`;
if (!code.includes('OrphanTransactionAlert')) {
  code = code.replace(
    importTarget, 
    `${importTarget}\nimport { OrphanTransactionAlert } from '../components/finance/OrphanTransactionAlert';`
  );

  const injectTarget = `<div className="max-w-2xl mx-auto pb-12">`;
  code = code.replace(
    injectTarget,
    `${injectTarget}\n      <OrphanTransactionAlert />`
  );

  fs.writeFileSync('src/pages/InputKomisiRealPage.tsx', code);
}
