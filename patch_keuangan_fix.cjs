const fs = require('fs');
let text = fs.readFileSync('src/pages/KeuanganPage.tsx', 'utf8');

const search = `      {activeTab === 'ARUS_KAS' ? (
        <ArusKasPage />
      ) : activeTab === 'SALDO_AWAL' ? (
        <SaldoAwalPage />
      ) : activeTab === 'REKONSILIASI' ? (
        <RekonsiliasiKas />
      ) : (
        <RekonsiliasiKas />
      ) : (
        <PengeluaranPage />
      )}`;

const replace = `      {activeTab === 'ARUS_KAS' ? (
        <ArusKasPage />
      ) : activeTab === 'SALDO_AWAL' ? (
        <SaldoAwalPage />
      ) : activeTab === 'REKONSILIASI' ? (
        <RekonsiliasiKas />
      ) : (
        <PengeluaranPage />
      )}`;

text = text.replace(search, replace);
fs.writeFileSync('src/pages/KeuanganPage.tsx', text);
