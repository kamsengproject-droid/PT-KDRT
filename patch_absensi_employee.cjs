const fs = require('fs');
const path = 'src/pages/AbsensiEmployeePage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/\{\/\* TESTING TOOLBAR[\s\S]*?\{\/\* =+ \*\/\}\s*\{\/\* 2\. PANEL GPS/g, '{/* ========================================================================= */}\n      {/* 2. PANEL GPS');

fs.writeFileSync(path, code);
