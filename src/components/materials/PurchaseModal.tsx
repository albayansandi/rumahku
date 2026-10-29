import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Receipt, AlertCircle, Camera } from 'lucide-react';
import { MaterialCalculated } from '../../types';
import { CurrencyInput } from '../shared/CurrencyInput';
import { formatRupiah, formatQuantity } from '../../lib/calculations/financial';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialCalculated | null;
  projectId: string;
  onRecordPurchase: (data: {
    materialId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    supplierName?: string;
    purchaseDate: string;
    notes?: string;
    paymentOption: 'unpaid' | 'partial' | 'full';
    initialPaymentAmount: number;
    receiptBlob?: string;
  }) => Promise<void>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  material,
  projectId,
  onRecordPurchase,
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentOption, setPaymentOption] = useState<'unpaid' | 'partial' | 'full'>('full');
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<number>(0);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (material) {
      // Suggest remaining quantity or at least 1
      const suggestedQty = material.remainingQuantity > 0 ? material.remainingQuantity : 1;
      setQuantity(suggestedQty);
      setUnitPrice(material.estimatedUnitPrice);
      setSupplierName('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPaymentOption('full');
      setReceiptImage(null);
    }
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const totalPrice = Math.round((Number(quantity) || 0) * (Number(unitPrice) || 0));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('Jumlah pembelian harus lebih dari 0.');
      return;
    }
    if (unitPrice < 0) {
      alert('Harga satuan aktual tidak boleh negatif.');
      return;
    }

    let initialPaymentAmount = 0;
    if (paymentOption === 'full') {
      initialPaymentAmount = totalPrice;
    } else if (paymentOption === 'partial') {
      if (partialPaymentAmount <= 0) {
        alert('Nominal uang muka / pembayaran sebagian harus lebih dari 0.');
        return;
      }
      if (partialPaymentAmount > totalPrice) {
        alert('Nominal pembayaran tidak boleh melebihi total harga pembelian.');
        return;
      }
      initialPaymentAmount = partialPaymentAmount;
    }

    setIsSubmitting(true);
    try {
      await onRecordPurchase({
        materialId: material.id,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        totalPrice,
        supplierName: supplierName.trim() || undefined,
        purchaseDate,
        notes: notes.trim() || undefined,
        paymentOption,
        initialPaymentAmount,
        receiptBlob: receiptImage || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error recording purchase', err);
      alert('Gagal mencatat pembelian material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Catat Pembelian Material</h3>
              <p className="text-xs text-slate-400">{material.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Material Status Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Kebutuhan Proyek:</span>
            <span className="font-bold text-white font-mono-numbers">
              {formatQuantity(material.requiredQuantity)} {material.unit}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Sudah Dibeli:</span>
            <span className="font-bold text-emerald-400 font-mono-numbers">
              {formatQuantity(material.purchasedQuantity)} {material.unit}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Sisa Kebutuhan:</span>
            <span className="font-bold text-cyan-400 font-mono-numbers">
              {formatQuantity(material.remainingQuantity)} {material.unit}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Jumlah Pembelian & Harga Aktual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kuantitas Beli ({material.unit}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <CurrencyInput
                label="Harga Satuan Aktual"
                value={unitPrice}
                onChange={(val) => setUnitPrice(val)}
                required
              />
            </div>
          </div>

          {/* Real-time Total Price Calculation */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Nilai Pembelian:</span>
            <span className="text-base sm:text-lg font-black text-white font-mono-numbers">
              {formatRupiah(totalPrice)}
            </span>
          </div>

          {/* Nama Toko & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nama Toko / Supplier
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Contoh: Toko Bangunan Jaya"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tanggal Pembelian <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Status & Opsi Pembayaran (Section 9 Requirement) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-200 block">
              Status Pembayaran Tagihan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentOption('full')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                  paymentOption === 'full'
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Bayar Lunas
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentOption('partial');
                  if (!partialPaymentAmount) {
                    setPartialPaymentAmount(Math.round(totalPrice / 2));
                  }
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                  paymentOption === 'partial'
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Bayar Sebagian
              </button>
              <button
                type="button"
                onClick={() => setPaymentOption('unpaid')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                  paymentOption === 'unpaid'
                    ? 'bg-rose-600/20 text-rose-300 border-rose-500 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Belum Dibayar
              </button>
            </div>

            {/* Explanation box based on payment option */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                {paymentOption === 'full' && (
                  <span>
                    Saldo kas akan langsung berkurang sebesar{' '}
                    <strong className="text-white font-mono-numbers">{formatRupiah(totalPrice)}</strong>.
                  </span>
                )}
                {paymentOption === 'partial' && (
                  <span>
                    Saldo kas hanya berkurang sebesar pembayaran aktual (DP). Sisanya dicatat sebagai tagihan terutang.
                  </span>
                )}
                {paymentOption === 'unpaid' && (
                  <span className="text-amber-300">
                    Material tercatat diterima, namun saldo kas <strong>TIDAK</strong> berkurang sampai pembayaran dilakukan.
                  </span>
                )}
              </div>
            </div>

            {/* Partial Payment Amount Input */}
            {paymentOption === 'partial' && (
              <div className="mt-2 space-y-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <CurrencyInput
                  label="Nominal Dibayar Sekarang (Uang Muka / DP)"
                  value={partialPaymentAmount}
                  onChange={(val) => setPartialPaymentAmount(val)}
                  required
                />
                <div className="flex justify-between text-xs text-amber-200/90 pt-1">
                  <span>Sisa Tagihan Nanti:</span>
                  <span className="font-bold font-mono-numbers">
                    {formatRupiah(Math.max(0, totalPrice - partialPaymentAmount))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Foto Nota / Kwitansi (Opsional) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              Foto Nota / Kwitansi (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 cursor-pointer transition">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{receiptImage ? 'Ganti Foto Nota' : 'Unggah Foto Nota'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {receiptImage && (
                <div className="flex items-center gap-2">
                  <img
                    src={receiptImage}
                    alt="Nota Preview"
                    className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Keterangan Pembelian
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: Pembelian tahap 1, pengiriman gratis oleh toko"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg transition active:scale-95"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
