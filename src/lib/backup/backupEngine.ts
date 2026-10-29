import { db } from '../db/database';
import {
  Project,
  ProjectImage,
  MaterialCategory,
  Material,
  Purchase,
  FinancialTransaction,
  Attachment,
} from '../../types';

export interface RumahkuBackupData {
  appName: 'RUMAHKU';
  schemaVersion: 1;
  exportedAt: string;
  projectCount: number;
  data: {
    projects: Project[];
    project_images: ProjectImage[];
    material_categories: MaterialCategory[];
    materials: Material[];
    purchases: Purchase[];
    financial_transactions: FinancialTransaction[];
    attachments: Attachment[];
  };
}

export interface ValidationSummary {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    projects: number;
    materials: number;
    purchases: number;
    transactions: number;
    images: number;
  };
}

/**
 * Export all non-deleted data or single project data to a JSON downloadable blob
 */
export async function exportDatabaseBackup(projectId?: string): Promise<RumahkuBackupData> {
  const filterByProject = <T extends { projectId?: string; id?: string }>(items: T[]): T[] => {
    if (!projectId) return items;
    return items.filter((i) => i.projectId === projectId || i.id === projectId);
  };

  const allProjects = await db.projects.toArray();
  const allImages = await db.project_images.toArray();
  const allCategories = await db.material_categories.toArray();
  const allMaterials = await db.materials.toArray();
  const allPurchases = await db.purchases.toArray();
  const allTransactions = await db.financial_transactions.toArray();
  const allAttachments = await db.attachments.toArray();

  const projects = filterByProject(allProjects);
  const project_images = filterByProject(allImages);
  const material_categories = filterByProject(allCategories);
  const materials = filterByProject(allMaterials);
  const purchases = filterByProject(allPurchases);
  const financial_transactions = filterByProject(allTransactions);
  const attachments = filterByProject(allAttachments);

  return {
    appName: 'RUMAHKU',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    projectCount: projects.length,
    data: {
      projects,
      project_images,
      material_categories,
      materials,
      purchases,
      financial_transactions,
      attachments,
    },
  };
}

/**
 * Trigger file download in browser
 */
export function downloadBackupFile(backupData: RumahkuBackupData, filenamePrefix = 'rumahku-backup') {
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `${filenamePrefix}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported backup file structure and integrity
 */
export function validateBackupData(data: any): ValidationSummary {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Format file tidak valid atau bukan file JSON yang sesuai.'],
      warnings: [],
      stats: { projects: 0, materials: 0, purchases: 0, transactions: 0, images: 0 },
    };
  }

  if (data.appName !== 'RUMAHKU') {
    errors.push('File ini bukan file cadangan aplikasi RUMAHKU.');
  }

  if (data.schemaVersion !== 1) {
    warnings.push(`Versi skema cadangan (${data.schemaVersion}) berbeda dengan sistem saat ini (1).`);
  }

  const payload = data.data;
  if (!payload || typeof payload !== 'object') {
    errors.push('Data konten cadangan tidak ditemukan.');
    return {
      isValid: false,
      errors,
      warnings,
      stats: { projects: 0, materials: 0, purchases: 0, transactions: 0, images: 0 },
    };
  }

  const projects = Array.isArray(payload.projects) ? payload.projects : [];
  const materials = Array.isArray(payload.materials) ? payload.materials : [];
  const purchases = Array.isArray(payload.purchases) ? payload.purchases : [];
  const transactions = Array.isArray(payload.financial_transactions) ? payload.financial_transactions : [];
  const images = Array.isArray(payload.project_images) ? payload.project_images : [];

  if (projects.length === 0) {
    warnings.push('File cadangan tidak memuat data proyek aktif.');
  }

  // Check project IDs
  const projectIds = new Set(projects.map((p: any) => p.id));

  // Check orphaned materials
  const orphanedMaterials = materials.filter((m: any) => !projectIds.has(m.projectId));
  if (orphanedMaterials.length > 0) {
    warnings.push(`${orphanedMaterials.length} material memiliki referensi proyek yang tidak terdaftar.`);
  }

  // Check orphaned transactions
  const orphanedTransactions = transactions.filter((t: any) => !projectIds.has(t.projectId));
  if (orphanedTransactions.length > 0) {
    warnings.push(`${orphanedTransactions.length} transaksi memiliki referensi proyek yang tidak terdaftar.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      projects: projects.length,
      materials: materials.length,
      purchases: purchases.length,
      transactions: transactions.length,
      images: images.length,
    },
  };
}

/**
 * Restore data into IndexedDB with specified mode: 'as_new' | 'merge' | 'replace'
 */
