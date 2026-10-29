import { db } from '../db/database';
import { exportDatabaseBackup, restoreBackupData, RumahkuBackupData } from '../backup/backupEngine';
import { getCachedAccessToken } from '../auth/authService';

export type SyncStatusType =
  | 'Belum Terhubung'
  | 'Terhubung'
  | 'Menunggu Sinkronisasi'
  | 'Sedang Sinkronisasi'
  | 'Tersinkronisasi'
  | 'Gagal Sinkronisasi'
  | 'Konflik Data';

export type FirstTimeSyncCondition =
  | 'none'
  | 'condition_a' // Local ada, cloud kosong
  | 'condition_b' // Local kosong, cloud ada
  | 'condition_c' // Local dan cloud sama-sama ada
  | 'condition_d'; // Keduanya kosong

export interface CloudFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  revision?: number;
}

export interface SyncState {
  status: SyncStatusType;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage?: string;
  hasConflict: boolean;
  cloudBackupPreview?: RumahkuBackupData | null;
  cloudFileMetadata?: CloudFileMetadata | null;
  firstTimeCondition?: FirstTimeSyncCondition;
  isAutoSyncing: boolean;
}

const CLOUD_SYNC_FILENAME = 'rumahku_cloud_sync.json';

class SyncEngine {
  private listeners: ((state: SyncState) => void)[] = [];
  private debounceTimer: any = null;
  private autoCheckTimer: any = null;
  private currentDeviceId: string = '';

