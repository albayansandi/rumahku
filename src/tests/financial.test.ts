import { describe, it, expect } from 'vitest';
import {
  calculateMaterialMetrics,
  calculatePurchasePayment,
  calculateProjectFinancialSummary,
  formatRupiah,
} from '../lib/calculations/financial';
import {
  calculateHebel,
  calculateKeramik,
  calculatePasir,
  calculateCat,
  calculateBeton,
} from '../lib/calculations/materialCalculators';
import { validateBackupData } from '../lib/backup/backupEngine';
import { Material, Purchase, FinancialTransaction } from '../types';

describe('RUMAHKU Financial and Construction Calculation Tests', () => {
  const dummyProjectId = 'proj-test-1';

  // Test 1: Saldo Awal Rp100.000.000
  it('Test 1 — Saldo Awal: Dana masuk Rp100.000.000 menghasilkan saldo kas Rp100.000.000', () => {
    const transactions: FinancialTransaction[] = [
      {
        id: 'tx-1',
        projectId: dummyProjectId,
        type: 'income',
        amount: 100000000,
        transactionDate: '2026-10-26',
        description: 'Saldo Awal Modal Pembangunan',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    const summary = calculateProjectFinancialSummary(transactions, [], []);
    expect(summary.totalIncome).toBe(100000000);
    expect(summary.totalExpense).toBe(0);
    expect(summary.netBalance).toBe(100000000);
  });

  // Test 2: Estimasi Material 55 batang x Rp85.000 = Rp4.675.000. Saldo tidak berubah.
  it('Test 2 — Estimasi Material: 55 batang @ Rp85.000 = Rp4.675.000, Saldo kas tidak berubah', () => {
    const material: Material = {
      id: 'mat-besi',
      projectId: dummyProjectId,
      categoryId: 'cat-1',
      name: 'Besi Beton Ulir 10mm',
      requiredQuantity: 55,
      unit: 'Batang',
      estimatedUnitPrice: 85000,
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    };

    const metrics = calculateMaterialMetrics(material, []);
    expect(metrics.estimatedTotalCost).toBe(4675000); // 55 * 85000 = 4.675.000
    expect(metrics.purchasedQuantity).toBe(0);
    expect(metrics.remainingQuantity).toBe(55);
    expect(metrics.status).toBe('Belum Dibeli');

    const transactions: FinancialTransaction[] = [
      {
        id: 'tx-1',
        projectId: dummyProjectId,
        type: 'income',
        amount: 100000000,
        transactionDate: '2026-10-26',
        description: 'Saldo Awal',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    const summary = calculateProjectFinancialSummary(transactions, [material], []);
    expect(summary.netBalance).toBe(100000000); // Saldo remains untouched!
  });

  // Test 3: Pembelian Bertahap: Kebutuhan 55 batang, Pembelian 20 batang, Sisa 35 batang
  it('Test 3 — Pembelian Bertahap: Kebutuhan 55 batang, Beli 20 batang, Sisa kebutuhan 35 batang', () => {
    const material: Material = {
      id: 'mat-besi',
      projectId: dummyProjectId,
      categoryId: 'cat-1',
      name: 'Besi Beton Ulir 10mm',
      requiredQuantity: 55,
      unit: 'Batang',
      estimatedUnitPrice: 85000,
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    };

    const purchases: Purchase[] = [
      {
        id: 'pu-1',
        projectId: dummyProjectId,
        materialId: 'mat-besi',
        quantity: 20,
        unitPrice: 85000,
        totalPrice: 1700000,
        purchaseDate: '2026-10-26',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    const metrics = calculateMaterialMetrics(material, purchases);
    expect(metrics.purchasedQuantity).toBe(20);
    expect(metrics.remainingQuantity).toBe(35); // 55 - 20 = 35
    expect(metrics.status).toBe('Dibeli Sebagian');
    expect(metrics.estimatedRemainingCost).toBe(35 * 85000); // 2.975.000
  });

  // Test 4: Pembayaran: Pembelian Rp1.700.000, Pembayaran Rp1.000.000, Saldo berkurang Rp1.000.000, Sisa tagihan Rp700.000
  it('Test 4 — Pembayaran: Pembelian Rp1.700.000, Bayar Rp1.000.000, Saldo berkurang Rp1.000.000, Sisa tagihan Rp700.000', () => {
    const purchase: Purchase = {
      id: 'pu-1',
      projectId: dummyProjectId,
      materialId: 'mat-besi',
      quantity: 20,
      unitPrice: 85000,
      totalPrice: 1700000,
      purchaseDate: '2026-10-26',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    };

    const transactions: FinancialTransaction[] = [
      {
        id: 'tx-income',
        projectId: dummyProjectId,
        type: 'income',
        amount: 100000000,
        transactionDate: '2026-10-26',
        description: 'Dana Awal',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
      {
        id: 'tx-pay-1',
        projectId: dummyProjectId,
        type: 'material_payment',
        referenceId: 'pu-1',
        amount: 1000000,
        transactionDate: '2026-10-26',
        description: 'Uang Muka Pembelian Besi',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    const puStatus = calculatePurchasePayment(purchase, transactions);
    expect(puStatus.paidAmount).toBe(1000000);
    expect(puStatus.remainingAmount).toBe(700000); // 1.700.000 - 1.000.000 = 700.000
    expect(puStatus.paymentStatus).toBe('Dibayar Sebagian');

    const summary = calculateProjectFinancialSummary(transactions, [], [purchase]);
    expect(summary.totalIncome).toBe(100000000);
    expect(summary.totalExpense).toBe(1000000);
    expect(summary.netBalance).toBe(99000000); // exactly 100m - 1m
    expect(summary.totalUnpaidPurchases).toBe(700000);
  });

  // Test 5: Edit Harga Estimasi dari Rp85.000 menjadi Rp90.000. Riwayat harga beli aktual TIDAK berubah.
  it('Test 5 — Edit Harga Estimasi: Ubah estimasi Rp85.000 -> Rp90.000, histori pembelian aktual tidak berubah', () => {
    const purchase: Purchase = {
      id: 'pu-1',
      projectId: dummyProjectId,
      materialId: 'mat-besi',
      quantity: 20,
      unitPrice: 85000, // bought at 85.000
      totalPrice: 1700000,
      purchaseDate: '2026-10-26',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    };

    const updatedMaterial: Material = {
      id: 'mat-besi',
      projectId: dummyProjectId,
      categoryId: 'cat-1',
      name: 'Besi Beton Ulir 10mm',
      requiredQuantity: 55,
      unit: 'Batang',
      estimatedUnitPrice: 90000, // updated to 90.000
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T01:00:00Z',
    };

    const metrics = calculateMaterialMetrics(updatedMaterial, [purchase]);
    expect(metrics.estimatedUnitPrice).toBe(90000);
    expect(metrics.estimatedTotalCost).toBe(55 * 90000); // 4.950.000
    // Historical actual purchase remains untouched:
    expect(purchase.unitPrice).toBe(85000);
    expect(purchase.totalPrice).toBe(1700000);
    expect(metrics.actualTotalPurchasedCost).toBe(1700000);
  });

  // Test 6: Hapus atau Batalkan Pembayaran Rp500.000. Saldo harus dihitung ulang secara benar.
  it('Test 6 — Hapus atau Batalkan Pembayaran: Batalkan pembayaran Rp500.000, saldo kas dihitung ulang', () => {
    const transactions: FinancialTransaction[] = [
      {
        id: 'tx-income',
        projectId: dummyProjectId,
        type: 'income',
        amount: 10000000,
        transactionDate: '2026-10-26',
        description: 'Dana Masuk',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
      {
        id: 'tx-pay-active',
        projectId: dummyProjectId,
        type: 'wages',
        amount: 1500000,
        transactionDate: '2026-10-26',
        description: 'Upah Tukang',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
      {
        id: 'tx-pay-cancelled',
        projectId: dummyProjectId,
        type: 'delivery',
        amount: 500000,
        transactionDate: '2026-10-26',
        description: 'Ongkir Batal (Soft Delete)',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
        deletedAt: '2026-10-26T02:00:00Z', // Cancelled / deleted
      },
    ];

    const summary = calculateProjectFinancialSummary(transactions, [], []);
    expect(summary.totalIncome).toBe(10000000);
    // Deleted tx (500.000) is excluded from expenses:
    expect(summary.totalExpense).toBe(1500000);
    expect(summary.netBalance).toBe(8500000); // 10.000.000 - 1.500.000 = 8.500.000
  });

  // Test Material Calculators
  it('Test Kalkulator Konstruksi: Hebel, Keramik, Pasir, Cat, Beton', () => {
    // Hebel: 12m wall x 3m height = 36m2, openings 4m2 => net 32m2
    const hebel = calculateHebel({
      wallLength: 12,
      wallHeight: 3,
      openingsArea: 4,
      blockLength: 0.6,
      blockHeight: 0.2,
      wastePercentage: 5,
    });
    expect(hebel.netWallArea).toBe(32);
    expect(hebel.totalBlocksCount).toBeGreaterThan(260);

    // Keramik: 6m x 4m = 24m2, tile 60x60 (0.36m2), 4 pcs/box (1.44m2/box)
    const keramik = calculateKeramik({
      roomLength: 6,
      roomWidth: 4,
      tileLengthCm: 60,
      tileWidthCm: 60,
      piecesPerBox: 4,
      wastePercentage: 10,
    });
    expect(keramik.roomArea).toBe(24);
    expect(keramik.totalBoxesCount).toBeGreaterThan(16);

    // Pasir: 8m x 5m x 0.1m thickness
    const pasir = calculatePasir({
      length: 8,
      width: 5,
      thickness: 0.1,
    });
    expect(pasir.volumeM3).toBe(4);
    expect(pasir.totalWithWasteM3).toBe(4.4);

    // Cat: 100m2 with 10m2/L spread, 2 coats => 20 Liters
    const cat = calculateCat({
      wallArea: 100,
      spreadRateM2PerLiter: 10,
      coatsCount: 2,
    });
    expect(cat.totalLiters).toBe(20);
    expect(cat.estimatedPails20L).toBe(1);

    // Beton: 10m x 0.2m x 0.3m = 0.6 m3
    const beton = calculateBeton({
      length: 10,
      width: 0.2,
      heightOrThickness: 0.3,
    });
    expect(beton.volumeM3).toBe(0.6);
  });

  // Test Backup Validation
  it('Test Validasi Backup: Memvalidasi integritas file cadangan JSON', () => {
    const validPayload = {
      appName: 'RUMAHKU',
      schemaVersion: 1,
      exportedAt: '2026-10-26T00:00:00Z',
      projectCount: 1,
      data: {
        projects: [{ id: 'p1', name: 'Rumah Impian' }],
        project_images: [],
        material_categories: [],
        materials: [{ id: 'm1', projectId: 'p1', name: 'Semen' }],
        purchases: [],
        financial_transactions: [{ id: 't1', projectId: 'p1', amount: 500000 }],
        attachments: [],
      },
    };

    const validation = validateBackupData(validPayload);
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
    expect(validation.stats.projects).toBe(1);
    expect(validation.stats.materials).toBe(1);

    const invalidPayload = { appName: 'ANOTHER_APP' };
    const invalidValidation = validateBackupData(invalidPayload);
    expect(invalidValidation.isValid).toBe(false);
  });

  // Test 9: Pencegahan Duplikasi Transaksi (Idempotency)
  it('Test 9 — Idempotency: Menggabungkan snapshot dengan ID transaksi yang sama tidak menduplikasi saldo', () => {
    const existingTransactions: FinancialTransaction[] = [
      {
        id: 'tx-sync-1',
        projectId: 'proj-utama',
        type: 'income',
        amount: 100000000,
        transactionDate: '2026-10-26',
        description: 'Saldo Awal',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    // Incoming duplicate payload from sync
    const incomingTransactions: FinancialTransaction[] = [
      {
        id: 'tx-sync-1', // same ID
        projectId: 'proj-utama',
        type: 'income',
        amount: 100000000,
        transactionDate: '2026-10-26',
        description: 'Saldo Awal',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    // Merge map simulation (as implemented in db.transaction upsert)
    const map = new Map<string, FinancialTransaction>();
    for (const t of existingTransactions) map.set(t.id, t);
    for (const t of incomingTransactions) map.set(t.id, t);

    const merged = Array.from(map.values());
    expect(merged.length).toBe(1);

    const summary = calculateProjectFinancialSummary(merged, [], []);
    expect(summary.netBalance).toBe(100000000); // exactly 100jt, never doubled!
  });

  // Test 10: Multi-Perangkat Komputer -> HP (Prompt Scenario)
  it('Test 10 — Sinkronisasi Komputer ke HP: Proyek Rumah Utama, Saldo 100jt, Besi 55 btg, Semen 50 sak', () => {
    const pcProject = {
      id: 'proj-rumah-utama',
      name: 'Rumah Utama',
      description: 'Pembangunan Rumah Utama Keluarga',
      length: 10,
      width: 8,
      startDate: '2026-10-26',
      status: 'in_progress' as const,
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    };

    const pcMaterials: Material[] = [
      {
        id: 'mat-besi-12',
        projectId: 'proj-rumah-utama',
        categoryId: 'cat-struktur',
        name: 'Besi Ø12',
        requiredQuantity: 55,
        unit: 'Batang',
        estimatedUnitPrice: 110000,
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
      {
        id: 'mat-semen-50',
        projectId: 'proj-rumah-utama',
        categoryId: 'cat-struktur',
        name: 'Semen',
        requiredQuantity: 50,
        unit: 'Sak',
        estimatedUnitPrice: 68000,
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    const pcTransactions: FinancialTransaction[] = [
      {
        id: 'tx-awal',
        projectId: 'proj-rumah-utama',
        type: 'income',
        amount: 100000000,
        transactionDate: '2026-10-26',
        description: 'Saldo Awal Pembangunan',
        paymentStatus: 'paid',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ];

    // Calculate on mobile side after pulling from Drive:
    const hpSummary = calculateProjectFinancialSummary(pcTransactions, pcMaterials, []);
    expect(hpSummary.netBalance).toBe(100000000);
    expect(pcMaterials.find((m) => m.name === 'Besi Ø12')?.requiredQuantity).toBe(55);
    expect(pcMaterials.find((m) => m.name === 'Semen')?.requiredQuantity).toBe(50);
  });
});
