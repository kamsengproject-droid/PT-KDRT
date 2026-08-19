const fs = require('fs');
let code = fs.readFileSync('src/pages/ArusKasPage.tsx', 'utf8');

code = code.replace(
  /import \{ formatRupiah, formatTanggal, bulanHariIni \} from '\.\.\/utils\/formatters';/,
  `import { formatRupiah, formatTanggal, bulanHariIni, formatBulanTahun } from '../utils/formatters';`
);

code = code.replace(
  /renderSection\('PRIVATE', 'ARUS KAS PRIBADI'/,
  `renderSection('PRIBADI', 'ARUS KAS PRIBADI'`
);

fs.writeFileSync('src/pages/ArusKasPage.tsx', code);
