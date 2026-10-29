import Dexie, { type Table } from 'dexie';
import {
  Project,
  ProjectImage,
  MaterialCategory,
  Material,
  Purchase,
  FinancialTransaction,
  Attachment,
  AppSetting,
  SyncMetadata,
  SyncOperation,
} from '../../types';

export class RumahkuDatabase extends Dexie {
  projects!: Table<Project, string>;
  project_images!: Table<ProjectImage, string>;
  material_categories!: Table<MaterialCategory, string>;
  materials!: Table<Material, string>;
  purchases!: Table<Purchase, string>;
  financial_transactions!: Table<FinancialTransaction, string>;
  attachments!: Table<Attachment, string>;
  settings!: Table<AppSetting, string>;
  sync_metadata!: Table<SyncMetadata, string>;
  sync_operations!: Table<SyncOperation, string>;

  constructor() {
    super('RumahkuDB');

    this.version(1).stores({
      projects: 'id, status, createdAt, deletedAt',
      project_images: 'id, projectId, isPrimary, createdAt, deletedAt',
      material_categories: 'id, projectId, sortOrder, createdAt, deletedAt',
      materials: 'id, projectId, categoryId, name, createdAt, deletedAt',
      purchases: 'id, projectId, materialId, purchaseDate, createdAt, deletedAt',
      financial_transactions: 'id, projectId, type, referenceId, transactionDate, paymentStatus, createdAt, deletedAt',
      attachments: 'id, projectId, transactionId, purchaseId, createdAt, deletedAt',
      settings: 'id, key, updatedAt',
      sync_metadata: 'id, entityType, entityId, revision, syncStatus, updatedAt',
      sync_operations: 'id, entityType, entityId, status, createdAt',
    });
  }
}

export const db = new RumahkuDatabase();

// Standard starter categories generator
export function getDefaultCategories(projectId: string): MaterialCategory[] {
  const now = new Date().toISOString();
  return [
    { id: crypto.randomUUID(), projectId, name: 'Pondasi & Struktur', sortOrder: 1, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), projectId, name: 'Dinding & Plesteran', sortOrder: 2, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), projectId, name: 'Atap & Rangka', sortOrder: 3, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), projectId, name: 'Lantai & Keramik', sortOrder: 4, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), projectId, name: 'Pintu, Jendela & Kaca', sortOrder: 5, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), projectId, name: 'Sanitasi & Pipa Air', sortOrder: 6, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), projectId, name: 'Kelistrikan & Lampu', sortOrder: 7, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), projectId, name: 'Cat & Finishing', sortOrder: 8, createdAt: now, updatedAt: now },
  ];
}

