import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';
import { FinancialTransaction, TransactionType, PaymentStatus } from '../../types';
import { CurrencyInput } from '../shared/CurrencyInput';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultType?: 'income' | 'expense' | 'refund';
  editingTransaction?: FinancialTransaction | null;
  onSave: (data: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
}

const EXPENSE_TYPES: { id: TransactionType; label: string }[] = [
  { id: 'material_payment', label: 'Pembayaran Material' },
  { id: 'delivery', label: 'Ongkos Kirim' },
  { id: 'transport', label: 'Transportasi' },
  { id: 'equipment_rental', label: 'Sewa Alat & Mesin' },
  { id: 'wages', label: 'Upah Tukang & Pekerja' },
  { id: 'unexpected', label: 'Biaya Tidak Terduga' },
  { id: 'other_expense', label: 'Pengeluaran Lainnya' },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  projectId,
  defaultType = 'income',
  editingTransaction,
  onSave,
}) => {
  const [direction, setDirection] = useState<'income' | 'expense' | 'refund'>('income');
  const [expenseType, setExpenseType] = useState<TransactionType>('other_expense');
  const [amount, setAmount] = useState<number>(0);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      if (editingTransaction.type === 'income') {
        setDirection('income');
      } else if (editingTransaction.type === 'refund') {
        setDirection('refund');
      } else {
        setDirection('expense');
        setExpenseType(editingTransaction.type);
      }
      setAmount(editingTransaction.amount);
      setTransactionDate(editingTransaction.transactionDate);
      setDescription(editingTransaction.description);
      setPaymentStatus(editingTransaction.paymentStatus);
    } else {
      setDirection(defaultType);
      setExpenseType('other_expense');
      setAmount(0);
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setPaymentStatus('paid');
    }
  }, [editingTransaction, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Nominal transaksi harus lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      alert('Deskripsi transaksi wajib diisi.');
      return;
    }

    const finalType: TransactionType =
      direction === 'income' ? 'income' : direction === 'refund' ? 'refund' : expenseType;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          projectId,
          type: finalType,
          amount,
          transactionDate,
          description: description.trim(),
          paymentStatus,
        },
        editingTransaction?.id
      );
      onClose();
    } catch (err) {
      console.error('Error saving transaction', err);
      alert('Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">
            {editingTransaction
              ? 'Edit Transaksi Keuangan'
              : direction === 'income'
              ? 'Catat Dana Masuk'
              : direction === 'refund'
              ? 'Catat Refund / Pengembalian'
              : 'Catat Pengeluaran Proyek'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direction Switcher (if creating new) */}
        {!editingTransaction && (
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setDirection('income')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                direction === 'income'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Dana Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('expense')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                direction === 'expense'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('refund')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                direction === 'refund'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refund</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Specific Expense Type selector if direction is expense */}
          {direction === 'expense' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kategori Biaya Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as TransactionType)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {EXPENSE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <CurrencyInput
            label="Nominal Transaksi (Rp)"
            value={amount}
            onChange={(val) => setAmount(val)}
            required
            placeholder="1.000.000"
          />

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tanggal Transaksi <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Keterangan / Uraian <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                direction === 'income'
                  ? 'Contoh: Tambahan modal tabungan bulanan'
                  : 'Contoh: Upah tukang minggu ke-2, ongkir semen'
              }
              required
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Status Pembayaran
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="paid">Lunas / Berhasil</option>
              <option value="pending">Menunggu Konfirmasi</option>
            </select>
          </div>

          {/* Submit */}
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
