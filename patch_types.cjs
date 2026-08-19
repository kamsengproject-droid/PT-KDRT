const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /export interface AttendanceRecord \{/,
  `export interface AttendanceRecord {
  userId?: string;`
);

fs.writeFileSync('src/types.ts', code);
