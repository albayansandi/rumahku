import { 
  FinancialTransaction, 
  Material, 
  MaterialCalculated, 
  Purchase, 
  PurchaseWithPayment, 
  ProjectFinancialSummary 
} from '../../types';

/**
 * Format integer Rupiah according to Indonesian standards: Rp1.500.000
 * No space after Rp or clean format with proper negative handling.
 */
export function formatRupiah(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = absVal.toLocaleString('id-ID');
  return isNegative ? `-Rp${formatted}` : `Rp${formatted}`;
}

/**
 * Parse Rupiah string or digits into clean integer
 */
export function parseRupiahInput(val: string | number): number {
  if (typeof val === 'number') return Math.round(val);
  const digits = val.replace(/[^0-9-]/g, '');
  if (!digits || digits === '-') return 0;
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Format quantity with decimal safety (e.g. 10 or 10.5)
 */
export function formatQuantity(qty: number): string {
  const rounded = Math.round(qty * 100) / 100;
  return rounded.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

/**
 * Calculate material status, purchased qty, remaining qty, and estimated costs
 */
export function calculateMaterialMetrics(
  material: Material,
  allPurchases: Purchase[]
): MaterialCalculated {
  const activePurchases = allPurchases.filter(
    (p) => p.materialId === material.id && !p.deletedAt
  );

  const purchasedQuantity = activePurchases.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  const requiredQuantity = Number(material.requiredQuantity) || 0;
  const estimatedUnitPrice = Math.round(Number(material.estimatedUnitPrice) || 0);

  const estimatedTotalCost = Math.round(requiredQuantity * estimatedUnitPrice);
  const remainingQuantity = Math.max(0, requiredQuantity - purchasedQuantity);
  const estimatedRemainingCost = Math.round(remainingQuantity * estimatedUnitPrice);

  const actualTotalPurchasedCost = activePurchases.reduce(
    (acc, p) => acc + (Number(p.totalPrice) || 0),
    0
  );

  let status: 'Belum Dibeli' | 'Dibeli Sebagian' | 'Sudah Dibeli' = 'Belum Dibeli';
  if (purchasedQuantity === 0) {
    status = 'Belum Dibeli';
  } else if (purchasedQuantity < requiredQuantity) {
    status = 'Dibeli Sebagian';
  } else {
    status = 'Sudah Dibeli';
  }

  const isOverPurchased = purchasedQuantity > requiredQuantity;
  const overPurchasedQuantity = isOverPurchased ? purchasedQuantity - requiredQuantity : 0;

  return {
    ...material,
    purchasedQuantity,
    remainingQuantity,
    estimatedTotalCost,
    estimatedRemainingCost,
    actualTotalPurchasedCost,
    status,
    isOverPurchased,
    overPurchasedQuantity,
  };
}

/**
 * Calculate purchase payment status and paid/remaining amounts
 */
export function calculatePurchasePayment(
  purchase: Purchase,
  allTransactions: FinancialTransaction[]
): PurchaseWithPayment {
  const payments = allTransactions.filter(
    (t) =>
      t.referenceId === purchase.id &&
      t.type === 'material_payment' &&
      t.paymentStatus === 'paid' &&
      !t.deletedAt
  );

  const paidAmount = payments.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalPrice = Math.round(Number(purchase.totalPrice) || 0);
  const remainingAmount = Math.max(0, totalPrice - paidAmount);

  let paymentStatus: 'Belum Dibayar' | 'Dibayar Sebagian' | 'Lunas' = 'Belum Dibayar';
  if (paidAmount === 0) {
    paymentStatus = 'Belum Dibayar';
  } else if (paidAmount < totalPrice) {
    paymentStatus = 'Dibayar Sebagian';
  } else {
    paymentStatus = 'Lunas';
  }

  return {
    ...purchase,
    paidAmount,
    remainingAmount,
    paymentStatus,
  };
}

/**
 * Calculate total project financial summary:
 * Saldo = Total Dana Masuk + Total Refund - Total Pengeluaran Sah
 */
export function calculateProjectFinancialSummary(
  transactions: FinancialTransaction[],
  materials: Material[],
  purchases: Purchase[]
): ProjectFinancialSummary {
  const activeTx = transactions.filter((t) => !t.deletedAt && t.paymentStatus === 'paid');

  let totalIncome = 0;
  let totalRefund = 0;
  let totalExpense = 0;

  for (const tx of activeTx) {
    const amt = Math.round(Number(tx.amount) || 0);
    if (tx.type === 'income') {
      totalIncome += amt;
    } else if (tx.type === 'refund') {
      totalRefund += amt;
    } else {
      totalExpense += amt;
    }
  }

  const netBalance = totalIncome + totalRefund - totalExpense;

  // Purchases payments
  const purchasesWithPayment = purchases
    .filter((p) => !p.deletedAt)
    .map((p) => calculatePurchasePayment(p, activeTx));

  const totalPaidPurchases = purchasesWithPayment.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalUnpaidPurchases = purchasesWithPayment.reduce((sum, p) => sum + p.remainingAmount, 0);

  // Materials remaining estimated needs
  const calculatedMaterials = materials
    .filter((m) => !m.deletedAt)
    .map((m) => calculateMaterialMetrics(m, purchases));

  const unpurchasedMaterialsEstimate = calculatedMaterials.reduce(
    (sum, m) => sum + m.estimatedRemainingCost,
    0
  );

  // Sisa Kebutuhan Biaya Proyek = Sisa tagihan pembelian belum lunas + estimasi sisa material belum dibeli
  const estimatedRemainingCost = totalUnpaidPurchases + unpurchasedMaterialsEstimate;

  const balanceDifference = netBalance - estimatedRemainingCost;

  let budgetStatus: 'Aman' | 'Terbatas' | 'Kurang' = 'Aman';
  if (netBalance < 0 || (netBalance === 0 && estimatedRemainingCost > 0)) {
    budgetStatus = 'Kurang';
  } else if (balanceDifference >= 0) {
    budgetStatus = 'Aman';
  } else {
    budgetStatus = 'Terbatas';
  }

  const totalEstimatedProjectCost =
    calculatedMaterials.reduce((sum, m) => sum + m.estimatedTotalCost, 0) +
    activeTx
      .filter((t) => t.type !== 'income' && t.type !== 'refund' && t.type !== 'material_payment')
      .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpense,
    netBalance,
    estimatedRemainingCost,
    budgetStatus,
    balanceDifference,
    totalEstimatedProjectCost,
    totalPaidPurchases,
    totalUnpaidPurchases,
  };
}
