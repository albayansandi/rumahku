import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Calculator, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  Info
} from 'lucide-react';
import { ProjectFinancialSummary } from '../../types';
import { formatRupiah } from '../../lib/calculations/financial';

interface FinancialCardsProps {
  summary: ProjectFinancialSummary;
  onOpenAddIncome?: () => void;
  onOpenAddExpense?: () => void;
}

export const FinancialCards: React.FC<FinancialCardsProps> = ({
  summary,
  onOpenAddIncome,
  onOpenAddExpense,
}) => {
  const {
    totalIncome,
    totalExpense,
    netBalance,
    estimatedRemainingCost,
    budgetStatus,
    balanceDifference,
  } = summary;

  const getIndicatorStyles = () => {
    switch (budgetStatus) {
      case 'Aman':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          title: 'Status Anggaran: Aman',
          desc: 'Sisa saldo kas saat ini mencukupi seluruh estimasi kebutuhan pembangunan tersisa.',
        };
      case 'Terbatas':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          title: 'Status Anggaran: Terbatas',
          desc: 'Saldo kas mencukupi sementara, namun diperlukan tambahan dana untuk menuntaskan sisa kebutuhan.',
        };
      case 'Kurang':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
          title: 'Status Anggaran: Kurang / Defisit',
          desc: 'Saldo kas saat ini defisit atau tidak mencukupi tagihan berjalan. Segera lakukan penambahan dana.',
        };
    }
  };

  const indicator = getIndicatorStyles();

  // Percentage of funds used
  const percentUsed = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* 4 Financial Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. Total Dana */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Total Dana
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono-numbers tracking-tight">
              {formatRupiah(totalIncome)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Akumulasi dana masuk & modal sah
            </p>
          </div>
          {onOpenAddIncome && (
            <button
              onClick={onOpenAddIncome}
              className="mt-3.5 w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-[11px] font-semibold text-emerald-400 border border-slate-700/60 transition"
            >
              + Tambah Dana Masuk
            </button>
          )}
        </div>

        {/* 2. Total Pengeluaran */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Total Pengeluaran
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono-numbers tracking-tight">
              {formatRupiah(totalExpense)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Pembayaran bersih material & biaya
            </p>
          </div>
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="mt-3.5 w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-[11px] font-semibold text-rose-400 border border-slate-700/60 transition"
            >
              + Catat Pengeluaran
            </button>
          )}
        </div>

        {/* 3. Sisa Saldo */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Sisa Saldo Kas
            </span>
            <div className={`p-2 rounded-xl border ${netBalance >= 0 ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-black font-mono-numbers tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatRupiah(netBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {netBalance >= 0 ? 'Total Dana − Total Pengeluaran' : 'Kas Defisit (Perlu Penambahan)'}
            </p>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            <span>Terpakai:</span>
            <span className="font-bold text-white font-mono-numbers">{percentUsed}%</span>
          </div>
        </div>

        {/* 4. Estimasi Sisa Kebutuhan */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Estimasi Sisa Kebutuhan
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono-numbers tracking-tight">
              {formatRupiah(estimatedRemainingCost)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sisa tagihan + sisa material terencana
            </p>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            <span>Status Pembelian:</span>
            <span className="font-bold text-slate-200">
              {summary.totalUnpaidPurchases > 0 ? 'Ada Tagihan Belum Lunas' : 'Belum Ada Tagihan'}
            </span>
          </div>
        </div>

      </div>

      {/* Indikator Anggaran Bar (Section 5.5) */}
      <div className={`rounded-3xl border p-5 sm:p-6 shadow-xl transition-all ${indicator.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/50 shadow-md shrink-0">
              {indicator.icon}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-extrabold text-white">
                  {indicator.title}
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${indicator.badge}`}>
                  {budgetStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {indicator.desc}
              </p>
            </div>
          </div>

          <div className="sm:text-right shrink-0 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Selisih Dana (Saldo − Kebutuhan)
            </span>
            <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
              {balanceDifference >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className={`text-lg sm:text-xl font-extrabold font-mono-numbers ${balanceDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatRupiah(balanceDifference)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {balanceDifference >= 0 ? 'Surplus Anggaran Tersedia' : 'Defisit Anggaran'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
