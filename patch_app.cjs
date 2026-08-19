const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');

const importTarget = `import { PerformaHarianPage } from './pages/PerformaHarianPage';`;
if (!text.includes('InputKomisiRealPage')) {
  text = text.replace(importTarget, `${importTarget}\nimport { InputKomisiRealPage } from './pages/InputKomisiRealPage';`);
}

const caseTarget = `      case 'performa-harian':
        return <PerformaHarianPage />;`;
if (!text.includes('case \'input-komisi-real\':')) {
  text = text.replace(caseTarget, `${caseTarget}
      case 'input-komisi-real':
        if (role !== 'OWNER' && role !== 'MANAGER') {
          return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
              <Lock className="mx-auto h-10 w-10 text-rose-600 mb-2" />
              <h3 className="font-bold text-base">Akses Dibatasi</h3>
              <p className="text-xs text-rose-700 mt-1">
                Input Komisi Real hanya dapat diakses oleh Owner atau Manager.
              </p>
            </div>
          );
        }
        return <InputKomisiRealPage onBackToPortal={handleBackToPortal} />;`);
}

fs.writeFileSync('src/App.tsx', text);
