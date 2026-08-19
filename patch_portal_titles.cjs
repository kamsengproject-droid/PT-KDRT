const fs = require('fs');
let text = fs.readFileSync('src/pages/PortalHomePage.tsx', 'utf8');

text = text.replace(/PERFORMA AKUN/g, 'DATA OMSET');
text = text.replace(/DATABASE SAMPEL/g, 'PRODUK SAMPEL');

// Add Input Komisi Real
const inputKomisiRealItem = `    {
      id: 'input-komisi-real',
      title: 'INPUT KOMISI REAL',
      icon: TrendingUp,
      desc: 'Input omset harian dan komisi.',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      action: () => onNavigate('input-komisi-real'),
    },
`;

text = text.replace(
  /id: 'performa-harian',\n      title: 'DATA OMSET',\n      icon: TrendingUp,\n      desc: 'GMV, Estimasi Komisi, Komisi Real dan analisa harian per akun.',\n      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',\n      action: \(\) => onNavigate\('performa-harian'\),\n    },/g,
  `id: 'performa-harian',
      title: 'DATA OMSET',
      icon: TrendingUp,
      desc: 'GMV, Estimasi Komisi, Komisi Real dan analisa harian per akun.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('performa-harian'),
    },
${inputKomisiRealItem}`
);

text = text.replace(
  /id: 'performa-harian',\n      title: 'DATA OMSET',\n      icon: TrendingUp,\n      desc: 'GMV, Estimasi Komisi, Komisi Real akun Sharing & tim.',\n      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',\n      action: \(\) => onNavigate\('performa-harian'\),\n    },/g,
  `id: 'performa-harian',
      title: 'DATA OMSET',
      icon: TrendingUp,
      desc: 'GMV, Estimasi Komisi, Komisi Real akun Sharing & tim.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => onNavigate('performa-harian'),
    },
${inputKomisiRealItem}`
);

fs.writeFileSync('src/pages/PortalHomePage.tsx', text);