export async function restoreBackupData(
  backup: RumahkuBackupData,
  mode: 'as_new' | 'merge' | 'replace'
): Promise<{ success: boolean; activeProjectId: string }> {
  const { data } = backup;

  if (mode === 'replace') {
    // Clear existing operational data safely inside transaction
    await db.transaction('rw', [
      db.projects,
      db.project_images,
      db.material_categories,
      db.materials,
      db.purchases,
      db.financial_transactions,
      db.attachments,
      db.settings,
    ], async () => {
      await db.projects.clear();
      await db.project_images.clear();
      await db.material_categories.clear();
      await db.materials.clear();
      await db.purchases.clear();
      await db.financial_transactions.clear();
      await db.attachments.clear();

      if (data.projects.length > 0) await db.projects.bulkAdd(data.projects);
      if (data.project_images.length > 0) await db.project_images.bulkAdd(data.project_images);
      if (data.material_categories.length > 0) await db.material_categories.bulkAdd(data.material_categories);
      if (data.materials.length > 0) await db.materials.bulkAdd(data.materials);
      if (data.purchases.length > 0) await db.purchases.bulkAdd(data.purchases);
      if (data.financial_transactions.length > 0) await db.financial_transactions.bulkAdd(data.financial_transactions);
      if (data.attachments.length > 0) await db.attachments.bulkAdd(data.attachments);

      const firstProj = data.projects[0];
      if (firstProj) {
        await db.settings.put({
          id: 'active_project',
          key: 'active_project_id',
          value: firstProj.id,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return { success: true, activeProjectId: data.projects[0]?.id || '' };
  }

  if (mode === 'as_new') {
    // Generate new UUIDs for every entity to avoid conflict
    const idMap = new Map<string, string>();
    const generateNewId = (oldId: string) => {
      if (!idMap.has(oldId)) idMap.set(oldId, crypto.randomUUID());
      return idMap.get(oldId)!;
    };

    const newProjects = data.projects.map((p) => ({
      ...p,
      id: generateNewId(p.id),
      name: `${p.name} (Pulihan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newCategories = data.material_categories.map((c) => ({
      ...c,
      id: generateNewId(c.id),
      projectId: generateNewId(c.projectId),
    }));

    const newMaterials = data.materials.map((m) => ({
      ...m,
      id: generateNewId(m.id),
      projectId: generateNewId(m.projectId),
      categoryId: generateNewId(m.categoryId),
    }));

    const newPurchases = data.purchases.map((pu) => ({
      ...pu,
      id: generateNewId(pu.id),
      projectId: generateNewId(pu.projectId),
      materialId: generateNewId(pu.materialId),
    }));

    const newTransactions = data.financial_transactions.map((tx) => ({
      ...tx,
      id: generateNewId(tx.id),
      projectId: generateNewId(tx.projectId),
      referenceId: tx.referenceId ? generateNewId(tx.referenceId) : undefined,
    }));

    const newImages = data.project_images.map((img) => ({
      ...img,
      id: generateNewId(img.id),
      projectId: generateNewId(img.projectId),
    }));

    await db.transaction('rw', [
      db.projects,
      db.project_images,
      db.material_categories,
      db.materials,
      db.purchases,
      db.financial_transactions,
      db.settings,
    ], async () => {
      if (newProjects.length > 0) await db.projects.bulkAdd(newProjects);
      if (newCategories.length > 0) await db.material_categories.bulkAdd(newCategories);
      if (newMaterials.length > 0) await db.materials.bulkAdd(newMaterials);
      if (newPurchases.length > 0) await db.purchases.bulkAdd(newPurchases);
      if (newTransactions.length > 0) await db.financial_transactions.bulkAdd(newTransactions);
      if (newImages.length > 0) await db.project_images.bulkAdd(newImages);

      if (newProjects[0]) {
        await db.settings.put({
          id: 'active_project',
          key: 'active_project_id',
          value: newProjects[0].id,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return { success: true, activeProjectId: newProjects[0]?.id || '' };
  }

  // Merge mode: put items by existing ID (idempotent upsert)
  await db.transaction('rw', [
    db.projects,
    db.project_images,
    db.material_categories,
    db.materials,
    db.purchases,
    db.financial_transactions,
    db.attachments,
    db.settings,
  ], async () => {
    for (const p of data.projects) await db.projects.put(p);
    for (const i of data.project_images) await db.project_images.put(i);
    for (const c of data.material_categories) await db.material_categories.put(c);
    for (const m of data.materials) await db.materials.put(m);
    for (const pu of data.purchases) await db.purchases.put(pu);
    for (const tx of data.financial_transactions) await db.financial_transactions.put(tx);
    for (const a of data.attachments) await db.attachments.put(a);

    if (data.projects[0]) {
      await db.settings.put({
        id: 'active_project',
        key: 'active_project_id',
        value: data.projects[0].id,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return { success: true, activeProjectId: data.projects[0]?.id || '' };
}
