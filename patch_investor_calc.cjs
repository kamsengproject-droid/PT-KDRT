const fs = require('fs');
let text = fs.readFileSync('src/services/profitSharingService.ts', 'utf8');

const search = `  // 1. Fetch transactions where scope == 'SHARING' and status == 'ACTIVE'
  const q = query(
    collection(db, 'transactions'),
    where('scope', '==', 'SHARING'),
    where('status', '==', 'ACTIVE')
  );
  const snap = await getDocs(q);`;

const replace = `  // 1. Fetch transactions where scope == 'SHARING' and status == 'ACTIVE'
  const q = query(
    collection(db, 'transactions'),
    where('scope', '==', 'SHARING')
  );
  const snap = await getDocs(q);`;

text = text.replace(search, replace);

const searchLoop = `  snap.forEach((docSnap) => {
    const data = docSnap.data() as FinancialTransaction;
    if (data.date && data.date.startsWith(periodPrefix)) {
      if (data.type === 'INCOME') {
        totalIncome += Number(data.amount) || 0;
      } else if (data.type === 'EXPENSE') {
        totalExpense += Number(data.amount) || 0;
      }
    }
  });`;

const replaceLoop = `  snap.forEach((docSnap) => {
    const data = docSnap.data() as FinancialTransaction;
    // Client-side filter for ACTIVE status to handle legacy documents without status field
    if ((data.status || 'ACTIVE') !== 'ACTIVE') return;
    
    if (data.date && data.date.startsWith(periodPrefix)) {
      if (data.type === 'INCOME') {
        totalIncome += Number(data.amount) || 0;
      } else if (data.type === 'EXPENSE') {
        totalExpense += Number(data.amount) || 0;
      }
    }
  });`;

text = text.replace(searchLoop, replaceLoop);

fs.writeFileSync('src/services/profitSharingService.ts', text);
