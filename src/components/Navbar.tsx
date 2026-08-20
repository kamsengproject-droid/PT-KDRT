import React, { useState } from 'react';
import {
  Menu,
  ChevronDown,
  UserCheck,
  Home,
  Shield,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { PtKdrtLogo } from './PtKdrtLogo';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeMenu,
  setActiveMenu,
}) => {
  const { userProfile, role, logout } = useAuth();

  const getRoleBadgeClass = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'EMPLOYEE':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300';
      case 'INVESTOR':
        return 'bg-purple-50 text-purple-900 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getAvatarInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 shrink-0">
      {/* Left: Mobile Toggle & Horizontal Logo [ hamburger ] [ logo ] KANTOR PT.KDRT */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Buka Navigasi"
          aria-label="Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <button
          onClick={() => setActiveMenu('portal')}
          className="flex items-center gap-1.5 sm:gap-2 text-left group shrink-0"
        >
          <PtKdrtLogo variant="horizontal" size="sm" showSubtitle={false} />
        </button>
      </div>

      {/* Right: [ avatar ] [ ROLE/EMPLOYEE ] [ logout ] */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Status Firebase Online (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Firebase Online</span>
        </div>

        {/* User Info Display: Avatar & Badge */}
        <button
          onClick={() => setActiveMenu('profil-saya')}
          className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1 sm:p-1.5 sm:pr-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer text-left shrink-0"
          title={role === 'EMPLOYEE' ? 'Buka Profil Saya' : 'Profil & Akun'}
        >
          {/* Avatar */}
          {userProfile?.photoUrl ? (
            <img
              src={userProfile.photoUrl}
              alt={userProfile?.name || 'User'}
              className="h-7 w-7 rounded-lg object-cover border border-slate-300 shadow-2xs shrink-0"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-2xs shrink-0">
              {getAvatarInitials(userProfile?.name)}
            </div>
          )}

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
              {userProfile?.name || 'User'}
            </span>
            <span className="text-[9px] font-semibold text-slate-500 uppercase">
              {role === 'EMPLOYEE' ? 'PROFIL SAYA' : role}
            </span>
          </div>

          <span
            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${getRoleBadgeClass(
              role
            )}`}
          >
            {role === 'EMPLOYEE' ? 'PROFIL SAYA' : role}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={async () => {
            if (window.confirm('Keluar dari sesi KANTOR PT.KDRT?')) {
              await logout();
            }
          }}
          className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 sm:px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0 min-h-[36px]"
          title="Keluar dari akun (Logout)"
          aria-label="Logout"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
