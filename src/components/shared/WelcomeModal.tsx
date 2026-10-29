import React from 'react';
import { Building2, ShieldCheck, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onStartGuest: () => void;
  onStartGoogle: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onStartGuest,
  onStartGoogle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-12 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-1 shadow-xl shadow-emerald-950/50 flex items-center justify-center mx-auto">
          <Building2 className="w-9 h-9 text-white" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Home Budget Planner</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Selamat Datang di RUMAHKU
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
            Rencanakan pembangunan rumah dan kelola anggaran Anda dengan lebih mudah, cerdas, dan akurat.
          </p>
        </div>

        {/* Action Buttons (Section 4.1 Requirement) */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onStartGuest}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/50 transition active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Mulai Tanpa Login (Mode Tamu)</span>
          </button>

          <button
            onClick={onStartGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition active:scale-95 shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Data tersimpan di perangkat. Privasi 100% terjaga.</span>
        </div>
      </div>
    </div>
  );
};
