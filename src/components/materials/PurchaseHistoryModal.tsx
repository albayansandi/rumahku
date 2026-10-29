import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Receipt, 
  Plus, 
  CreditCard,
  Trash2
} from 'lucide-react';
import { PurchaseWithPayment, MaterialCalculated, FinancialTransaction } from '../../types';
import { formatRupiah, formatQuantity } from '../../lib/calculations/financial';
import { CurrencyInput } from '../shared/CurrencyInput';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialCalculated;
  purchases: PurchaseWithPayment[];
  transactions: FinancialTransaction[];
  onAddPayment: (purchaseId: string, amount: number, description: string) => Promise<void>;
  onDeletePurchase: (purchaseId: string) => Promise<void>;
}

export const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({
  isOpen,
  onClose,
  material,
  purchases,
  transactions,
  onAddPayment,
  onDeletePurchase,
}) => {
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<PurchaseWithPayment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseWithPayment | null>(null);

  if (!isOpen) return null;

  const handleOpenPayment = (purchase: PurchaseWithPayment) => {
    setSelectedPurchaseForPayment(purchase);
    setPaymentAmount(purchase.remainingAmount);
    setPaymentNotes(`Pelunasan pembelian ${material.name}`);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseForPayment) return;
    if (paymentAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0.');
      return;
    }
    if (paymentAmount > selectedPurchaseForPayment.remainingAmount) {
      alert('Nominal pembayaran tidak boleh melebihi sisa tagihan.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await onAddPayment(
        selectedPurchaseForPayment.id,
        paymentAmount,
        paymentNotes || `Pembayaran ${material.name}`
      );
      setSelectedPurchaseForPayment(null);
    } catch (err) {
      console.error('Payment error', err);
      alert('Gagal mencatat pembayaran.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const getStatusBadge = (status: PurchaseWithPayment['paymentStatus']) => {
    switch (status) {
      case 'Lunas':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            Lunas
          </span>
        );
      case 'Dibayar Sebagian':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
            Dibayar Sebagian
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
            Belum Dibayar
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Riwayat Pembelian & Pembayaran</h3>
                <p className="text-xs text-slate-400">{material.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Material Stats Summary */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block">Total Kebutuhan:</span>
              <span className="font-bold text-white font-mono-numbers">
                {formatQuantity(material.requiredQuantity)} {material.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Dibeli:</span>
              <span className="font-bold text-emerald-400 font-mono-numbers">
                {formatQuantity(material.purchasedQuantity)} {material.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Nilai Aktual:</span>
              <span className="font-bold text-cyan-400 font-mono-numbers">
                {formatRupiah(material.actualTotalPurchasedCost)}
              </span>
            </div>
          </div>

          {/* Purchases List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Daftar Faktur Pembelian ({purchases.length})
            </h4>

            {purchases.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-slate-800/30 border border-slate-800/80 text-xs text-slate-400">
                Belum ada transaksi pembelian untuk material ini.
              </div>
            ) : (
              purchases.map((pu, idx) => {
                const relatedPayments = transactions.filter(
                  (t) => t.referenceId === pu.id && t.type === 'material_payment' && !t.deletedAt
                );

                return (
                  <div
                    key={pu.id}
                    className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {formatQuantity(pu.quantity)} {material.unit} @ {formatRupiah(pu.unitPrice)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {pu.supplierName ? `${pu.supplierName} • ` : ''}
                            {new Date(pu.purchaseDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {getStatusBadge(pu.paymentStatus)}
                        <span className="text-xs sm:text-sm font-bold text-white font-mono-numbers">
                          {formatRupiah(pu.totalPrice)}
                        </span>
                        <button
                          onClick={() => setPurchaseToDelete(pu)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition"
                          title="Hapus Pembelian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Payment breakdown */}
                    <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-700/60 text-slate-300">
                      <div>
                        <span>Terbayar: </span>
                        <span className="font-bold text-emerald-400 font-mono-numbers">
                          {formatRupiah(pu.paidAmount)}
                        </span>
                      </div>
                      <div>
                        <span>Sisa Tagihan: </span>
                        <span className={`font-bold font-mono-numbers ${pu.remainingAmount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {formatRupiah(pu.remainingAmount)}
                        </span>
                      </div>
                      {pu.remainingAmount > 0 && (
                        <button
                          onClick={() => handleOpenPayment(pu)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition active:scale-95"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Bayar Sisa Tagihan</span>
                        </button>
                      )}
                    </div>

                    {/* Related payments history */}
                    {relatedPayments.length > 0 && (
                      <div className="pt-2 border-t border-slate-700/40 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Rincian Pembayaran Masuk:
                        </span>
                        {relatedPayments.map((pTx) => (
                          <div
                            key={pTx.id}
                            className="flex justify-between text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg"
                          >
                            <span>
                              {pTx.description} (
                              {new Date(pTx.transactionDate).toLocaleDateString('id-ID')})
                            </span>
                            <span className="font-bold text-emerald-400 font-mono-numbers">
                              {formatRupiah(pTx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pay remaining balance modal */}
      {selectedPurchaseForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Bayar Tagihan Pembelian</h3>
              <button
                onClick={() => setSelectedPurchaseForPayment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-800/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Total Faktur:</span>
                  <span className="font-bold text-white font-mono-numbers">
                    {formatRupiah(selectedPurchaseForPayment.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sudah Dibayar:</span>
                  <span className="font-bold text-emerald-400 font-mono-numbers">
                    {formatRupiah(selectedPurchaseForPayment.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-300 font-semibold pt-1 border-t border-slate-700">
                  <span>Sisa Tagihan:</span>
                  <span className="font-bold font-mono-numbers">
                    {formatRupiah(selectedPurchaseForPayment.remainingAmount)}
                  </span>
                </div>
              </div>

              <CurrencyInput
                label="Nominal Pembayaran Sekarang"
                value={paymentAmount}
                onChange={(val) => setPaymentAmount(val)}
                required
              />

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Keterangan Pembayaran
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPurchaseForPayment(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg"
                >
                  {isSubmittingPayment ? 'Memproses...' : 'Konfirmasi Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete purchase confirm */}
      <ConfirmDialog
        isOpen={!!purchaseToDelete}
        title="Hapus Transaksi Pembelian"
        message="Menghapus pembelian ini akan mengembalikan sisa kebutuhan material dan membatalkan tagihan terkait. Lanjutkan?"
        confirmLabel="Hapus Pembelian"
        onConfirm={async () => {
          if (purchaseToDelete) {
            await onDeletePurchase(purchaseToDelete.id);
            setPurchaseToDelete(null);
          }
        }}
        onCancel={() => setPurchaseToDelete(null)}
      />
    </>
  );
};
