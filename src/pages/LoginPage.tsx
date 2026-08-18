import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getFirebaseErrorMessage = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Email ini sudah terdaftar. Silakan pilih tab "Masuk Akun".';
    }
    if (code === 'auth/weak-password') {
      return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
    }
    if (code === 'auth/invalid-email') {
      return 'Format alamat email tidak valid.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';
    }
    return msg || 'Terjadi kesalahan saat otentikasi. Silakan coba lagi.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'LOGIN') {
        await loginWithEmail(cleanEmail, password);
      } else {
        await registerWithEmail(cleanEmail, password, name.trim() || undefined, selectedRole);
      }
    } catch (err: any) {
      setErrorMessage(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background Subtle Gradient Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-500 text-white font-black text-2xl shadow-xl shadow-orange-500/20 mb-4 border border-orange-400/30">
            KD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            KANTOR PT.KDRT
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Sistem Manajemen Bisnis & Operasional
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Mode Produksi Real • Firebase Auth</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8">
          {/* Tab Switcher: Login vs Register */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                mode === 'LOGIN'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                mode === 'REGISTER'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hak Akses (Role)
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-hidden focus:border-orange-500 transition-colors font-medium"
                  >
                    <option value="OWNER">OWNER (Hak Akses Penuh)</option>
                    <option value="INVESTOR">INVESTOR (Khusus Dashboard Sharing)</option>
                    <option value="MANAGER">MANAGER (Operasional & Karyawan)</option>
                    <option value="EMPLOYEE">EMPLOYEE (Karyawan & Absensi)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: owner@kdrt.id / ferrymerry@kdrt.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Otentikasi...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'LOGIN' ? 'Masuk ke Sistem' : 'Daftarkan Akun'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Help for Team / Investor */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Akun Resmi Investor PT.KDRT:
              <br />
              <span className="font-bold text-amber-400">ferrymerry@kdrt.com</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-500 font-medium">
          PT. KDRT MANAGEMENT • Hak Cipta Dilindungi
        </div>
      </div>
    </div>
  );
};
