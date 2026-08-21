import React, { useState } from 'react';
import {
  LayoutGrid,
  Users,
  CalendarCheck,
  Award,
  Wallet,
  DollarSign,
  TrendingUp,
  Settings,
  ShieldAlert,
  Smartphone,
  Share2,
  Lock,
  FileSpreadsheet,
  Package,
  Boxes,
  ShoppingBag,
  Calendar,
  FileBarChart,
  ClipboardList,
  Download,
  X,
  Home,
  LogOut,
  MapPin,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { PtKdrtLogo } from './PtKdrtLogo';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles?: string[];
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  setActiveMenu,
  isOpen,
  onClose,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { role, userProfile, employeeProfile, logout } = useAuth();

  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';
  const isEmployee = role === 'EMPLOYEE';
  const isInvestor = role === 'INVESTOR';

  const menuSections: MenuSection[] = [
        // 1. Employee Specific Menu (Sederhana & Fokus)
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
              ...(employeeProfile?.permissions?.canViewSampleProducts !== false ? [
                {
                  id: 'database-sampel',
                  label: 'Produk Sampel',
                  icon: Package,
                },
                {
                  id: 'penataan-lokasi',
                  label: 'Penataan Lokasi',
                  icon: MapPin,
                },
              ] : []),
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
      : []),

    // 2. Investor Menu
    ...(isInvestor
      ? [
          {
            section: 'MENU INVESTOR',
            items: [
              {
                id: 'investor-dashboard',
                label: 'Dashboard Sharing',
                icon: Share2,
              },
              {
                id: 'akun',
                label: 'Akun Sharing',
                icon: Smartphone,
              },
              {
                id: 'database-sampel',
                label: 'Database Produk',
                icon: Package,
              },
              {
                id: 'laporan',
                label: 'Laporan Sharing',
                icon: FileBarChart,
              },
            ],
          },
        ]
      : []),

    // 3. Bisnis & Keuangan (Owner / Manager)
    ...(!isEmployee && !isInvestor
      ? [
          {
            section: 'BISNIS & KEUANGAN',
            items: [
              {
                id: 'keuangan',
                label: 'Keuangan & Arus Kas',
                icon: Wallet,
              },
              {
                id: 'akun',
                label: 'Akun TikTok & Medsos',
                icon: Smartphone,
              },
              {
                id: 'performa-harian',
                label: 'Data Omset',
                icon: TrendingUp,
              },
              {
                id: 'input-komisi-real',
                label: 'Input Komisi Real',
                icon: TrendingUp,
                allowedRoles: ['OWNER', 'MANAGER'],
              },
              {
                id: 'database-sampel',
                label: 'Produk Sampel',
                icon: Package,
              },
              {
                id: 'penataan-lokasi',
                label: 'Penataan Lokasi',
                icon: MapPin,
              },
              {
                id: 'inventory',
                label: 'Inventaris & Aset',
                icon: Boxes,
              },
            ],
          },
          {
            section: 'KARYAWAN',
            items: [
              {
                id: 'karyawan',
                label: 'Data Karyawan',
                icon: Users,
              },
              {
                id: 'absensi-owner',
                label: 'Absensi',
                icon: CalendarCheck,
              },
              ...(isOwner
                ? [
                    {
                      id: 'penggajian',
                      label: 'Salary Karyawan',
                      icon: DollarSign,
                    },
                  ]
                : []),
              {
                id: 'kerjaan-harian',
                label: 'Kerjaan Hari Ini',
                icon: ClipboardList,
              },
            ],
          },
          {
            section: 'SHARING',
            items: [
              {
                id: 'profit-sharing',
                label: 'Profit Sharing & Investor',
                icon: Share2,
              },
            ],
          },
          {
            section: 'LAPORAN',
            items: [
              {
                id: 'laporan',
                label: 'Laporan & Rekapitulasi',
                icon: FileBarChart,
              },
            ],
          },
          ...(isOwner
            ? [
                {
                  section: 'INPUT MANUAL',
                  items: [
                    {
                      id: 'input-manual',
                      label: 'Input Manual Owner',
                      icon: Edit3,
                    },
                  ],
                },
              ]
            : []),
          ...(isOwner
            ? [
                {
                  section: 'SISTEM',
                  items: [
                    {
                      id: 'pengaturan',
                      label: 'Pengaturan & Audit',
                      icon: Settings,
                    },
                  ],
                },
              ]
            : []),
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 transform border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4 shrink-0">
          <button
            onClick={() => {
              setActiveMenu('portal');
              onClose();
            }}
            className="flex items-center space-x-2 text-left group"
          >
            <PtKdrtLogo variant="horizontal" size="sm" showSubtitle={false} className="[&_span]:text-white group-hover:[&_span]:text-cyan-300" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Portal Home Button */}
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={() => {
              setActiveMenu('portal');
              onClose();
            }}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-black transition-all shadow-xs ${
              activeMenu === 'portal'
                ? 'bg-orange-500 text-white shadow-orange-500/20'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>PORTAL APLIKASI KANTOR</span>
          </button>
        </div>

        {/* Menu Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs">
          {menuSections.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {group.section}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id);
                        onClose();
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-orange-500/20 text-orange-400 border-r-4 border-orange-500 font-bold'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? 'text-orange-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            isActive
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="relative p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          {/* Profile Menu Popup */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full p-2">
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col p-1">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setActiveMenu('data-saya');
                  }}
                  className="text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Profil Saya
                </button>
                
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    // Emit a custom event or set a state? The easiest is to use a global custom event or create a simple modal right here in Sidebar.
                    window.dispatchEvent(new CustomEvent('OPEN_CHANGE_PASSWORD'));
                  }}
                  className="text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Ubah Password
                </button>

                <button
                  onClick={async () => {
                    setIsProfileMenuOpen(false);
                    if (window.confirm('Keluar dari sesi KANTOR PT.KDRT?')) {
                      await logout();
                    }
                  }}
                  className="text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-slate-700 rounded-lg transition-colors mt-1 border-t border-slate-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex flex-1 items-center space-x-2.5 min-w-0 text-left hover:bg-slate-900 rounded-lg p-1 -m-1 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-xs text-white uppercase shadow-xs shrink-0">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {userProfile?.name || 'User'}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {isEmployee ? (employeeProfile?.position || 'Employee') : role} • Online
              </div>
            </div>
          </button>
          
          <button
            onClick={async () => {
              if (window.confirm('Keluar dari sesi KANTOR PT.KDRT?')) {
                await logout();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer shrink-0 ml-2"
            title="Keluar (Logout)"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <ChangePasswordModal />
      </aside>
    </>
  );
};
