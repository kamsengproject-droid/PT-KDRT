import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, TrendingUp, Sparkles, Building, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Account, DailyPerformance } from '../types';
import { subscribeDailyPerformance } from '../services/performanceService';
import { formatRupiah, formatBulanTahun, tanggalHariIni, formatTanggal } from '../utils/formatters';

export const PerformaHarianPage: React.FC<{ onBackToPortal?: () => void }> = ({ onBackToPortal }) => {
  const { role, employeeProfile } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [performances, setPerformances] = useState<DailyPerformance[]>([]);
  
  const [selectedMonthStr, setSelectedMonthStr] = useState(tanggalHariIni().substring(0, 7));
  const today = tanggalHariIni();

  useEffect(() => {
    const fetchAccounts = async () => {
      const q = query(collection(db, 'accounts'));
      const snap = await getDocs(q);
      let accs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
      
      if (role === 'EMPLOYEE') {
        const allowed = employeeProfile?.permissions?.canViewSpecificAccounts || [];
        if (allowed.length > 0) {
          accs = accs.filter(a => 
            allowed.includes(a.id || '') || 
            allowed.some(allowedName => (a.accountName || '').toUpperCase().includes(allowedName.toUpperCase()))
          );
        } else if (employeeProfile?.name?.toLowerCase().includes('desta') || employeeProfile?.position?.toLowerCase().includes('editor')) {
          accs = accs.filter(a => (a.accountName || '').toUpperCase().includes('NISAGROSIR88'));
        }
      }
      
      setAccounts(accs);
    };
    fetchAccounts();

    const unsub = subscribeDailyPerformance(undefined, setPerformances);
    return () => unsub();
  }, []);

  const calculateMetrics = (scopeFilter: 'SHARING' | 'PRIVATE') => {
    const scopeAccounts = accounts.filter(a => a.scope === scopeFilter);
    const scopeAccountIds = new Set(scopeAccounts.map(a => a.id));
    
    const scopePerformances = performances.filter(p => 
      role === 'EMPLOYEE' 
        ? scopeAccountIds.has(p.accountId) || scopeAccounts.some(acc => acc.accountName === p.accountName)
        : (p.scope === scopeFilter || scopeAccountIds.has(p.accountId))
    );
    
    let gHariIni = 0;
    let kHariIni = 0;
    let gBulanIni = 0;
    let kBulanIni = 0;

    scopePerformances.forEach(p => {
      if (p.date === today) {
        gHariIni += p.gmv || 0;
        kHariIni += p.commissionReal || p.realCommission || 0;
      }
      if (p.date?.startsWith(selectedMonthStr)) {
        gBulanIni += p.gmv || 0;
        kBulanIni += p.commissionReal || p.realCommission || 0;
      }
    });

    return { scopePerformances, gHariIni, kHariIni, gBulanIni, kBulanIni, scopeAccounts };
  };

  const sharingData = calculateMetrics('SHARING');
  const privateData = calculateMetrics('PRIVATE');

  const renderSection = (title: string, data: any, icon: React.ReactNode, bgColor: string) => {
    const { scopePerformances, gHariIni, kHariIni, gBulanIni, kBulanIni, scopeAccounts } = data;
    
    const monthlyList = scopePerformances.filter((p: any) => p.date?.startsWith(selectedMonthStr));

    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 pb-2">
          {icon}
          <h2 className="text-lg font-black text-zinc-800 tracking-tight">{title}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">GMV Hari Ini</span>
            <span className="text-lg font-black text-zinc-900 mt-1 block">
              {gHariIni > 0 ? formatRupiah(gHariIni) : 'BELUM ADA DATA'}
            </span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-emerald-600 block">Komisi Real Hari Ini</span>
            <span className="text-lg font-black text-emerald-900 mt-1 block">
              {kHariIni > 0 ? formatRupiah(kHariIni) : 'BELUM ADA DATA'}
            </span>
          </div>
          <div className="${bgColor} p-4 rounded-xl border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-indigo-700 block">GMV Bulan Ini</span>
            <span className="text-xl font-black text-indigo-950 mt-1 block">
              {gBulanIni > 0 ? formatRupiah(gBulanIni) : 'Rp 0'}
            </span>
          </div>
          <div className="${bgColor} p-4 rounded-xl border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-indigo-700 block">Komisi Real Bulan Ini</span>
            <span className="text-xl font-black text-indigo-950 mt-1 block">
              {kBulanIni > 0 ? formatRupiah(kBulanIni) : 'Rp 0'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Akun</th>
                  <th className="px-4 py-3">GMV</th>
                  <th className="px-4 py-3">Komisi Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {monthlyList.length > 0 ? (
                  monthlyList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-bold text-zinc-900">{formatTanggal(p.date)}</td>
                      <td className="px-4 py-3 font-medium text-zinc-700">{p.accountName}</td>
                      <td className="px-4 py-3 font-medium text-zinc-700">{formatRupiah(p.gmv)}</td>
                      <td className="px-4 py-3 font-black text-emerald-700">{formatRupiah(p.commissionReal || p.realCommission || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400 font-medium">
                      BELUM ADA DATA
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button onClick={onBackToPortal} className="p-2 bg-white rounded-full shadow-sm hover:bg-zinc-50 border border-zinc-200">
              <ArrowLeft className="h-5 w-5 text-zinc-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              DATA OMSET
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">Laporan GMV & Komisi Real Harian</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase">Bulan:</span>
          <input
            type="month"
            value={selectedMonthStr}
            onChange={(e) => setSelectedMonthStr(e.target.value)}
            className="rounded-xl border border-zinc-300 p-2 text-sm font-bold bg-white text-zinc-800"
          />
        </div>
      </div>

      {/* SHARING SECTION */}
      {renderSection('DATA OMSET SHARING', sharingData, <Sparkles className="h-5 w-5 text-blue-600" />, 'bg-indigo-50/50')}

      {/* PRIVATE SECTION */}
      {role === 'OWNER' && (
        renderSection('DATA OMSET PRIBADI', privateData, <Building className="h-5 w-5 text-rose-600" />, 'bg-rose-50/50')
      )}
      
      {role === 'INVESTOR' && (
        <div className="mt-8 p-6 bg-zinc-100 rounded-xl border border-zinc-200 text-center">
          <Lock className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
          <p className="text-xs text-zinc-500 font-bold">Data Omset Pribadi tidak ditampilkan untuk Investor.</p>
        </div>
      )}
    </div>
  );
};
