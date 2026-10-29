import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Filter, 
  PieChart, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  FinancialTransaction, 
  MaterialCalculated, 
  MaterialCategory, 
  Project, 
  ProjectFinancialSummary 
} from '../../types';
import { formatRupiah, formatQuantity } from '../../lib/calculations/financial';

interface ReportsPageProps {
  currentProject: Project | null;
  summary: ProjectFinancialSummary;
  materials: MaterialCalculated[];
  categories: MaterialCategory[];
  transactions: FinancialTransaction[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  currentProject,
  summary,
  materials,
  categories,
  transactions,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_month'>('all');

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  // Category breakdown calculation
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; estimated: number; actual: number; itemCount: number }>();

    for (const cat of categories) {
      map.set(cat.id, { name: cat.name, estimated: 0, actual: 0, itemCount: 0 });
    }

    for (const m of materials) {
      const entry = map.get(m.categoryId) || {
        name: 'Lainnya',
        estimated: 0,
        actual: 0,
        itemCount: 0,
      };
      entry.estimated += m.estimatedTotalCost;
      entry.actual += m.actualTotalPurchasedCost;
      entry.itemCount += 1;
      map.set(m.categoryId, entry);
    }

    return Array.from(map.values()).filter((e) => e.itemCount > 0);
  }, [categories, materials]);

  // Unpurchased materials
  const unpurchasedMaterials = useMemo(() => {
    return materials.filter((m) => m.status === 'Belum Dibeli' || m.remainingQuantity > 0);
  }, [materials]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['LAPORAN KEUANGAN & ANGGARAN PROYEK RUMAHKU'],
      ['Nama Proyek', currentProject?.name || 'Proyek Rumah'],
      ['Tanggal Laporan', new Date().toLocaleDateString('id-ID')],
      [],
      ['RINGKASAN KEUANGAN'],
      ['Total Dana Masuk', summary.totalIncome],
      ['Total Pengeluaran Kas', summary.totalExpense],
      ['Sisa Saldo Kas', summary.netBalance],
      ['Estimasi Sisa Kebutuhan', summary.estimatedRemainingCost],
      ['Status Anggaran', summary.budgetStatus],
      ['Selisih Dana', summary.balanceDifference],
      [],
      ['RINCIAN MATERIAL'],
      ['Nama Material', 'Kategori', 'Kebutuhan', 'Satuan', 'Estimasi Satuan', 'Total Estimasi', 'Dibeli', 'Sisa', 'Nilai Beli Aktual', 'Status'],
      ...materials.map((m) => [
        `"${m.name}"`,
        `"${categoryMap.get(m.categoryId) || ''}"`,
        m.requiredQuantity,
        m.unit,
        m.estimatedUnitPrice,
        m.estimatedTotalCost,
        m.purchasedQuantity,
        m.remainingQuantity,
        m.actualTotalPurchasedCost,
        m.status,
      ]),
      [],
      ['RIWAYAT TRANSAKSI KAS'],
      ['Tanggal', 'Jenis', 'Keterangan', 'Nominal (Rp)', 'Status'],
      ...transactions
        .filter((t) => !t.deletedAt)
        .map((t) => [
          t.transactionDate,
          t.type,
          `"${t.description}"`,
          t.amount,
          t.paymentStatus,
        ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan-Rumahku-${currentProject?.name.replace(/\s+/g, '-') || 'Proyek'}-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 print:text-black print:bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            <span>Laporan & Analisis Proyek</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Transparansi alokasi dana, realisasi pembelian per kategori, dan sisa belanja terencana.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Financial Health Indicators (Section 14) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Dana Masuk
          </span>
          <div className="text-xl font-black text-white font-mono-numbers mt-1">
            {formatRupiah(summary.totalIncome)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Pembayaran Bersih
          </span>
          <div className="text-xl font-black text-rose-400 font-mono-numbers mt-1">
            {formatRupiah(summary.totalExpense)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Sisa Saldo Kas
          </span>
          <div className={`text-xl font-black font-mono-numbers mt-1 ${summary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(summary.netBalance)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Kebutuhan Belum Dibeli
          </span>
          <div className="text-xl font-black text-amber-400 font-mono-numbers mt-1">
            {formatRupiah(summary.estimatedRemainingCost)}
          </div>
        </div>
      </div>

      {/* Category Cost Breakdown Chart */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-400" />
          <span>Pengeluaran & Anggaran Berdasarkan Kategori</span>
        </h3>

        <div className="space-y-3.5">
          {categoryBreakdown.map((cat, idx) => {
            const percentRealized =
              cat.estimated > 0 ? Math.min(100, Math.round((cat.actual / cat.estimated) * 100)) : 0;

            return (
              <div key={idx} className="space-y-1.5 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({cat.itemCount} material)
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-300 font-mono-numbers">
                    <span>
                      Realisasi:{' '}
                      <strong className="text-emerald-400">{formatRupiah(cat.actual)}</strong>
                    </span>
                    <span>/</span>
                    <span>
                      Estimasi: <strong className="text-slate-100">{formatRupiah(cat.estimated)}</strong>
                    </span>
                    <span className="text-xs font-bold text-cyan-400">
                      {percentRealized}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentRealized}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unpurchased Materials Watchlist */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>Material yang Belum Selesai Dibeli ({unpurchasedMaterials.length})</span>
          </h3>
        </div>

        {unpurchasedMaterials.length === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-400 flex items-center justify-center gap-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Seluruh material kebutuhan proyek sudah selesai dibeli!</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {unpurchasedMaterials.map((m) => (
              <div
                key={m.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div>
                  <div className="font-bold text-white">{m.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Kategori: {categoryMap.get(m.categoryId)} • Kebutuhan:{' '}
                    {formatQuantity(m.requiredQuantity)} {m.unit}
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="font-bold text-amber-400 font-mono-numbers">
                    Sisa: {formatQuantity(m.remainingQuantity)} {m.unit}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono-numbers">
                    Est. Biaya: {formatRupiah(m.estimatedRemainingCost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
