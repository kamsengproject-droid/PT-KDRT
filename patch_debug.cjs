const fs = require('fs');
let text = fs.readFileSync('src/pages/InvestorDashboardPage.tsx', 'utf8');

const debugCode = `  // DEBUG LOG SEMENTARA
  useEffect(() => {
    if (userProfile?.role === 'INVESTOR') {
      console.log('[INVESTOR_DEBUG]', {
        'Firebase UID': currentUser?.uid,
        'Role': userProfile?.role,
        'Selected Period': \`\${year}-\${month.padStart(2, '0')}\`,
        'Income Query Result Count': sharingTransactions.filter(t => t.type === 'INCOME').length,
        'Expense Query Result Count': sharingTransactions.filter(t => t.type === 'EXPENSE').length,
        'Performance Query Result Count': performances.length,
        'Account Query Result Count': accounts.length,
        'Investor Settlement Result Count': settlements.length
      });
    }
  }, [currentUser?.uid, userProfile?.role, year, month, sharingTransactions, performances, accounts, settlements]);`;

const target = `  // All-time Cumulative Investor metrics`;
text = text.replace(target, `${debugCode}\n\n${target}`);

fs.writeFileSync('src/pages/InvestorDashboardPage.tsx', text);
