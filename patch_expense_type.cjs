const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(/export interface Expense \{/, "export interface Expense {\n  sourceType?: string;");

fs.writeFileSync('src/types.ts', code);
