const fs = require('fs');
let code = fs.readFileSync('src/pages/KaryawanPage.tsx', 'utf8');

// Allow Employee to edit their own profile
code = code.replace(
  /\{role === 'OWNER' && \(\n\s*<div className="flex items-center gap-2">/,
  `{(role === 'OWNER' || role === 'EMPLOYEE') && (
                <div className="flex items-center gap-2">`
);

code = code.replace(
  /\{role === 'OWNER' && \(\n\s*<button\n\s*onClick=\{\(\) => handleOpenEdit\(selectedEmployee\)\}/,
  `{(role === 'OWNER' || role === 'EMPLOYEE') && (
                  <button
                    onClick={() => handleOpenEdit(selectedEmployee)}`
);

// Lock sensitive fields in the form if role is EMPLOYEE
const lockFields = `
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={role === 'EMPLOYEE'}
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
`;
code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n\s*<div>\n\s*<label className="block font-bold text-slate-700 mb-1">\n\s*Jabatan Resmi <span className="text-rose-500">\*<\/span>\n\s*<\/label>\n\s*<input\n\s*type="text"\n\s*required\n\s*value=\{formData\.position\}\n\s*onChange=\{\(e\) => setFormData\(\{ \.\.\.formData, position: e\.target\.value \}\)\}/,
  lockFields
);

const lockSalary = `
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gaji Pokok (Base Salary)
                  </label>
                  <CurrencyInput
                    value={formData.baseSalary}
                    disabled={role === 'EMPLOYEE'}
                    onChange={(val) => setFormData({ ...formData, baseSalary: val === '' ? 0 : Number(val) })}
`;
code = code.replace(
  /<div>\n\s*<label className="block font-bold text-slate-700 mb-1">\n\s*Gaji Pokok \(Base Salary\)\n\s*<\/label>\n\s*<CurrencyInput\n\s*value=\{formData\.baseSalary\}\n\s*onChange=\{\(val\) => setFormData\(\{ \.\.\.formData, baseSalary: val === '' \? 0 : Number\(val\) \}\)\}/,
  lockSalary
);

const lockAppRole = `
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Role Aplikasi <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={role === 'EMPLOYEE'}
                  value={formData.appRole}
`;
code = code.replace(
  /<div>\n\s*<label className="block font-bold text-slate-700 mb-1">\n\s*Role Aplikasi <span className="text-rose-500">\*<\/span>\n\s*<\/label>\n\s*<select\n\s*required\n\s*value=\{formData\.appRole\}/,
  lockAppRole
);

const lockUserId = `
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  UID Firebase (User ID)
                </label>
                <input
                  type="text"
                  disabled={role === 'EMPLOYEE'}
                  value={formData.userId}
`;
code = code.replace(
  /<div>\n\s*<label className="block font-bold text-slate-700 mb-1">\n\s*UID Firebase \(User ID\)\n\s*<\/label>\n\s*<input\n\s*type="text"\n\s*value=\{formData\.userId\}/,
  lockUserId
);

const hideDisableButtonForEmployee = `
                  {role === 'OWNER' && (
                    <button
                      onClick={() => handleToggleStatus(selectedEmployee)}
`;
code = code.replace(
  /<button\n\s*onClick=\{\(\) => handleToggleStatus\(selectedEmployee\)\}/,
  hideDisableButtonForEmployee
);

const fixHideDisableClose = `                      <span>{selectedEmployee.active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  )}`;
code = code.replace(
  /<span>\{selectedEmployee\.active \? 'Nonaktifkan' : 'Aktifkan'\}<\/span>\n\s*<\/button>/,
  fixHideDisableClose
);

fs.writeFileSync('src/pages/KaryawanPage.tsx', code);
