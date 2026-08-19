const fs = require('fs');
let code = fs.readFileSync('src/pages/PerformaHarianPage.tsx', 'utf8');

code = code.replace(/const \{ role \} = useAuth\(\);/, 'const { role, employeeProfile } = useAuth();');

const fetchInject = `
    const fetchAccounts = async () => {
      const q = query(collection(db, 'accounts'));
      const snap = await getDocs(q);
      let accs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
      
      if (role === 'EMPLOYEE' && employeeProfile?.permissions?.canViewSpecificAccounts && employeeProfile.permissions.canViewSpecificAccounts.length > 0) {
        accs = accs.filter(a => employeeProfile.permissions!.canViewSpecificAccounts!.includes(a.accountId || a.id));
      }
      
      setAccounts(accs);
    };
`;
code = code.replace(/const fetchAccounts = async \(\) => \{[\s\S]*?fetchAccounts\(\);/, fetchInject.trim() + '\n    fetchAccounts();');

// Only render allowed sections
const renderInject = `
  const canViewSharing = role !== 'EMPLOYEE' || (role === 'EMPLOYEE' && employeeProfile?.permissions?.canViewSharingOmset);
  const canViewPrivate = role === 'OWNER' || role === 'MANAGER';
`;
code = code.replace(/const metricsSharing = calculateMetrics\('SHARING'\);/, renderInject + '\n  const metricsSharing = calculateMetrics(\'SHARING\');');

code = code.replace(/\{renderSection\('SHARING', metricsSharing, true\)\}/, '{canViewSharing && renderSection(\'SHARING\', metricsSharing, true)}');
code = code.replace(/\{renderSection\('PRIVATE', metricsPrivate, false\)\}/, '{canViewPrivate && renderSection(\'PRIVATE\', metricsPrivate, false)}');


fs.writeFileSync('src/pages/PerformaHarianPage.tsx', code);
