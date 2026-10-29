import React, { useState, useRef } from 'react';
import { 
  Settings, 
  User, 
  Building, 
  Database, 
  Download, 
  Upload, 
  Cloud, 
  LogOut, 
  Trash2, 
  Plus, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Archive,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { Project, MaterialCategory } from '../../types';
import { UserProfile, clearStoredUser } from '../../lib/auth/authStore';
import { getCachedAccessToken } from '../../lib/auth/authService';
import { SyncState, syncEngine } from '../../lib/sync/syncEngine';
import { 
  exportDatabaseBackup, 
  downloadBackupFile, 
  validateBackupData, 
  restoreBackupData, 
  RumahkuBackupData, 
  ValidationSummary 
} from '../../lib/backup/backupEngine';
import { db } from '../../lib/db/database';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface SettingsPageProps {
  user: UserProfile;
  projects: Project[];
  activeProjectId: string;
  categories: MaterialCategory[];
  syncState: SyncState;
  onSelectProject: (id: string) => void;
  onRefreshData: () => void;
  onOpenAuthModal: () => void;
  onOpenNewProjectModal: () => void;
  onLogout: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  projects,
  activeProjectId,
  categories,
  syncState,
  onSelectProject,
  onRefreshData,
  onOpenAuthModal,
  onOpenNewProjectModal,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<
    'profile' | 'projects' | 'categories' | 'backup' | 'sync' | 'about'
  >('profile');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [stagedBackupData, setStagedBackupData] = useState<RumahkuBackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'as_new' | 'merge' | 'replace'>('as_new');
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category management
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Project delete / archive confirm
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Manual sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [showRestoreDriveConfirm, setShowRestoreDriveConfirm] = useState(false);

  // In-app feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Handle Export
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const backup = await exportDatabaseBackup();
      downloadBackupFile(backup);
      showToast('Data cadangan berhasil diekspor.');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data cadangan.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Upload for Import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const summary = validateBackupData(json);
        setValidationSummary(summary);
        if (summary.isValid) {
          setStagedBackupData(json as RumahkuBackupData);
        } else {
          setStagedBackupData(null);
        }
      } catch (err) {
        showToast('File tidak dapat dibaca sebagai format JSON valid.');
        setValidationSummary(null);
        setStagedBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!stagedBackupData) return;
    setIsRestoring(true);
    try {
      const res = await restoreBackupData(stagedBackupData, restoreMode);
      if (res.success) {
        showToast('Data cadangan berhasil dipulihkan!');
        setStagedBackupData(null);
        setValidationSummary(null);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memulihkan data cadangan.');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const now = new Date().toISOString();
      const newCat: MaterialCategory = {
        id: crypto.randomUUID(),
        projectId: activeProjectId,
        name: newCatName.trim(),
        sortOrder: categories.length + 1,
        createdAt: now,
        updatedAt: now,
      };
      await db.material_categories.add(newCat);
      setNewCatName('');
      setIsAddingCat(false);
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    const hasMaterials = await db.materials
      .where('categoryId')
      .equals(catId)
      .filter((m) => !m.deletedAt)
      .count();

    if (hasMaterials > 0) {
      showToast(`Kategori ini memiliki ${hasMaterials} material. Pindahkan atau hapus material terlebih dahulu.`);
      return;
    }

    await db.material_categories.update(catId, { deletedAt: new Date().toISOString() });
    onRefreshData();
  };

  // Delete Project (Soft Delete)
  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    if (projects.length <= 1) {
      showToast('Anda harus memiliki minimal satu proyek.');
      setProjectToDelete(null);
      return;
    }

    const now = new Date().toISOString();
    await db.projects.update(projectToDelete.id, { deletedAt: now });
    
    // Switch to another project
    const remaining = projects.filter((p) => p.id !== projectToDelete.id);
    if (remaining[0]) {
      await db.settings.put({
        id: 'active_project',
        key: 'active_project_id',
        value: remaining[0].id,
        updatedAt: now,
      });
      onSelectProject(remaining[0].id);
    }

    setProjectToDelete(null);
    onRefreshData();
  };

  // Manual Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    const token = user.googleAccessToken || getCachedAccessToken();
    if (!token && !user.isGuest) {
      onOpenAuthModal();
      setIsSyncing(false);
      return;
    }
    const res = await syncEngine.syncNow(token);
    setSyncMsg(res.message);
    setIsSyncing(false);
  };

  const handleConfirmRestoreFromDrive = async () => {
    setShowRestoreDriveConfirm(false);
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const token = user.googleAccessToken || getCachedAccessToken();
      if (!token) {
        onOpenAuthModal();
        return;
      }
      const cloudFile = await syncEngine.findCloudSyncFile(token);
      if (!cloudFile) {
        setSyncMsg('Tidak ditemukan berkas cadangan RUMAHKU di Google Drive.');
        return;
      }
      const cloudData = await syncEngine.downloadCloudSyncFile(token, cloudFile.id);
      await restoreBackupData(cloudData, 'replace');
      setSyncMsg('Data proyek berhasil dipulihkan dari Google Drive!');
      onRefreshData();
    } catch (e: any) {
      setSyncMsg(e.message || 'Gagal memulihkan dari Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto relative">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-slideDown">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-emerald-400" />
          <span>Pengaturan & Konfigurasi Aplikasi</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kelola profil pengguna, multi-proyek, kategori material, cadangan lokal, dan direktori toko cloud.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Submenu */}
        <div className="md:col-span-4 space-y-1">
          <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                activeSection === 'profile'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil & Akun</span>
            </button>

            <button
              onClick={() => setActiveSection('projects')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                activeSection === 'projects'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Manajemen Proyek ({projects.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('categories')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                activeSection === 'categories'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Kategori Material</span>
            </button>

            <button
              onClick={() => setActiveSection('backup')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                activeSection === 'backup'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Backup & Restore Lokal</span>
            </button>

            <button
              onClick={() => setActiveSection('sync')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                activeSection === 'sync'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FolderSync className="w-4 h-4" />
              <span>Sinkronisasi Google Drive</span>
            </button>

            <button
              onClick={() => setActiveSection('about')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                activeSection === 'about'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Tentang & Privasi</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8">
          
          {/* 1. PROFIL SECTION */}
          {activeSection === 'profile' && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span>Status Akun & Pengguna</span>
              </h3>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-700 text-emerald-400 flex items-center justify-center font-bold text-xl shadow-inner">
                  {user.isGuest ? 'T' : user.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{user.name}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-emerald-300">
                      {user.isGuest ? 'Mode Tamu (Offline-First)' : 'Terhubung Google'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user.isGuest
                      ? 'Seluruh data tersimpan aman di database IndexedDB perangkat ini.'
                      : user.email}
                  </p>
                </div>
              </div>

              {user.isGuest ? (
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300 space-y-1">
                      <strong className="text-white">Gunakan Akun Google untuk Cadangan Cloud Otomatis</strong>
                      <p>
                        Masuk dengan Google memungkinkan sinkronisasi data antar perangkat melalui Google Drive appDataFolder pribadi tanpa mengekspos data Anda ke publik.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenAuthModal}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg transition active:scale-95"
                  >
                    Masuk dengan Google Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-800">
                    <span className="text-slate-400">Penyimpanan Terhubung:</span>
                    <span className="font-semibold text-emerald-400">
                      {user.isDriveConnected ? 'Google Drive Aktif' : 'Belum Dihubungkan ke Drive'}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun Google</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. MULTI-PROJECT SECTION */}
          {activeSection === 'projects' && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-400" />
                  <span>Daftar Proyek Rumah Anda</span>
                </h3>
                <button
                  onClick={onOpenNewProjectModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Proyek Baru</span>
                </button>
              </div>

              <div className="space-y-2">
                {projects.map((p) => {
                  const isActive = p.id === activeProjectId;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{p.name}</h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {p.length}m × {p.width}m ({Math.round(p.length * p.width)} m²) • {p.location || 'Indonesia'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            onClick={() => onSelectProject(p.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold transition"
                          >
                            Pilih Aktif
                          </button>
                        )}

                        <button
                          onClick={() => setProjectToDelete(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Hapus Proyek"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. CATEGORIES SECTION */}
          {activeSection === 'categories' && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Kategori Pekerjaan Material</span>
                </h3>
                <button
                  onClick={() => setIsAddingCat(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              {isAddingCat && (
                <div className="flex gap-2 p-3 rounded-2xl bg-slate-800/80 border border-emerald-500/40">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Contoh: Rangka Hollow & Plafon Gypsum"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setIsAddingCat(false)}
                    className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-xs"
                  >
                    Batal
                  </button>
                </div>
              )}

              <div className="divide-y divide-slate-800">
                {categories.map((c, idx) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {idx + 1}. {c.name}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. BACKUP & RESTORE SECTION (Section 13) */}
          {activeSection === 'backup' && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <span>Backup & Restore Mandiri (Format JSON)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ekspor dan impor salinan seluruh data proyek, gambar denah, faktur pembelian, dan riwayat transaksi tanpa perlu akun.
                </p>
              </div>

              {/* Export Box */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Ekspor Cadangan Proyek (.json)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unduh file arsip terenkripsi yang berisi seluruh data proyek saat ini.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow transition shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Mengekspor...' : 'Unduh File Cadangan'}</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Pulihkan Data dari Berkas (.json)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pilih file cadangan RUMAHKU untuk memulihkan anggaran.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Pilih Berkas JSON</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json,application/json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Validation and Summary view before restore (Section 13) */}
                {validationSummary && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white">Ringkasan Berkas Cadangan:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          validationSummary.isValid
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {validationSummary.isValid ? 'Valid & Kompatibel' : 'Tidak Valid'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                      <div>Proyek: <strong className="text-white">{validationSummary.stats.projects}</strong></div>
                      <div>Material: <strong className="text-white">{validationSummary.stats.materials}</strong></div>
                      <div>Faktur: <strong className="text-white">{validationSummary.stats.purchases}</strong></div>
                      <div>Transaksi: <strong className="text-white">{validationSummary.stats.transactions}</strong></div>
                    </div>

                    {validationSummary.warnings.length > 0 && (
                      <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                        {validationSummary.warnings.map((w, idx) => (
                          <div key={idx}>• {w}</div>
                        ))}
                      </div>
                    )}

                    {validationSummary.isValid && (
                      <div className="pt-2 border-t border-slate-800 space-y-3">
                        <label className="text-xs font-bold text-slate-300 block">
                          Metode Pemulihan Data:
                        </label>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setRestoreMode('as_new')}
                            className={`p-2.5 rounded-xl border text-center transition ${
                              restoreMode === 'as_new'
                                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 font-bold'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            Sebagai Proyek Baru
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestoreMode('merge')}
                            className={`p-2.5 rounded-xl border text-center transition ${
                              restoreMode === 'merge'
                                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 font-bold'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            Gabungkan Data (Merge)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestoreMode('replace')}
                            className={`p-2.5 rounded-xl border text-center transition ${
                              restoreMode === 'replace'
                                ? 'bg-rose-600/20 text-rose-300 border-rose-500 font-bold'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            Ganti Seluruh Data
                          </button>
                        </div>

                        <button
                          onClick={handleExecuteRestore}
                          disabled={isRestoring}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition"
                        >
                          {isRestoring ? 'Memulihkan Data...' : 'Konfirmasi dan Pulihkan Sekarang'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. SYNC SECTION (Section 12 & Indikator Sinkronisasi) */}
          {activeSection === 'sync' && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-emerald-400" />
                  <span>Google Drive Cloud Synchronization</span>
                </h3>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    syncState.status === 'Tersinkronisasi'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : syncState.status === 'Sedang Sinkronisasi'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : syncState.status === 'Menunggu Sinkronisasi'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : syncState.status === 'Konflik Data'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : syncState.status === 'Gagal Sinkronisasi'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : syncState.status === 'Terhubung'
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600'
                  }`}
                >
                  {syncState.status}
                </span>
              </div>

              {/* Status details card */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Email Google Aktif:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">
                    {user.isGuest ? 'Belum terhubung (Mode Tamu)' : user.email || user.name}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Status Penyimpanan:</span>
                  <span className="font-semibold text-emerald-400">
                    {syncState.status}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Waktu Sinkronisasi Terakhir:</span>
                  <span className="font-bold text-white">
                    {syncState.lastSyncedAt
                      ? new Date(syncState.lastSyncedAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Belum pernah dikonfirmasi'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Antrean Perubahan Offline:</span>
                  <span className="font-bold text-white">{syncState.pendingCount} operasi tertunda</span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-700/60 pt-2">
                  <span className="text-slate-400">Lokasi Cloud:</span>
                  <span className="font-mono text-[11px] text-slate-300">Google Drive appDataFolder (Internal)</span>
                </div>
              </div>

              {/* Conflict banner if remote changes detected */}
              {syncState.hasConflict && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2.5 text-xs text-orange-200">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span>Terdeteksi Perubahan Terbaru dari Perangkat Lain (HP/PC)</span>
                  </div>
                  <p className="text-slate-300">
                    Terdapat versi data yang lebih baru di Google Drive. Pilih cara penyelarasan:
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => syncEngine.resolveConflict('use_cloud')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                      Terapkan Data Cloud
                    </button>
                    <button
                      onClick={() => syncEngine.resolveConflict('merge')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                    >
                      Gabungkan Data (Merge)
                    </button>
                    <button
                      onClick={() => syncEngine.resolveConflict('keep_local')}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 text-slate-200"
                    >
                      Pertahankan Lokal
                    </button>
                  </div>
                </div>
              )}

              {syncMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                  {syncMsg}
                </div>
              )}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1. Tombol Sinkronkan Sekarang */}
                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sedang Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>

                {/* 2. Tombol Pulihkan dari Drive */}
                <button
                  onClick={() => setShowRestoreDriveConfirm(true)}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Pulihkan dari Drive</span>
                </button>

                {/* 3. Tombol Ganti Akun */}
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Ganti Akun Google</span>
                </button>

                {/* 4. Tombol Putuskan Koneksi */}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Putuskan Koneksi</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. ABOUT SECTION */}
          {activeSection === 'about' && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg">
                  R
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">RUMAHKU v1.0.0 (Tahap 1)</h3>
                  <span className="text-xs text-slate-400">Smart Home Budget Planner untuk Masyarakat Indonesia</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-4">
                <h4 className="font-bold text-white">Format Angka & Mata Uang:</h4>
                <p>
                  Sesuai pedoman baku penulisan keuangan Indonesia, seluruh nominal disajikan dengan pemisah ribuan titik (contoh: <code>Rp1.500.000</code>). Perhitungan saldo menggunakan aritmatika bilangan bulat (integer Rupiah) agar terbebas dari kesalahan pembulatan desimal.
                </p>

                <h4 className="font-bold text-white pt-2">Kebijakan Privasi & Keamanan:</h4>
                <p>
                  RUMAHKU mengutamakan privasi pengguna secara mutlak. Data estimasi anggaran dan nota pembelian Anda tidak dijual atau dikirim ke server pihak ketiga tanpa izin. Penyimpanan internal menggunakan IndexedDB terenkripsi di peramban Anda.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Project Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        title="Hapus Proyek Rumah"
        message={`Apakah Anda yakin ingin menghapus proyek "${projectToDelete?.name}"? Seluruh material dan riwayat transaksi pada proyek ini akan disembunyikan.`}
        confirmLabel="Hapus Proyek"
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />

      {/* Logout Confirm Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Keluar dari Akun Google"
        message="Apakah Anda yakin ingin keluar dari akun Google? Seluruh data proyek di perangkat ini tetap aman tersimpan di memori lokal (IndexedDB) dan tidak akan terhapus."
        confirmLabel="Keluar dari Akun"
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Restore from Google Drive Confirm Dialog */}
      <ConfirmDialog
        isOpen={showRestoreDriveConfirm}
        title="Pulihkan dari Google Drive"
        message="Pulihkan data proyek dari Google Drive? Data lokal Anda saat ini akan diselaraskan mengikuti cadangan yang tersimpan di Google Drive."
        confirmLabel="Ya, Pulihkan Data"
        isDestructive={false}
        onConfirm={handleConfirmRestoreFromDrive}
        onCancel={() => setShowRestoreDriveConfirm(false)}
      />
    </div>
  );
};