// Initial seed helper
export async function seedInitialDataIfNeeded(): Promise<string> {
  const count = await db.projects.filter(p => !p.deletedAt).count();
  if (count > 0) {
    // Return the active project or the first project
    const activeSetting = await db.settings.where('key').equals('active_project_id').first();
    if (activeSetting?.value) {
      const exists = await db.projects.get(activeSetting.value);
      if (exists && !exists.deletedAt) return exists.id;
    }
    const first = await db.projects.filter(p => !p.deletedAt).first();
    return first!.id;
  }

  const now = new Date().toISOString();
  const projectId = crypto.randomUUID();

  // Create Project
  const project: Project = {
    id: projectId,
    name: 'Rumah Impian Minimalis',
    description: 'Pembangunan rumah tinggal 1 lantai tipe 45 modern minimalis.',
    length: 7.5,
    width: 6.0,
    location: 'Bandung, Jawa Barat',
    startDate: new Date().toISOString().split('T')[0],
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };

  // Seed Categories
  const categories = getDefaultCategories(projectId);

  // Sample Materials (matching prompt example: 55 batang @ Rp85.000)
  const catStruktur = categories.find(c => c.name === 'Pondasi & Struktur') || categories[0];
  const catDinding = categories.find(c => c.name === 'Dinding & Plesteran') || categories[1];
  const catLantai = categories.find(c => c.name === 'Lantai & Keramik') || categories[3];

  const materialBesi: Material = {
    id: crypto.randomUUID(),
    projectId,
    categoryId: catStruktur.id,
    name: 'Besi Beton Ulir 10mm',
    brand: 'Krakatau Steel (KS)',
    specification: 'SNI Panjang 12 meter',
    requiredQuantity: 55,
    unit: 'Batang',
    estimatedUnitPrice: 85000,
    notes: 'Kebutuhan kolom utama dan balok sloof',
    createdAt: now,
    updatedAt: now,
  };

  const materialSemen: Material = {
    id: crypto.randomUUID(),
    projectId,
    categoryId: catStruktur.id,
    name: 'Semen Portland Komposit',
    brand: 'Tiga Roda',
    specification: 'Sak 50 kg',
    requiredQuantity: 80,
    unit: 'Sak',
    estimatedUnitPrice: 68000,
    notes: 'Pondasi, cor sloof dan pasangan bata',
    createdAt: now,
    updatedAt: now,
  };

  const materialHebel: Material = {
    id: crypto.randomUUID(),
    projectId,
    categoryId: catDinding.id,
    name: 'Bata Ringan Hebel',
    brand: 'Grand Elephant / Citicon',
    specification: 'Ukuran 60 x 20 x 10 cm (Grade A)',
    requiredQuantity: 9,
    unit: 'Kubik',
    estimatedUnitPrice: 650000,
    notes: 'Dinding keliling dan partisi dalam',
    createdAt: now,
    updatedAt: now,
  };

  const materialKeramik: Material = {
    id: crypto.randomUUID(),
    projectId,
    categoryId: catLantai.id,
    name: 'Granit Tile Glazed Polished 60x60',
    brand: 'Indogress',
    specification: 'Isi 4 pcs per dus (1.44 m2)',
    requiredQuantity: 35,
    unit: 'Dus',
    estimatedUnitPrice: 195000,
    notes: 'Area ruang tamu, keluarga dan kamar',
    createdAt: now,
    updatedAt: now,
  };

  // Sample Income (Dana Masuk)
  const incomeTx: FinancialTransaction = {
    id: crypto.randomUUID(),
    projectId,
    type: 'income',
    amount: 100000000, // Rp100.000.000 (Test Scenario 1)
    transactionDate: new Date().toISOString().split('T')[0],
    description: 'Dana Awal Tabungan Pembangunan Rumah',
    paymentStatus: 'paid',
    createdAt: now,
    updatedAt: now,
  };

  // Sample Purchase: 20 batang @ Rp85.000 = Rp1.700.000 (Test Scenario 3 & 4)
  const purchaseId = crypto.randomUUID();
  const samplePurchase: Purchase = {
    id: purchaseId,
    projectId,
    materialId: materialBesi.id,
    quantity: 20,
    unitPrice: 85000,
    totalPrice: 1700000,
    supplierName: 'TB Makmur Jaya',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: 'Tahap 1 pengiriman material besi',
    createdAt: now,
    updatedAt: now,
  };

  // Sample Payment against purchase: Rp1.000.000 (Test Scenario 4: Remaining 700.000)
  const paymentTx: FinancialTransaction = {
    id: crypto.randomUUID(),
    projectId,
    type: 'material_payment',
    referenceId: purchaseId,
    amount: 1000000, // Rp1.000.000
    transactionDate: new Date().toISOString().split('T')[0],
    description: 'Uang Muka Pembelian Besi Beton 20 Batang',
    paymentStatus: 'paid',
    createdAt: now,
    updatedAt: now,
  };

  // Sample placeholder house vector banner
  const sampleHouseBannerSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="100%" stop-color="%231e293b"/></linearGradient><linearGradient id="wall" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23e2e8f0"/><stop offset="100%" stop-color="%23cbd5e1"/></linearGradient><linearGradient id="roof" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%23047857"/></linearGradient><linearGradient id="wood" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23b45309"/><stop offset="100%" stop-color="%2378350f"/></linearGradient></defs><rect width="1200" height="600" fill="url(%23sky)"/><rect y="480" width="1200" height="120" fill="%23064e3b"/><path d="M400 480 L400 280 L600 150 L800 280 L800 480 Z" fill="url(%23wall)" stroke="%23334155" stroke-width="4"/><path d="M370 290 L600 135 L830 290 L810 310 L600 170 L390 310 Z" fill="url(%23roof)"/><rect x="560" y="340" width="80" height="140" fill="url(%23wood)" rx="4"/><circle cx="625" cy="410" r="4" fill="%23fef08a"/><rect x="440" y="330" width="80" height="90" fill="%2338bdf8" opacity="0.85" rx="4"/><line x1="480" y1="330" x2="480" y2="420" stroke="%23ffffff" stroke-width="3"/><line x1="440" y1="375" x2="520" y2="375" stroke="%23ffffff" stroke-width="3"/><rect x="680" y="330" width="80" height="90" fill="%2338bdf8" opacity="0.85" rx="4"/><line x1="720" y1="330" x2="720" y2="420" stroke="%23ffffff" stroke-width="3"/><line x1="680" y1="375" x2="760" y2="375" stroke="%23ffffff" stroke-width="3"/><text x="600" y="550" fill="%23ecfdf5" font-family="system-ui" font-size="24" font-weight="bold" text-anchor="middle">RUMAHKU — Tipe 45 Modern Minimalis</text></svg>`;

  const imageId = crypto.randomUUID();
  const sampleImage: ProjectImage = {
    id: imageId,
    projectId,
    fileName: 'desain-rumah-minimalis.svg',
    mimeType: 'image/svg+xml',
    fileSize: 2400,
    dataUrl: sampleHouseBannerSvg,
    isPrimary: true,
    createdAt: now,
    updatedAt: now,
  };

  project.mainImageId = imageId;

  await db.transaction('rw', [
    db.projects,
    db.material_categories,
    db.materials,
    db.purchases,
    db.financial_transactions,
    db.project_images,
    db.settings,
  ], async () => {
    await db.projects.add(project);
    await db.material_categories.bulkAdd(categories);
    await db.materials.bulkAdd([materialBesi, materialSemen, materialHebel, materialKeramik]);
    await db.purchases.add(samplePurchase);
    await db.financial_transactions.bulkAdd([incomeTx, paymentTx]);
    await db.project_images.add(sampleImage);
    await db.settings.put({
      id: 'active_project',
      key: 'active_project_id',
      value: projectId,
      updatedAt: now,
    });
  });

  return projectId;
}
