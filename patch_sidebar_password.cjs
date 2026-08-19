const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const changePasswordBtn = `
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    // Emit a custom event or set a state? The easiest is to use a global custom event or create a simple modal right here in Sidebar.
                    window.dispatchEvent(new CustomEvent('OPEN_CHANGE_PASSWORD'));
                  }}
                  className="text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Ubah Password
                </button>
`;

code = code.replace(
  /<button\n\s*onClick=\{\(\) => \{\n\s*setIsProfileMenuOpen\(false\);\n\s*setActiveMenu\('pengaturan'\);\n\s*\}\}\n\s*className="text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"\n\s*>\n\s*Pengaturan Akun\n\s*<\/button>/,
  changePasswordBtn
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
