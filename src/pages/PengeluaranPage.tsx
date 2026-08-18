import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  hapusExpense,
  subscribeExpenses,
  tambahExpense,
  updateExpense,
} from '../services/expenseService';
import { Expense, ExpenseCategory, ScopeType } from '../types';
import { formatBulanTahun, formatRupiah, formatTanggal, tanggalHariIni, bulanHariIni } from '../utils/formatters';

export const PengeluaranPage: React.FC = () => {
  const { userProfile, role, loading, currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(bulanHariIni());
  const [selectedScope, setSelectedScope] = useState<ScopeType | 'ALL'>('ALL');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<{
    date: string;
    category: ExpenseCategory;
    scope: ScopeType;
    amount: number;
    description: string;
    receiptUrl: string;
  }>({
    date: tanggalHariIni(),
    category: 'OPERASIONAL',
    scope: 'SHARING',
    amount: '',
    description: '',
    receiptUrl: '',
  });

  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (loading || !userProfile?.active) {
      return;
    }
    const unsub = subscribeExpenses(
      selectedScope === 'ALL' ? undefined : selectedScope,
      setExpenses
    );
    return unsub;
  }, [loading, currentUser?.uid, userProfile?.role, userProfile?.active, selectedScope]);

  const filteredExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      date: tanggalHariIni(),
      category: 'OPERASIONAL',
      scope: 'SHARING',
      amount: '',
      description: '',
      receiptUrl: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Expense) => {
    setEditingItem(item);
    setFormData({
      date: item.date,
      category: item.category,
      scope: item.scope,
      amount: item.amount,
      description: item.description,
      receiptUrl: item.receiptUrl || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem?.id) {
        await updateExpense(
          editingItem.id,
          formData,
          userProfile?.uid || 'user',
          userProfile?.name || 'User'
        );
      } else {
        await tambahExpense(
          formData,
          userProfile?.uid || 'user',
          userProfile?.name || 'User'
        );
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (window.confirm(`Hapus catatan pengeluaran "${desc}"?`)) {
      await hapusExpense(id, desc, userProfile?.uid || 'user', userProfile?.name || 'User');
    }
  };

  const categories: ExpenseCategory[] = [
    'OPERASIONAL',
    'INTERNET_LISTRIK',
    'PERALATAN',
    'INVENTORY',
    'RENOVASI',
    'SALARY',
    'ATTENDANCE_BONUS',
    'SAMPEL',
    'MARKETING',
    'LAINNYA',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Pencatatan Pengeluaran (Biaya Kas)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Catatan biaya operasional, gaji, uang rajin, dan pembelian inventaris kantor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-zinc-200 p-1.5 shadow-2xs">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border-none bg-transparent px-2 py-1 text-xs font-bold text-zinc-900 focus:outline-none"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Scope Filter & Total */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedScope('ALL')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedScope === 'ALL'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Semua Scope
          </button>
          <button
            onClick={() => setSelectedScope('SHARING')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedScope === 'SHARING'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Sharing
          </button>
          <button
            onClick={() => setSelectedScope('PRIBADI')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedScope === 'PRIBADI'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Pribadi
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700">
          Total Pengeluaran Bulan Ini: <span className="font-extrabold text-rose-600 text-sm ml-1">{formatRupiah(totalAmount)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-100">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-4 py-3">Keterangan Pengeluaran</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Jumlah (Rp)</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">
                    Belum ada catatan pengeluaran di bulan {formatBulanTahun(selectedMonth)}.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-zinc-900">{formatTanggal(item.date)}</td>
                    <td className="px-4 py-3.5 font-medium text-zinc-800">{item.description}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.scope === 'SHARING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.scope}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-rose-600">{formatRupiah(item.amount)}</td>
                    <td className="px-6 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {role === 'OWNER' && (
                        <button
                          onClick={() => handleDelete(item.id!, item.description)}
                          className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900 mb-4">
              {editingItem ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Tagihan Internet WiFi Kantor"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Scope</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as ScopeType })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5"
                  >
                    <option value="SHARING">SHARING</option>
                    <option value="PRIBADI">PRIBADI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nominal (Rp)</label>
                <CurrencyInput
                  required
                  value={formData.amount}
                  onChange={(val) => setFormData({ ...formData, amount: val })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-rose-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
