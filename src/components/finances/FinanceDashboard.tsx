import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Edit3, 
  Trash2, 
  FileText,
  CreditCard,
  Building
} from 'lucide-react';
import { FinancialTransaction, TransactionType, ProjectFinancialSummary } from '../../types';
import { formatRupiah } from '../../lib/calculations/financial';
import { TransactionModal } from './TransactionModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface FinanceDashboardProps {
  transactions: FinancialTransaction[];
  summary: ProjectFinancialSummary;
  projectId: string;
  onSaveTransaction: (data: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  transactions,
  summary,
  projectId,
  onSaveTransaction,
  onDeleteTransaction,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'refund'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<{ isOpen: boolean; defaultType: 'income' | 'expense' | 'refund' }>({
    isOpen: false,
    defaultType: 'income',
  });
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<FinancialTransaction | null>(null);

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

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => !t.deletedAt)
      .filter((t) => {
        if (activeFilter === 'income') return t.type === 'income';
        if (activeFilter === 'refund') return t.type === 'refund';
        if (activeFilter === 'expense') return t.type !== 'income' && t.type !== 'refund';
        return true;
      })
      .filter((t) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          getTransactionTypeLabel(t.type).toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [transactions, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>Manajemen Keuangan & Saldo Kas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pencatatan mutasi kas, dana masuk, pembayaran material, serta upah pekerja secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalMode({ isOpen: true, defaultType: 'income' })}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Dana Masuk</span>
          </button>

          <button
            onClick={() => setModalMode({ isOpen: true, defaultType: 'expense' })}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Financial Health Mini Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Sisa Saldo Kas Riil
          </span>
          <div className={`text-2xl font-black font-mono-numbers mt-1 ${summary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(summary.netBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Total Dana Masuk − Total Pengeluaran Sah
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Dana Masuk
          </span>
          <div className="text-2xl font-black text-white font-mono-numbers mt-1">
            {formatRupiah(summary.totalIncome)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Saldo awal, tabungan & suntikan dana
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Pengeluaran Kas
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono-numbers mt-1">
            {formatRupiah(summary.totalExpense)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pembayaran material & operasional proyek
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari uraian transaksi keuangan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Semua ({transactions.filter((t) => !t.deletedAt).length})
          </button>
          <button
            onClick={() => setActiveFilter('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'income'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Dana Masuk
          </button>
          <button
            onClick={() => setActiveFilter('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'expense'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveFilter('refund')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'refund'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Refund
          </button>
        </div>
      </div>

      {/* Transactions List Table / Card View */}
      {filteredTransactions.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak Ada Transaksi</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Tidak ada transaksi yang cocok dengan kata kunci pencarian.'
              : 'Belum ada catatan keuangan pada kategori ini.'}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800/70">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income' || tx.type === 'refund';

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.type === 'refund'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : tx.type === 'refund' ? (
                        <RotateCcw className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                        {tx.description}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">
                          {getTransactionTypeLabel(tx.type)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {tx.referenceId && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">Terkait Pembelian Material</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="sm:text-right">
                      <div
                        className={`text-base font-black font-mono-numbers ${
                          isIncome ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isIncome ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {tx.paymentStatus === 'paid' ? 'Lunas / Berhasil' : 'Tertunda'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTx(tx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Transaksi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={modalMode.isOpen || !!editingTx}
        onClose={() => {
          setModalMode({ isOpen: false, defaultType: 'income' });
          setEditingTx(null);
        }}
        projectId={projectId}
        defaultType={modalMode.defaultType}
        editingTransaction={editingTx}
        onSave={onSaveTransaction}
      />

      {/* Delete Transaction Confirm */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        title="Hapus Transaksi Keuangan"
        message={`Apakah Anda yakin ingin membatalkan transaksi "${txToDelete?.description}" sebesar ${formatRupiah(
          txToDelete?.amount || 0
        )}? Saldo kas akan dihitung ulang secara otomatis.`}
        confirmLabel="Hapus Transaksi"
        onConfirm={async () => {
          if (txToDelete) {
            await onDeleteTransaction(txToDelete.id);
            setTxToDelete(null);
          }
        }}
        onCancel={() => setTxToDelete(null)}
      />
    </div>
  );
};
