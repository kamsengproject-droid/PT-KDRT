const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(/const \{ role, userProfile, logout \} = useAuth\(\);/, 'const { role, userProfile, employeeProfile, logout } = useAuth();');

const employeeMenuGen = `    // 1. Employee Specific Menu (Sederhana & Fokus)
    ...(isEmployee
      ? [
          {
            section: 'MENU KARYAWAN',
            items: [
              ...(employeeProfile?.permissions?.canViewAttendance !== false ? [{
                id: 'absensi-karyawan',
                label: 'Absensi',
                icon: CalendarCheck,
              }] : []),
              {
                id: 'kerjaan-harian',
                label: 'Kerjaan Hari Ini',
                icon: ClipboardList,
              },
              ...(employeeProfile?.permissions?.canViewSampleProducts !== false ? [{
                id: 'database-sampel',
                label: 'Produk Sampel',
                icon: Package,
              }] : []),
              ...(employeeProfile?.permissions?.canViewOmset ? [{
                id: 'performa-harian',
                label: 'Data Omset',
                icon: TrendingUp,
              }] : []),
              ...(employeeProfile?.permissions?.canInputCommissionReal ? [{
                id: 'input-komisi-real',
                label: 'Input Komisi Real',
                icon: DollarSign,
              }] : []),
            ],
          },
        ]
      : []),`;

code = code.replace(/\/\/ 1\. Employee Specific Menu \([\s\S]*?\: \[\]\),/m, employeeMenuGen);

// Fix role text
code = code.replace(/\{isEmployee \? 'Talent' \: role\}/, "{isEmployee ? (employeeProfile?.position || 'Employee') : role}");

fs.writeFileSync('src/components/Sidebar.tsx', code);
