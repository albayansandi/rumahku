import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Pasang Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white">Pasang di iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 space-y-2 leading-relaxed">
                1. Ketuk tombol <strong className="text-emerald-400">Bagikan (Share)</strong> di bilah navigasi bawah Safari.<br />
                2. Gulir ke bawah lalu pilih <strong className="text-emerald-400">Tambahkan ke Layar Utama (Add to Home Screen)</strong>.<br />
                3. Ketuk <strong className="text-white">Tambah (Add)</strong> di pojok kanan atas.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
