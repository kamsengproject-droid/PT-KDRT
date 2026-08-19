const fs = require('fs');
let code = fs.readFileSync('src/components/finance/RekonsiliasiKas.tsx', 'utf8');

code = code.replace(/<option value="ALL">GABUNGAN \(SEMUA\)<\/option>/g, '');
code = code.replace(/const \[selectedScope, setSelectedScope\] = useState<'ALL' \| 'SHARING' \| 'PRIBADI'>\('ALL'\);/, `const [selectedScope, setSelectedScope] = useState<'SHARING' | 'PRIBADI'>('SHARING');`);

fs.writeFileSync('src/components/finance/RekonsiliasiKas.tsx', code);
