const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
code = code.replace(/badge\?: string;\n\}/, 'badge?: string;\n  allowedRoles?: string[];\n}');
fs.writeFileSync('src/components/Sidebar.tsx', code);
