import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Cloud, 
  LogOut, 
  FolderSync, 
  CheckCircle2, 
  AlertCircle,
  HardDrive,
  Users,
  RefreshCw,
  Download,
  UploadCloud,
  Layers
} from 'lucide-react';
import { UserProfile, saveStoredUser, clearStoredUser, getGuestUser } from '../../lib/auth/authStore';
import { 
  signInWithGoogle, 
  switchGoogleAccount, 
  logoutUser, 
  getCachedAccessToken 
} from '../../lib/auth/authService';
import { syncEngine, FirstTimeSyncCondition } from '../../lib/sync/syncEngine';
import { restoreBackupData } from '../../lib/backup/backupEngine';
import { ConfirmDialog } from './ConfirmDialog';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  onDataRestored: () => void;
  onLogout?: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onDataRestored,
  onLogout,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [firstTimeCondition, setFirstTimeCondition] = useState<FirstTimeSyncCondition>('none');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  // Handle Google Sign In with Account Chooser forced (prompt=select_account consent)
  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStatusMessage('Membuka pilihan akun Google...');

    try {
      // 1. Sign in with prompt=select_account consent
      const { user, accessToken } = await signInWithGoogle(true);
      onUserChange(user);

      // 2. Evaluate first-time sync condition (Kondisi A, B, C, D)
      setStatusMessage('Memeriksa cadangan di Google Drive appDataFolder...');
      const condition = await syncEngine.evaluateFirstTimeSync(accessToken);
      setFirstTimeCondition(condition);

      if (condition === 'none') {
        const syncState = syncEngine.getState();
        if (syncState.errorMessage) {
          setErrorMessage(syncState.errorMessage);
          setStatusMessage(null);
        } else {
          setSuccessMessage('Berhasil masuk dan terhubung.');
        }
      }
    } catch (err: any) {
      console.warn('Sign In Notice:', err?.message || err);
      setErrorMessage(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  // Handle Switch Google Account (prompt=select_account without deleting local data)
  const handleSwitchAccount = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStatusMessage('Membuka pemilih akun Google...');

    try {
      const { user, accessToken } = await switchGoogleAccount();
      onUserChange(user);

      setStatusMessage('Memeriksa cadangan Google Drive untuk akun baru...');
      const condition = await syncEngine.evaluateFirstTimeSync(accessToken);
      setFirstTimeCondition(condition);
    } catch (err: any) {
      console.warn('Switch Account Notice:', err?.message || err);
      setErrorMessage(err.message || 'Gagal beralih akun Google.');
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  // Condition Handlers
  const handleConditionA_UploadToCloud = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const token = getCachedAccessToken();
      const res = await syncEngine.syncNow(token);
      if (res.success) {
        setSuccessMessage('Data proyek berhasil disimpan ke Google Drive Anda!');
        setFirstTimeCondition('none');
        setTimeout(() => onClose(), 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal mengunggah ke Google Drive.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConditionB_RestoreFromCloud = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const state = syncEngine.getState();
      if (state.cloudBackupPreview) {
        await restoreBackupData(state.cloudBackupPreview, 'replace');
        onDataRestored();
        setSuccessMessage('Data proyek berhasil dipulihkan dari Google Drive!');
        setFirstTimeCondition('none');
        setTimeout(() => onClose(), 1200);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal memulihkan dari Google Drive.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConditionC_Choice = async (choice: 'use_cloud' | 'use_local' | 'merge') => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await syncEngine.resolveConflict(choice === 'use_local' ? 'keep_local' : choice);
      onDataRestored();
      setFirstTimeCondition('none');
      setSuccessMessage('Penyelarasan data berhasil diselesaikan.');
      setTimeout(() => onClose(), 1200);
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal memproses data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await logoutUser();
        clearStoredUser();
        syncEngine.reset();
        onUserChange(getGuestUser());
      }
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal keluar dari akun Google.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <span>Akun Google & Sinkronisasi Drive</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Processing status */}
        {isProcessing && statusMessage && (
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2.5 text-xs text-emerald-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 1. KONDISI A: Local ada, Cloud kosong */}
        {firstTimeCondition === 'condition_a' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <span>Simpan data proyek Anda ke Google Drive?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Kami mendeteksi data proyek di perangkat ini, namun Google Drive Anda masih kosong. Simpan ke Google Drive agar Anda dapat membukanya kembali dari ponsel atau komputer lain.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFirstTimeCondition('none')}
                disabled={isProcessing}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleConditionA_UploadToCloud}
                disabled={isProcessing}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
              >
                Ya, Simpan ke Drive
              </button>
            </div>
          </div>
        ) : firstTimeCondition === 'condition_b' ? (
          /* 2. KONDISI B: Local kosong/default, Cloud ada */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Download className="w-5 h-5 text-cyan-400" />
                <span>Data RUMAHKU ditemukan di Google Drive</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Ditemukan cadangan proyek Anda di Google Drive. Pulihkan sekarang agar data di perangkat ini langsung tersinkronisasi sama persis dengan perangkat Anda lainnya?
              </p>
              {syncEngine.getState().cloudBackupPreview && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 text-[11px] text-slate-300">
                  Proyek:{' '}
                  <strong className="text-white">
                    {syncEngine.getState().cloudBackupPreview?.data.projects.map((p) => p.name).join(', ') || 'Proyek Rumah'}
                  </strong>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFirstTimeCondition('none')}
                disabled={isProcessing}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Lewati
              </button>
              <button
                onClick={handleConditionB_RestoreFromCloud}
                disabled={isProcessing}
                className="w-2/3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg"
              >
                Pulihkan Sekarang
              </button>
            </div>
          </div>
        ) : firstTimeCondition === 'condition_c' ? (
          /* 3. KONDISI C: Local dan Cloud sama-sama ada */
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <strong className="text-white block font-semibold">
                Data Ditemukan di Lokal dan Cloud
              </strong>
              <p>Pilih bagaimana Anda ingin menyelaraskan data kedua penyimpanan:</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleConditionC_Choice('use_cloud')}
                disabled={isProcessing}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex items-start gap-3"
              >
                <Cloud className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Gunakan Data Cloud (Drive)</div>
                  <div className="text-[10px] text-slate-400">Timpa lokal dengan data Google Drive</div>
                </div>
              </button>

              <button
                onClick={() => handleConditionC_Choice('use_local')}
                disabled={isProcessing}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex items-start gap-3"
              >
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Gunakan Data Lokal</div>
                  <div className="text-[10px] text-slate-400">Unggah data perangkat ini ke Google Drive</div>
                </div>
              </button>

              <button
                onClick={() => handleConditionC_Choice('merge')}
                disabled={isProcessing}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex items-start gap-3"
              >
                <FolderSync className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Gabungkan Data (Merge Aman)</div>
                  <div className="text-[10px] text-slate-400">Penyatuan ID tanpa membuat transaksi ganda</div>
                </div>
              </button>
            </div>
          </div>
        ) : currentUser.isGuest ? (
          /* View Saat Belum Login */
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Masuk dengan akun Google Anda untuk mengaktifkan sinkronisasi otomatis antar ponsel dan komputer secara langsung melalui penyimpanan pribadi Google Drive Anda.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white shadow-lg transition active:scale-95"
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
              <span>{isProcessing ? 'Menghubungkan...' : 'Masuk dengan Google (Pilih Akun)'}</span>
            </button>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privasi Terlindungi</span>
              </div>
              <p>
                RUMAHKU menggunakan izin Google Drive <code>appDataFolder</code>. Aplikasi hanya dapat membaca dan menulis file buatannya sendiri, dan tidak memiliki akses ke berkas Drive pribadi Anda lainnya.
              </p>
            </div>
          </div>
        ) : (
          /* View Saat Sudah Login (Masalah 1 Requirement) */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center gap-3.5">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/50"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  {currentUser.name[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{currentUser.name}</h4>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Google Drive Terhubung</span>
                </span>
              </div>
            </div>

            {/* Action buttons: Ganti Akun & Logout */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSwitchAccount}
                disabled={isProcessing}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition active:scale-95"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ganti Akun Google</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={isProcessing}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-bold text-rose-300 transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirm Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Keluar dari Akun Google"
        message="Apakah Anda yakin ingin keluar dari akun Google? Seluruh data proyek Anda di perangkat ini tetap aman dan tidak akan terhapus."
        confirmLabel="Keluar dari Akun"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
