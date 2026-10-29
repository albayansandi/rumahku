import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  ChevronRight, 
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import { FinancialTransaction, TransactionType } from '../../types';
import { formatRupiah } from '../../lib/calculations/financial';

interface RecentActivityProps {
  transactions: FinancialTransaction[];
  onViewAll: () => void;
  onSelectTransaction: (tx: FinancialTransaction) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  onViewAll,
  onSelectTransaction,
}) => {
  const activeTx = [...transactions]
    .filter((t) => !t.deletedAt)
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime() ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

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
        return 'Pengeluaran Lain';
    }
  };

  const getIcon = (type: TransactionType) => {
    if (type === 'income') {
      return (
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ArrowDownLeft className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'refund') {
      return (
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <RotateCcw className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Aktivitas Keuangan Terbaru</h3>
            <p className="text-[11px] text-slate-400">5 transaksi mutasi dana terakhir</p>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeTx.length === 0 ? (
        <div className="py-8 text-center rounded-2xl bg-slate-800/30 border border-slate-800/80">
          <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Belum ada transaksi pada proyek ini.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {activeTx.map((tx) => {
            const isIncome = tx.type === 'income' || tx.type === 'refund';
            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getIcon(tx.type)}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
                      {tx.description || getTransactionTypeLabel(tx.type)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>
                        {new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="text-slate-300">{getTransactionTypeLabel(tx.type)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-bold font-mono-numbers block ${
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isIncome ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {tx.paymentStatus === 'paid' ? 'Sukses' : 'Menunggu'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