  private state: SyncState = {
    status: 'Belum Terhubung',
    lastSyncedAt: localStorage.getItem('rumahku_last_synced_at') || null,
    pendingCount: 0,
    hasConflict: false,
    firstTimeCondition: 'none',
    isAutoSyncing: false,
  };

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
    this.checkPendingQueue();
    this.setupWindowFocusListener();
  }

  private getOrCreateDeviceId(): string {
    let id = localStorage.getItem('rumahku_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      localStorage.setItem('rumahku_device_id', id);
    }
    return id;
  }

  public subscribe(listener: (state: SyncState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public getState(): SyncState {
    return this.state;
  }

  /**
   * Listen for window focus or tab activation to detect remote changes from another device (HP <-> PC)
   */
  private setupWindowFocusListener() {
    if (typeof window === 'undefined') return;

    const handleFocus = () => {
      const token = getCachedAccessToken();
      if (token && this.state.status !== 'Sedang Sinkronisasi') {
        this.checkForRemoteUpdates(token);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });
  }

  /**
   * Record local mutation to IndexedDB sync_operations and trigger debounced sync
   */
  public async recordOperation(
    entityType: string,
    entityId: string,
    operationType: 'create' | 'update' | 'delete',
    payload: any
  ) {
    try {
      const op = {
        id: crypto.randomUUID(),
        entityType,
        entityId,
        operationType,
        payload,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending' as const,
      };
      await db.sync_operations.add(op);
      this.state.pendingCount += 1;
      if (this.state.status === 'Tersinkronisasi' || this.state.status === 'Terhubung') {
        this.state.status = 'Menunggu Sinkronisasi';
      }
      this.notify();

      // Trigger debounced auto sync (1.5 seconds)
      this.scheduleDebouncedSync();
    } catch (e) {
      console.warn('Could not record sync operation', e);
    }
  }

  public scheduleDebouncedSync() {
    const token = getCachedAccessToken();
    if (!token) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncNow(token);
    }, 1500);
  }

  public async checkPendingQueue() {
    try {
      const count = await db.sync_operations.where('status').equals('pending').count();
      this.state.pendingCount = count;
      this.notify();
    } catch (e) {
      console.warn('Could not check sync operations queue', e);
    }
  }

  /**
   * Check first-time login synchronization condition (Kondisi A, B, C, D)
   */
  public async evaluateFirstTimeSync(accessToken: string): Promise<FirstTimeSyncCondition> {
    this.state.status = 'Sedang Sinkronisasi';
    this.notify();

    try {
      // 1. Check local data in IndexedDB
      const localProjects = await db.projects.filter((p) => !p.deletedAt).toArray();
      const hasLocalData = localProjects.length > 0;

      // 2. Search for cloud file in Google Drive appDataFolder
      const cloudFile = await this.findCloudSyncFile(accessToken);

      let cloudData: RumahkuBackupData | null = null;
      if (cloudFile) {
        cloudData = await this.downloadCloudSyncFile(accessToken, cloudFile.id);
        this.state.cloudBackupPreview = cloudData;
        this.state.cloudFileMetadata = cloudFile;
      } else {
        this.state.cloudBackupPreview = null;
        this.state.cloudFileMetadata = null;
      }

      const hasCloudData = !!cloudData && cloudData.data.projects.length > 0;

      let condition: FirstTimeSyncCondition = 'none';

      if (hasLocalData && !hasCloudData) {
        // Kondisi A: Data lokal ada, data cloud kosong
        condition = 'condition_a';
      } else if (!hasLocalData && hasCloudData) {
        // Kondisi B: Data lokal kosong, data cloud ada
        condition = 'condition_b';
      } else if (hasLocalData && hasCloudData) {
        // Kondisi C: Data lokal dan cloud sama-sama ada
        condition = 'condition_c';
      } else {
        // Kondisi D: Keduanya kosong
        condition = 'condition_d';
      }

      this.state.firstTimeCondition = condition;
      this.state.status = 'Terhubung';
      this.notify();

      return condition;
    } catch (error: any) {
      console.warn('Notice evaluating first time sync:', error?.message || error);
      this.state.status = 'Gagal Sinkronisasi';
      this.state.errorMessage = error?.message || 'Gagal memeriksa data Google Drive.';
      this.notify();
      return 'none';
    }
  }

  /**
   * Search for RUMAHKU sync file inside Google Drive appDataFolder
   */
  public async findCloudSyncFile(accessToken: string): Promise<CloudFileMetadata | null> {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name = '${CLOUD_SYNC_FILENAME}' and trashed = false`,
      fields: 'files(id, name, modifiedTime, size)',
      pageSize: '1',
    });
    const searchUrl = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
    const res = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      let details = '';
      try {
        const errorJson = await res.json();
        details = errorJson?.error?.message || '';
      } catch {
        details = res.statusText;
      }

      if (res.status === 401) {
        throw new Error('Sesi Google telah kedaluwarsa. Silakan masuk ulang.');
      }
      if (res.status === 403) {
        throw new Error(
          details 
            ? `Izin Google Drive ditolak (403): ${details}`
            : 'Izin Google Drive belum aktif atau akses belum disetujui (403).'
        );
      }
      throw new Error(`Gagal membaca Google Drive (${res.status}): ${details || res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0] as CloudFileMetadata;
    }
    return null;
  }

  /**
   * Download cloud sync file from Google Drive appDataFolder
   */
  public async downloadCloudSyncFile(
    accessToken: string,
    fileId: string
  ): Promise<RumahkuBackupData> {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      let details = '';
      try {
        const errorJson = await res.json();
        details = errorJson?.error?.message || '';
      } catch {
        details = res.statusText;
      }
      throw new Error(`Gagal mengunduh file Google Drive (${res.status}): ${details || res.statusText}`);
    }

    const json = await res.json();
    return json as RumahkuBackupData;
  }

  /**
   * Check if a remote device (e.g. Phone vs PC) has pushed newer changes to Drive
   */
  public async checkForRemoteUpdates(accessToken: string): Promise<boolean> {
    try {
      const cloudFile = await this.findCloudSyncFile(accessToken);
      if (!cloudFile) return false;

      const lastLocalSync = this.state.lastSyncedAt;
      if (lastLocalSync) {
        const cloudTime = new Date(cloudFile.modifiedTime).getTime();
        const localTime = new Date(lastLocalSync).getTime();

        // If cloud is newer by more than 2 seconds
        if (cloudTime > localTime + 2000) {
          const cloudData = await this.downloadCloudSyncFile(accessToken, cloudFile.id);
          this.state.cloudBackupPreview = cloudData;
          this.state.cloudFileMetadata = cloudFile;
          this.state.hasConflict = true;
          this.state.status = 'Konflik Data';
          this.notify();
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn('Error checking remote updates', e);
      return false;
    }
  }

  /**
   * Perform Synchronization: Upload local IndexedDB snapshot to Google Drive appDataFolder
   */
  public async syncNow(accessToken?: string | null): Promise<{ success: boolean; message: string }> {
    const token = accessToken || getCachedAccessToken();

    if (!token) {
      this.state.status = 'Belum Terhubung';
      this.notify();
      return { success: false, message: 'Google Drive belum terhubung.' };
    }

    if (!navigator.onLine) {
      this.state.status = 'Menunggu Sinkronisasi';
      this.state.errorMessage = 'Perangkat sedang luring (offline). Sinkronisasi akan dilanjutkan saat terhubung internet.';
      this.notify();
      return { success: false, message: this.state.errorMessage };
    }

    this.state.status = 'Sedang Sinkronisasi';
    this.state.errorMessage = undefined;
    this.notify();

    try {
      // 1. Export current IndexedDB data
      const localBackup = await exportDatabaseBackup();

      // 2. Attach revision metadata and device ID
      const currentRev = parseInt(localStorage.getItem('rumahku_cloud_revision') || '1', 10) + 1;
      (localBackup as any).revision = currentRev;
      (localBackup as any).lastDeviceId = this.currentDeviceId;
      (localBackup as any).lastDeviceName = navigator.userAgent.includes('Mobile') ? 'Smartphone' : 'Komputer Desktop';

      // 3. Upload to Google Drive appDataFolder using Multipart Upload
      await this.uploadToGoogleDrive(token, localBackup);

      // 4. Mark pending operations as completed
      await db.sync_operations.where('status').equals('pending').modify({ status: 'completed' });

      const now = new Date().toISOString();
      localStorage.setItem('rumahku_last_synced_at', now);
      localStorage.setItem('rumahku_cloud_revision', currentRev.toString());

      this.state.status = 'Tersinkronisasi';
      this.state.lastSyncedAt = now;
      this.state.pendingCount = 0;
      this.state.hasConflict = false;
      this.notify();

      return { success: true, message: 'Data proyek berhasil disinkronkan ke Google Drive!' };
    } catch (error: any) {
      console.warn('Sync notice:', error?.message || error);
      const errMsg = error?.message || 'Gagal menyinkronkan data ke Google Drive.';
      this.state.status = 'Gagal Sinkronisasi';
      this.state.errorMessage = errMsg;
      this.notify();
      return { success: false, message: errMsg };
    }
  }

  /**
   * Upload data using Google Drive Multipart API to appDataFolder
   */
  private async uploadToGoogleDrive(accessToken: string, backup: RumahkuBackupData) {
    const existing = await this.findCloudSyncFile(accessToken);

    const metadata = {
      name: CLOUD_SYNC_FILENAME,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    };

    const boundary = '-------RUMAHKU_SYNC_BOUNDARY_12345';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(backup) +
      closeDelimiter;

    let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (existing) {
      uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`;
      method = 'PATCH';
    }

    const uploadRes = await fetch(uploadUrl, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!uploadRes.ok) {
      let errDetails = '';
      try {
        const errJson = await uploadRes.json();
        errDetails = errJson?.error?.message || '';
      } catch {
        errDetails = await uploadRes.text();
      }

      if (uploadRes.status === 401) {
        throw new Error('Sesi Google telah kedaluwarsa. Silakan masuk ulang.');
      }
      if (uploadRes.status === 403) {
        throw new Error(
          errDetails 
            ? `Izin Google Drive ditolak (403): ${errDetails}`
            : 'Izin Google Drive belum aktif atau akses belum disetujui (403).'
        );
      }
      throw new Error(`Google Drive API Error (${uploadRes.status}): ${errDetails || uploadRes.statusText}`);
    }
  }

  /**
   * Resolve conflict: choose whether to keep local data or apply cloud data
   */
  public async resolveConflict(
    resolution: 'keep_local' | 'use_cloud' | 'merge',
    accessToken?: string
  ): Promise<void> {
    const token = accessToken || getCachedAccessToken();

    if (resolution === 'use_cloud' && this.state.cloudBackupPreview) {
      await restoreBackupData(this.state.cloudBackupPreview, 'replace');
    } else if (resolution === 'merge' && this.state.cloudBackupPreview) {
      await restoreBackupData(this.state.cloudBackupPreview, 'merge');
      if (token) {
        await this.syncNow(token);
      }
    } else if (resolution === 'keep_local' && token) {
      await this.syncNow(token);
    }

    this.state.hasConflict = false;
    this.state.cloudBackupPreview = null;
    this.state.status = 'Tersinkronisasi';
    this.notify();
  }

  public dismissFirstTimeCondition() {
    this.state.firstTimeCondition = 'none';
    this.notify();
  }

  /**
   * Reset sync engine state on logout
   */
  public reset() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    localStorage.removeItem('rumahku_last_synced_at');
    this.state = {
      status: 'Belum Terhubung',
      lastSyncedAt: null,
      pendingCount: 0,
      hasConflict: false,
      firstTimeCondition: 'none',
      isAutoSyncing: false,
    };
    this.notify();
  }
}

export const syncEngine = new SyncEngine();
