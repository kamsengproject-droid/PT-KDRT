const fs = require('fs');

// --- Sidebar.tsx ---
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebar = sidebar.replace(
  `{
                id: 'performa-harian',
                label: 'Performa Akun',
                icon: TrendingUp,
              },`,
  `{
                id: 'performa-harian',
                label: 'Data Omset',
                icon: TrendingUp,
              },
              {
                id: 'input-komisi-real',
                label: 'Input Komisi Real',
                icon: TrendingUp,
                allowedRoles: ['OWNER', 'MANAGER'],
              },`
);

sidebar = sidebar.replace(
  `{
                id: 'database-sampel',
                label: 'Database Sampel',
                icon: Package,
              },`,
  `{
                id: 'database-sampel',
                label: 'Produk Sampel',
                icon: Package,
              },`
);
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

// --- PortalHomePage.tsx ---
let portal = fs.readFileSync('src/pages/PortalHomePage.tsx', 'utf8');

portal = portal.replace(/Performa Harian/g, 'Data Omset');
portal = portal.replace(/Performa Akun/g, 'Data Omset');
portal = portal.replace(/Database Sampel/g, 'Produk Sampel');

// Add Input Komisi Real to the portal menu modules if Owner/Manager
const inputKomisiRealModule = `
    {
      id: 'input-komisi-real',
      title: 'Input Komisi Real',
      desc: 'Form input komisi & omset harian',
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      action: () => onNavigate('input-komisi-real'),
    },`;

// We inject this after 'performa-harian' object in OWNER block
const ownerBlockSplit = portal.split("id: 'performa-harian',");
if (ownerBlockSplit.length > 1) {
  // It appears multiple times (OWNER, MANAGER, INVESTOR). We need a better regex.
}

fs.writeFileSync('src/pages/PortalHomePage.tsx', portal);

