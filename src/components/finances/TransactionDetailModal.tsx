import React from 'react';
import { X, Calendar, CreditCard, FileText, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';
import { FinancialTransaction, TransactionType } from '../../types';
import { formatRupiah } from '../../lib/calculations/financial';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinancialTransaction | null;
  onEdit?: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onEdit,
}) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income' || transaction.type === 'refund';

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return 'Dana Masuk';
      case 'material_payment':
        return 'Pembayaran Material';
      case 'delivery':
        return 'Ongkos Kirim';
      case 'transport':
        return 'Transportasi';
      case 'equipment_rental':
        return 'Sewa Alat';
      case 'wages':
        return 'Upah Tukang';
      case 'unexpected':
        return 'Biaya Tak Terduga';
      case 'refund':
        return 'Pengembalian Dana (Refund)';
      default:
        return 'Pengeluaran Lainnya';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Rincian Transaksi</h3>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center py-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {getTransactionTypeLabel(transaction.type)}
          </div>
          <div
            className={`text-2xl font-black font-mono-numbers mt-1 ${
              isIncome ? 'text-emerald-400' : 'text-slate-100'
            }`}
          >
            {isIncome ? `+${formatRupiah(transaction.amount)}` : `-${formatRupiah(transaction.amount)}`}
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2 bg-slate-800 text-emerald-400 border border-emerald-500/30">
            {transaction.paymentStatus === 'paid' ? 'Lunas / Berhasil' : 'Menunggu'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block text-[10px]">Uraian:</span>
            <span className="font-semibold text-white">{transaction.description}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700/60 pt-2">
            <span className="text-slate-400">Tanggal:</span>
            <span className="font-medium text-white">
              {new Date(transaction.transactionDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-700/60 pt-2">
            <span className="text-slate-400">ID Referensi:</span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
              {transaction.id}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
