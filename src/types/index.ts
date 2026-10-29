export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  length: number; // meters
  width: number;  // meters
  location?: string;
  startDate: string; // ISO 8601
  status: ProjectStatus;
  mainImageId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProjectImage {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataUrl: string; // Base64 data URL for instant offline storage and display
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface MaterialCategory {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type StandardUnit = 
  | 'Batang'
  | 'Sak'
  | 'Kubik'
  | 'Meter'
  | 'Meter persegi'
  | 'Kilogram'
  | 'Liter'
  | 'Pcs'
  | 'Dus'
  | 'Lembar'
  | 'Roll'
  | 'Unit'
  | string;

export interface Material {
  id: string;
  projectId: string;
  categoryId: string;
  name: string;
  brand?: string;
  specification?: string;
  requiredQuantity: number;
  unit: StandardUnit;
  estimatedUnitPrice: number; // in whole Rupiah
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Purchase {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  unitPrice: number; // actual unit price in Rupiah
  totalPrice: number; // quantity * unitPrice
  supplierName?: string;
  purchaseDate: string; // ISO 8601
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type TransactionType = 
  | 'income'             // Dana Masuk: Saldo Awal, Tambahan Tabungan, Modal, dll.
  | 'material_payment'   // Pembayaran Pembelian Material
  | 'delivery'           // Ongkos Kirim
  | 'transport'          // Transportasi
  | 'equipment_rental'   // Sewa Alat
  | 'wages'              // Upah Tukang / Pekerja
  | 'unexpected'         // Biaya Tidak Terduga
  | 'other_expense'      // Pengeluaran Lainnya
  | 'refund';            // Pengembalian Dana

export type PaymentStatus = 'paid' | 'pending' | 'cancelled';

export interface FinancialTransaction {
  id: string;
  projectId: string;
  type: TransactionType;
  referenceId?: string; // purchaseId for material_payment, or original transaction ID for refund
  amount: number; // integer Rupiah
  transactionDate: string;
  description: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Attachment {
  id: string;
  projectId: string;
  transactionId?: string;
  purchaseId?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AppSetting {
  id: string;
  key: string;
  value: any;
  updatedAt: string;
}

export interface SyncMetadata {
  id: string;
  entityType: string;
  entityId: string;
  revision: number;
  syncStatus: 'synced' | 'pending' | 'syncing' | 'failed' | 'conflict';
  lastSyncedAt?: string;
  updatedAt: string;
}

export interface SyncOperation {
  id: string;
  entityType: string;
  entityId: string;
  operationType: 'create' | 'update' | 'delete';
  payload: any;
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

// Material with live calculated financial & stock properties
export interface MaterialCalculated extends Material {
  purchasedQuantity: number;
  remainingQuantity: number;
  estimatedTotalCost: number;
  estimatedRemainingCost: number;
  actualTotalPurchasedCost: number;
  status: 'Belum Dibeli' | 'Dibeli Sebagian' | 'Sudah Dibeli';
  isOverPurchased: boolean;
  overPurchasedQuantity: number;
}

// Purchase with calculated payment status
export interface PurchaseWithPayment extends Purchase {
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'Belum Dibayar' | 'Dibayar Sebagian' | 'Lunas';
}

// Project financial summary
export interface ProjectFinancialSummary {
  totalIncome: number;          // Total Dana Masuk sah
  totalExpense: number;         // Total Pembayaran Bersih (material + opsional)
  netBalance: number;           // Total Dana - Total Pengeluaran
  estimatedRemainingCost: number; // Sisa tagihan pembelian + estimasi material belum dibeli
  budgetStatus: 'Aman' | 'Terbatas' | 'Kurang';
  balanceDifference: number;    // netBalance - estimatedRemainingCost
  totalEstimatedProjectCost: number; // Total nilai estimasi proyek dari seluruh material + pengeluaran
  totalPaidPurchases: number;
  totalUnpaidPurchases: number;
}
