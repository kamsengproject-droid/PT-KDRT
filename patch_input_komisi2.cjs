const fs = require('fs');
let code = fs.readFileSync('src/pages/InputKomisiRealPage.tsx', 'utf8');

code = code.replace(/const \{ currentUser, userProfile \} = useAuth\(\);/, 'const { currentUser, userProfile, employeeProfile, role } = useAuth();');

const fetchInject = `
    const fetchAccounts = async () => {
      const q = query(collection(db, 'accounts'));
      const snap = await getDocs(q);
      let accs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
      
      // Filter for specific employee permissions
      if (role === 'EMPLOYEE' && employeeProfile?.permissions?.canViewSpecificAccounts && employeeProfile.permissions.canViewSpecificAccounts.length > 0) {
        accs = accs.filter(a => employeeProfile.permissions!.canViewSpecificAccounts!.includes(a.accountId || a.id));
      }
      
      setAccounts(accs);
      
      // Auto-select if only 1 account
      if (accs.length === 1) {
        setFormData(prev => ({
          ...prev,
          accountId: accs[0].id,
          accountName: accs[0].accountName,
          scope: accs[0].scope || 'SHARING'
        }));
      }
      setLoading(false);
    };
`;
code = code.replace(/const fetchAccounts = async \(\) => \{[\s\S]*?fetchAccounts\(\);/, fetchInject.trim() + '\n    fetchAccounts();');

fs.writeFileSync('src/pages/InputKomisiRealPage.tsx', code);
