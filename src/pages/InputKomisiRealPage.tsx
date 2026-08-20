import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Account, DailyPerformance } from '../types';
import { checkDuplicatePerformance, saveKomisiReal } from '../services/performanceService';
import { CurrencyInput } from '../components/CurrencyInput';
import { tanggalHariIni } from '../utils/formatters';
import { OrphanTransactionAlert } from '../components/finance/OrphanTransactionAlert';

export const InputKomisiRealPage: React.FC<{ onBackToPortal?: () => void }> = ({ onBackToPortal }) => {
  const { currentUser, userProfile, employeeProfile, role } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const [formData, setFormData] = useState({
    date: tanggalHariIni(),
    accountId: '',
    accountName: '',
    scope: 'SHARING' as 'SHARING' | 'PRIVATE',
    gmv: '' as number | '',
    estimatedCommission: '' as number | '',
    realCommission: '' as number | '',
    notes: '',
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      const q = query(collection(db, 'accounts'));
      const snap = await getDocs(q);
      let accs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
      
      // Filter for specific employee permissions
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
      
      // Auto-select if only 1 account
      if (accs.length === 1) {
        setFormData(prev => ({
          ...prev,
          accountId: accs[0].id,
          accountName: accs[0].accountName,
          scope: accs[0].scope || 'SHARING'
        }));
      }
      setLoading(false);
    };
    fetchAccounts();
  }, []);

  const handleAccountChange = async (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    setFormData(prev => ({
      ...prev,
      accountId,
      accountName: acc?.accountName || '',
      scope: acc?.scope || 'SHARING',
    }));
    setErrorMessage(null);
    setShowDuplicateWarning(false);
    
    if (accountId && formData.date) {
      const isDup = await checkDuplicatePerformance(accountId, formData.date);
      if (isDup) {
        setErrorMessage(`Data omset untuk akun ${acc?.accountName || 'ini'} pada ${formData.date} sudah tersedia.`);
        setShowDuplicateWarning(true);
      }
    }
  };

  const handleDateChange = async (date: string) => {
    setFormData(prev => ({ ...prev, date }));
    setErrorMessage(null);
    setShowDuplicateWarning(false);

    if (formData.accountId && date) {
      const isDup = await checkDuplicatePerformance(formData.accountId, date);
      if (isDup) {
        const acc = accounts.find(a => a.id === formData.accountId);
        setErrorMessage(`Data omset untuk akun ${acc?.accountName || 'ini'} pada ${date} sudah tersedia.`);
        setShowDuplicateWarning(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (showDuplicateWarning) return; // Blocked

    if (!formData.accountId || !formData.date) {
      setErrorMessage('Pilih akun dan tanggal.');
      return;
    }
    
    // final check before save
    setSaving(true);
    try {
      const isDup = await checkDuplicatePerformance(formData.accountId, formData.date);
      if (isDup) {
        const acc = accounts.find(a => a.id === formData.accountId);
        setErrorMessage(`Data omset untuk akun ${acc?.accountName || 'ini'} pada ${formData.date} sudah tersedia.`);
        setShowDuplicateWarning(true);
        setSaving(false);
        return;
      }

      await saveKomisiReal(
        {
          date: formData.date,
          accountId: formData.accountId,
          accountName: formData.accountName,
          scope: formData.scope,
          gmv: Number(formData.gmv) || 0,
          estimatedCommission: Number(formData.estimatedCommission) || 0,
          realCommission: Number(formData.realCommission) || 0,
          commissionReal: Number(formData.realCommission) || 0,
          notes: formData.notes
        },
        currentUser!.uid,
        userProfile!.name
      );

      setSuccessMessage('Data komisi real berhasil disimpan.');
      setFormData({
        ...formData,
        gmv: '',
        estimatedCommission: '',
        realCommission: '',
        notes: '',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <OrphanTransactionAlert />
      <div className="flex items-center gap-3 mb-6">
        {onBackToPortal && (
          <button onClick={onBackToPortal} className="p-2 bg-white rounded-full shadow-sm hover:bg-zinc-50">
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </button>
        )}
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">INPUT KOMISI REAL</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {showDuplicateWarning && (
              <div className="flex gap-2 ml-7">
                <button 
                  type="button" 
                  onClick={() => setShowDuplicateWarning(false)}
                  className="bg-white px-3 py-1.5 rounded-lg border border-rose-200 font-bold hover:bg-rose-100"
                >
                  EDIT DATA
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({...formData, accountId: ''});
                    setShowDuplicateWarning(false);
                    setErrorMessage(null);
                  }}
                  className="bg-rose-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-rose-700"
                >
                  BATAL
                </button>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 font-bold flex items-center gap-2">
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-zinc-700 mb-1.5">Tanggal *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-3 font-bold bg-zinc-50"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1.5">Pilih Akun Medsos *</label>
              <select
                required
                value={formData.accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-3 font-bold bg-zinc-50"
              >
                <option value="">-- Pilih Akun --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.scope})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-zinc-700 mb-1.5">Scope Terdeteksi</label>
              <input
                type="text"
                disabled
                value={formData.scope}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-100 p-3 font-black text-zinc-600 uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1.5">GMV Omzet (Rp) *</label>
              <CurrencyInput
                required
                value={formData.gmv}
                onChange={(val) => setFormData({ ...formData, gmv: val })}
                className="w-full rounded-xl border border-zinc-300 p-3 font-bold bg-zinc-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-zinc-700 mb-1.5">Estimasi Komisi (Rp)</label>
              <CurrencyInput
                value={formData.estimatedCommission}
                onChange={(val) => setFormData({ ...formData, estimatedCommission: val })}
                className="w-full rounded-xl border border-zinc-300 p-3 font-bold bg-zinc-50"
              />
            </div>
            <div>
              <label className="block font-black text-emerald-800 mb-1.5">Komisi Real / Uang Masuk (Rp) *</label>
              <CurrencyInput
                required
                value={formData.realCommission}
                onChange={(val) => setFormData({ ...formData, realCommission: val })}
                className="w-full rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3 font-black text-emerald-900 text-lg shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1.5">Catatan</label>
            <input
              type="text"
              placeholder="Keterangan opsional..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 p-3 font-medium bg-zinc-50"
            />
          </div>

          <div className="pt-4 mt-2 border-t border-zinc-100">
            <button
              type="submit"
              disabled={saving || showDuplicateWarning}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white p-4 font-black text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? 'MENYIMPAN...' : 'SIMPAN DATA KOMISI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
