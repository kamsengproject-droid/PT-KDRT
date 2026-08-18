const fs = require('fs');
let text = fs.readFileSync('src/pages/PerformaHarianPage.tsx', 'utf8');

text = text.replace(/realCommission: performance\.realCommission \|\| '',estimatedCommission: performance\.estimatedCommission \|\| '',gmv: performance\.gmv \|\| '',/, "");

fs.writeFileSync('src/pages/PerformaHarianPage.tsx', text);
