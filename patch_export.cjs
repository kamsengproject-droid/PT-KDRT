const fs = require('fs');
let code = fs.readFileSync('src/pages/ExportCenterPage.tsx', 'utf8');

const filterCode = `  const matchFilter = (item: any) => {
    // Exclude void records
    if (item.status === 'VOID') return false;
`;

code = code.replace(/const matchFilter = \(item: any\) => \{/g, filterCode);
fs.writeFileSync('src/pages/ExportCenterPage.tsx', code);
