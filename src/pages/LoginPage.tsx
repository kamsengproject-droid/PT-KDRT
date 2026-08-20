import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginWithEmail } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNetworkDenied, setIsNetworkDenied] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsNetworkDenied(false);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(cleanEmail, password);
    } catch (err: any) {
      console.error('Auth error (internal):', err);
      if (
        err?.isNetworkDenied ||
        err?.code === 'OFFICE_NETWORK_DENIED' ||
        err?.message?.includes('jaringan kantor')
      ) {
        setIsNetworkDenied(true);
        setErrorMessage(
          err?.message || 'Login karyawan hanya dapat dilakukan melalui jaringan kantor PT.KDRT.'
        );
      } else {
        setIsNetworkDenied(false);
        setErrorMessage('Email atau kata sandi tidak sesuai.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header with Exact Unified Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/20 mb-3 bg-slate-950 flex items-center justify-center p-1.5 transition-all">
            <img
              src="/assets/logo-kdrt.webp"
              alt="PT.KDRT - Selamat Datang di Sistem Kamsengproject"
              className="w-full h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to PNG if WebP is not supported
                (e.currentTarget as HTMLImageElement).src = '/assets/logo-kdrt.png';
              }}
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium max-w-xs text-center leading-relaxed">
            Kelola aktivitas dan operasional Kamsengproject dalam satu sistem.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8">
          
          <div className="text-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">Masuk Akun</h2>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className={`mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border text-xs ${
                isNetworkDenied
                  ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                  : 'bg-rose-950/60 border-rose-800/50 text-rose-300'
              }`}
            >
              <AlertCircle
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  isNetworkDenied ? 'text-rose-400' : 'text-rose-400'
                }`}
              />
              <div className="space-y-0.5">
                {isNetworkDenied && (
                  <div className="font-extrabold text-white text-[11px] uppercase tracking-wider">
                    AKSES JARINGAN DITOLAK
                  </div>
                )}
                <div className="font-medium leading-relaxed">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Masukkan email"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
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
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-500 font-medium leading-relaxed">
          PT. KDRT MANAGEMENT<br />Designed by Ko Kamseng
        </div>
      </div>
    </div>
  );
};

