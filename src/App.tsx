import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PortalHomePage } from './pages/PortalHomePage';
import { AbsensiEmployeePage } from './pages/AbsensiEmployeePage';
import { RiwayatAbsensiPage } from './pages/RiwayatAbsensiPage';
import { SlipGajiEmployeePage } from './pages/SlipGajiEmployeePage';
import { KaryawanPage } from './pages/KaryawanPage';
import { AbsensiOwnerPage } from './pages/AbsensiOwnerPage';
import { UangRajinPage } from './pages/UangRajinPage';
import { PenggajianPage } from './pages/PenggajianPage';
import { PengaturanKantorPage } from './pages/PengaturanKantorPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { DashboardSharingPage } from './pages/DashboardSharingPage';
import { DashboardPribadiPage } from './pages/DashboardPribadiPage';
import { AkunPage } from './pages/AkunPage';
import { PerformaHarianPage } from './pages/PerformaHarianPage';
import { InputKomisiRealPage } from './pages/InputKomisiRealPage';
import { KeuanganPage } from './pages/KeuanganPage';
import { ArusKasPage } from './pages/ArusKasPage';
import { PengeluaranPage } from './pages/PengeluaranPage';
import { ProfitSharingPage } from './pages/ProfitSharingPage';
import { InvestorDashboardPage } from './pages/InvestorDashboardPage';
import { SampelInventoryPage } from './pages/SampelInventoryPage';
import { DatabaseSampelPage } from './pages/DatabaseSampelPage';
import { PenataanLokasiPage } from './pages/PenataanLokasiPage';
import { ProdukPage } from './pages/ProdukPage';
import { SampelPage } from './pages/SampelPage';
import { InventoryPage } from './pages/InventoryPage';
import { JadwalKontenPage } from './pages/JadwalKontenPage';
import { LaporanPage } from './pages/LaporanPage';
import { ExportCenterPage } from './pages/ExportCenterPage';
import { TutupBulanPage } from './pages/TutupBulanPage';
import { KerjaanHarianPage } from './pages/KerjaanHarianPage';
import { ProfilSayaPage } from './pages/ProfilSayaPage';
import { InputManualOwnerPage } from './pages/InputManualOwnerPage';
import { LoginPage } from './pages/LoginPage';
import { Lock } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, role, userProfile, loading } = useAuth();
  // Default to the flagship "Portal Aplikasi Kantor" or "investor-dashboard" for Investor
  const [activeMenu, setActiveMenu] = useState<string>(role === 'INVESTOR' ? 'investor-dashboard' : 'portal');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedProductIdForSample, setSelectedProductIdForSample] = useState<string | undefined>(undefined);

  // Auto direct investor to investor dashboard
  React.useEffect(() => {
    if (role === 'INVESTOR' && activeMenu === 'portal') {
      setActiveMenu('investor-dashboard');
    }
  }, [role, activeMenu]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4 font-sans text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent shadow-md" />
        <div className="text-center">
          <p className="text-sm font-bold text-slate-100">Memuat Sesi PT.KDRT...</p>
          <p className="text-xs text-slate-400 mt-1">Sinkronisasi autentikasi dan database Firestore</p>
        </div>
      </div>
    );
  }

  // Unauthenticated user -> display Login Page
  if (!currentUser || !userProfile) {
    return <LoginPage />;
  }

  const handleBackToPortal = () => {
    setActiveMenu('portal');
  };

  const handleNavigateToSampel = (productId?: string) => {
    setSelectedProductIdForSample(productId);
    setActiveMenu('sampel');
  };

  const handleNavigateToProduk = () => {
    setActiveMenu('produk');
  };

  // Render current view
  const renderContent = () => {
    // ---------------------------------------------------------
    // RESTRICTION UNTUK ROLE EMPLOYEE
    // ---------------------------------------------------------
    if (role === 'EMPLOYEE') {
      const allowedForEmployee = [
        'portal',
        'absensi-karyawan',
        'riwayat-absensi',
        'slip-gaji-karyawan',
        'profil-saya',
        'kerjaan-harian',
        'database-sampel',
        'penataan-lokasi',
        'lokasi-sampel',
        'produk',
        'sampel',
        'sampel-inventory'
      ];
      if (!allowedForEmployee.includes(activeMenu)) {
        return (
          <div className="flex h-screen items-center justify-center p-8">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900 max-w-sm shadow-sm">
              <Lock className="mx-auto h-10 w-10 text-rose-600 mb-2" />
              <h3 className="font-bold text-base">Akses Dibatasi</h3>
              <p className="text-sm text-rose-700 mt-2">
                Halaman ini tidak tersedia untuk Karyawan. Anda hanya memiliki akses ke modul yang diizinkan.
              </p>
            </div>
          </div>
        );
      }
    }

    switch (activeMenu) {
      // Flagship Portal
      case 'portal':
        return <PortalHomePage onNavigate={(menuId) => setActiveMenu(menuId)} />;

      // 1. Employee Specific Modules
      case 'absensi-karyawan':
        return <AbsensiEmployeePage />;
      case 'riwayat-absensi':
        return <RiwayatAbsensiPage />;
      case 'slip-gaji-karyawan':
        return <SlipGajiEmployeePage />;
      case 'profil-saya':
        return <ProfilSayaPage onBackToPortal={handleBackToPortal} />;
      case 'data-saya':
        if (role === 'EMPLOYEE') {
          return <ProfilSayaPage onBackToPortal={handleBackToPortal} />;
        }
        return (
          <KaryawanPage
            onBackToPortal={handleBackToPortal}
            initialSelectedEmployeeId={userProfile?.employeeId || userProfile?.uid}
          />
        );

      // 2. Business & Finance Modules
      case 'keuangan':
        return <KeuanganPage onBackToPortal={handleBackToPortal} />;
      case 'arus-kas':
        return <KeuanganPage onBackToPortal={handleBackToPortal} defaultTab="ARUS_KAS" />;
      case 'pengeluaran':
        return <KeuanganPage onBackToPortal={handleBackToPortal} defaultTab="PENGELUARAN" />;
      case 'profit-sharing':
        if (role === 'INVESTOR') {
          return <InvestorDashboardPage onBackToPortal={handleBackToPortal} />;
        }
        if (role !== 'OWNER' && role !== 'MANAGER') {
          return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
              <Lock className="mx-auto h-10 w-10 text-rose-600 mb-2" />
              <h3 className="font-bold text-base">Akses Dibatasi</h3>
              <p className="text-xs text-rose-700 mt-1">
                Kalkulator dan Settlement Profit Sharing hanya dapat diakses oleh Akun Owner / Manager PT.KDRT.
              </p>
            </div>
          );
        }
        return <ProfitSharingPage onBackToPortal={handleBackToPortal} />;
      case 'investor-dashboard':
        return <InvestorDashboardPage onBackToPortal={handleBackToPortal} />;
      case 'akun':
        return <AkunPage />;
      case 'performa-harian':
        return <PerformaHarianPage />;
      case 'input-komisi-real':
        if (role !== 'OWNER' && role !== 'MANAGER') {
          return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
              <Lock className="mx-auto h-10 w-10 text-rose-600 mb-2" />
              <h3 className="font-bold text-base">Akses Dibatasi</h3>
              <p className="text-xs text-rose-700 mt-1">
                Input Komisi Real hanya dapat diakses oleh Owner atau Manager.
              </p>
            </div>
          );
        }
        return <InputKomisiRealPage onBackToPortal={handleBackToPortal} />;
      case 'input-manual':
        if (role !== 'OWNER') {
          return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
              <Lock className="mx-auto h-10 w-10 text-rose-600 mb-2" />
              <h3 className="font-bold text-base">Akses Dibatasi</h3>
              <p className="text-xs text-rose-700 mt-1">
                Menu Input Manual hanya dapat diakses oleh Akun Owner PT.KDRT.
              </p>
            </div>
          );
        }
        return <InputManualOwnerPage onBackToPortal={handleBackToPortal} />;
      case 'dashboard-sharing':
      case 'keuangan-sharing':
        return role === 'INVESTOR' ? (
          <InvestorDashboardPage onBackToPortal={handleBackToPortal} />
        ) : (
          <DashboardSharingPage />
        );
      case 'dashboard-pribadi':
        if (role !== 'OWNER') {
          return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
              <Lock className="mx-auto h-10 w-10 text-rose-600 mb-2" />
              <h3 className="font-bold text-base">Akses Dibatasi</h3>
              <p className="text-xs text-rose-700 mt-1">
                Dashboard Pribadi hanya dapat diakses oleh Akun Owner PT.KDRT.
              </p>
            </div>
          );
        }
        return <DashboardPribadiPage />;

      // 3. Operational & HR Modules
      case 'karyawan':
        return <KaryawanPage onBackToPortal={handleBackToPortal} />;
      case 'absensi-owner':
        return <AbsensiOwnerPage />;
      case 'uang-rajin':
        return <UangRajinPage />;
      case 'penggajian':
        if (role !== 'OWNER') {
          return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
              <Lock className="mx-auto h-10 w-10 text-rose-600 mb-2" />
              <h3 className="font-bold text-base">Akses Dibatasi</h3>
              <p className="text-xs text-rose-700 mt-1">
                Halaman penggajian hanya dapat diakses oleh Owner.
              </p>
            </div>
          );
        }
        return <PenggajianPage />;

      // 4. Products, Sample, Tasks, Schedule & Reports
      case 'database-sampel':
        return <DatabaseSampelPage onBackToPortal={handleBackToPortal} />;
      case 'penataan-lokasi':
      case 'lokasi-sampel':
        return <PenataanLokasiPage onBackToPortal={handleBackToPortal} />;
      case 'produk':
        return <DatabaseSampelPage onBackToPortal={handleBackToPortal} initialTab="PRODUK" />;
      case 'sampel':
      case 'sampel-inventory':
        return <DatabaseSampelPage onBackToPortal={handleBackToPortal} initialTab="SAMPEL" />;
      case 'kerjaan-harian':
        return <KerjaanHarianPage onBackToPortal={handleBackToPortal} />;
      case 'inventory':
      case 'inventory-aset':
        return <InventoryPage onBackToPortal={handleBackToPortal} />;
      case 'jadwal-konten':
        return <JadwalKontenPage onBackToPortal={handleBackToPortal} />;
      case 'laporan':
      case 'laporan-sharing':
        return <LaporanPage userProfile={userProfile!} />;
      case 'export-center':
      case 'export':
        return <ExportCenterPage userProfile={userProfile!} />;
      case 'tutup-bulan':
      case 'closing':
        return <TutupBulanPage userProfile={userProfile!} />;

      // 5. Settings & Audit
      case 'pengaturan':
        return <PengaturanKantorPage onBackToPortal={handleBackToPortal} />;
      case 'audit-log':
        return <AuditLogPage />;

      default:
        return <PortalHomePage onNavigate={(menuId) => setActiveMenu(menuId)} />;
    }
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-700 flex flex-col font-sans antialiased overflow-hidden">
      {/* Top Header Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      {/* Main Workspace Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">{renderContent()}</div>
          </main>

          {/* High Density Footer */}
          <footer className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0 text-[10px] text-slate-400 font-mono">
            <div className="flex items-center space-x-4">
              <span>
                DATABASE STATUS:{' '}
                <strong className="text-emerald-600 font-sans font-bold">
                  ONLINE (FIRESTORE)
                </strong>
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                SISTEM:{' '}
                <strong className="text-slate-600 font-sans">
                  PORTAL APLIKASI PT. KDRT
                </strong>
              </span>
            </div>
            <div>PT. KDRT MANAGEMENT</div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
