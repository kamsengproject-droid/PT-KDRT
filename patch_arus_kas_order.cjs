const fs = require('fs');
let text = fs.readFileSync('src/pages/ArusKasPage.tsx', 'utf8');

const search = `  const saldoBerjalan = saldoAwal + totalUangMasuk - totalUangKeluar;


  const totalUangKeluar = useMemo(() => {
    return activeTxs
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [activeTxs]);`;

const replace = `  const totalUangKeluar = useMemo(() => {
    return activeTxs
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [activeTxs]);

  const saldoBerjalan = saldoAwal + totalUangMasuk - totalUangKeluar;`;

text = text.replace(search, replace);
fs.writeFileSync('src/pages/ArusKasPage.tsx', text);
