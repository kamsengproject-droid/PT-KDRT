const fs = require('fs');
let code = fs.readFileSync('src/pages/DatabaseSampelPage.tsx', 'utf8');

code = code.replace(/const \{ userProfile, role, loading: authLoading, currentUser \} = useAuth\(\);/, 'const { userProfile, role, loading: authLoading, currentUser, employeeProfile } = useAuth();');

code = code.replace(
  /\{\/\* Option 1: Master Produk \*\/\}/,
  `{!isEmployee && (
                    <>
                    {/* Option 1: Master Produk */}`
);

code = code.replace(
  /\{\/\* Option 2: Sampel Produk \*\/\}/,
  `</>
                    )}
                    {/* Option 2: Sampel Produk */}`
);

// If they shouldn't even see the TAMBAH PRODUK button
code = code.replace(
  /\{!isInvestor && \(\n\s*<div className="relative">\n\s*<button\n\s*onClick=\{\(\) => setShowAddChooser\(true\)\}/,
  `{!isInvestor && (role !== 'EMPLOYEE' || employeeProfile?.permissions?.canCreateSampleProduct) && (
          <div className="relative">
            <button
              onClick={() => setShowAddChooser(true)}`
);


fs.writeFileSync('src/pages/DatabaseSampelPage.tsx', code);
