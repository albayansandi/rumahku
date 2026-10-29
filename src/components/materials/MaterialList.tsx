import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  ShoppingBag, 
  History, 
  Edit3, 
  Trash2, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { MaterialCalculated, MaterialCategory, Material, PurchaseWithPayment, FinancialTransaction } from '../../types';
import { formatRupiah, formatQuantity } from '../../lib/calculations/financial';
import { MaterialModal } from './MaterialModal';
import { PurchaseModal } from './PurchaseModal';
import { PurchaseHistoryModal } from './PurchaseHistoryModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface MaterialListProps {
  materials: MaterialCalculated[];
  categories: MaterialCategory[];
  projectId: string;
  purchases: PurchaseWithPayment[];
  transactions: FinancialTransaction[];
  onSaveMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onRecordPurchase: (data: any) => Promise<void>;
  onAddPayment: (purchaseId: string, amount: number, description: string) => Promise<void>;
  onDeletePurchase: (purchaseId: string) => Promise<void>;
  onAddCategory: (name: string) => Promise<MaterialCategory>;
  onOpenCalculator: () => void;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  categories,
  projectId,
  purchases,
  transactions,
  onSaveMaterial,
  onDeleteMaterial,
  onRecordPurchase,
  onAddPayment,
  onDeletePurchase,
  onAddCategory,
  onOpenCalculator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialCalculated | null>(null);
  const [purchasingMaterial, setPurchasingMaterial] = useState<MaterialCalculated | null>(null);
  const [historyMaterial, setHistoryMaterial] = useState<MaterialCalculated | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialCalculated | null>(null);

  // Category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.brand && m.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.specification && m.specification.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || m.categoryId === selectedCategory;
      const matchStatus = selectedStatus === 'all' || m.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [materials, searchQuery, selectedCategory, selectedStatus]);

  // Overall totals
  const totalEstimatedCost = materials.reduce((sum, m) => sum + m.estimatedTotalCost, 0);
  const totalActualPurchasedCost = materials.reduce((sum, m) => sum + m.actualTotalPurchasedCost, 0);
  const unpurchasedCount = materials.filter((m) => m.status === 'Belum Dibeli').length;

  const getStatusBadge = (status: MaterialCalculated['status'], isOverPurchased: boolean) => {
    if (isOverPurchased) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
          <Sparkles className="w-3 h-3" />
          <span>Kelebihan Beli</span>
        </span>
      );
    }
    switch (status) {
      case 'Sudah Dibeli':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Sudah Dibeli</span>
          </span>
        );
      case 'Dibeli Sebagian':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
            <Clock className="w-3 h-3" />
            <span>Dibeli Sebagian</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-bold">
            <span>Belum Dibeli</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-400" />
            <span>Rincian Material & Kebutuhan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola daftar spesifikasi, estimasi anggaran, dan pelacakan belanja material bertahap.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Kalkulator Material</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Material</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Material
          </span>
          <div className="text-lg sm:text-xl font-black text-white font-mono-numbers mt-1">
            {materials.length} item
          </div>
          <span className="text-[10px] text-slate-500">
            {unpurchasedCount} item belum dibeli
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Estimasi Biaya
          </span>
          <div className="text-lg sm:text-xl font-black text-cyan-400 font-mono-numbers mt-1">
            {formatRupiah(totalEstimatedCost)}
          </div>
          <span className="text-[10px] text-slate-500">Anggaran terencana</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Realisasi Pembelian
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono-numbers mt-1">
            {formatRupiah(totalActualPurchasedCost)}
          </div>
          <span className="text-[10px] text-slate-500">Total nilai faktur beli</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Sisa Estimasi Belanja
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-400 font-mono-numbers mt-1">
            {formatRupiah(materials.reduce((sum, m) => sum + m.estimatedRemainingCost, 0))}
          </div>
          <span className="text-[10px] text-slate-500">Perlu dibeli</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama material, merek, spesifikasi..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Belum Dibeli">Belum Dibeli</option>
            <option value="Dibeli Sebagian">Dibeli Sebagian</option>
            <option value="Sudah Dibeli">Sudah Dibeli</option>
          </select>
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-3">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak Ada Material Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Tidak ada material yang sesuai dengan filter pencarian Anda.'
              : 'Belum ada material yang ditambahkan ke proyek ini. Mulai dengan menambahkan material atau gunakan kalkulator!'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Material Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((m) => {
            const progressPercent = Math.min(
              100,
              Math.round((m.purchasedQuantity / (m.requiredQuantity || 1)) * 100)
            );

            return (
              <div
                key={m.id}
                className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition flex flex-col justify-between group space-y-4"
              >
                {/* Top: Category & Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                      {categoryMap.get(m.categoryId) || 'Material'}
                    </span>
                    {getStatusBadge(m.status, m.isOverPurchased)}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition line-clamp-1">
                      {m.name}
                    </h3>
                    {(m.brand || m.specification) && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {m.brand ? `${m.brand} • ` : ''}
                        {m.specification}
                      </p>
                    )}
                  </div>
                </div>

                {/* Middle: Quantities & Progress */}
                <div className="space-y-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Kebutuhan:</span>
                    <span className="font-bold text-white font-mono-numbers">
                      {formatQuantity(m.requiredQuantity)} {m.unit}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Sudah Dibeli:</span>
                    <span className="font-bold text-emerald-400 font-mono-numbers">
                      {formatQuantity(m.purchasedQuantity)} {m.unit}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        m.isOverPurchased
                          ? 'bg-cyan-400'
                          : progressPercent === 100
                          ? 'bg-emerald-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-700/50">
                    <span className="text-slate-400">Sisa Kebutuhan:</span>
                    <span
                      className={`font-bold font-mono-numbers ${
                        m.remainingQuantity === 0 ? 'text-emerald-400' : 'text-cyan-400'
                      }`}
                    >
                      {formatQuantity(m.remainingQuantity)} {m.unit}
                    </span>
                  </div>

                  {m.isOverPurchased && (
                    <div className="text-[10px] text-cyan-300 bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-800/40">
                      Kelebihan beli: +{formatQuantity(m.overPurchasedQuantity)} {m.unit}
                    </div>
                  )}
                </div>

                {/* Financial details */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Harga Satuan Estimasi:</span>
                    <span className="font-bold text-slate-200 font-mono-numbers">
                      {formatRupiah(m.estimatedUnitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Estimasi:</span>
                    <span className="font-bold text-white font-mono-numbers">
                      {formatRupiah(m.estimatedTotalCost)}
                    </span>
                  </div>
                  {m.purchasedQuantity > 0 && (
                    <div className="flex justify-between text-emerald-300 pt-1 border-t border-slate-800">
                      <span>Total Realisasi Beli:</span>
                      <span className="font-bold font-mono-numbers">
                        {formatRupiah(m.actualTotalPurchasedCost)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPurchasingMaterial(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/30 transition active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Beli</span>
                    </button>

                    <button
                      onClick={() => setHistoryMaterial(m)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition"
                      title="Riwayat & Bayar Tagihan"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Riwayat</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingMaterial(m)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit Material"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setMaterialToDelete(m)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Hapus Material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Material Modal */}
      <MaterialModal
        isOpen={isAddModalOpen || !!editingMaterial}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMaterial(null);
        }}
        categories={categories}
        projectId={projectId}
        initialMaterial={editingMaterial}
        onSave={onSaveMaterial}
        onAddCategory={onAddCategory}
      />

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={!!purchasingMaterial}
        onClose={() => setPurchasingMaterial(null)}
        material={purchasingMaterial}
        projectId={projectId}
        onRecordPurchase={onRecordPurchase}
      />

      {/* Purchase History & Payments Modal */}
      {historyMaterial && (
        <PurchaseHistoryModal
          isOpen={!!historyMaterial}
          onClose={() => setHistoryMaterial(null)}
          material={historyMaterial}
          purchases={purchases.filter((p) => p.materialId === historyMaterial.id)}
          transactions={transactions}
          onAddPayment={onAddPayment}
          onDeletePurchase={onDeletePurchase}
        />
      )}

      {/* Confirm Delete Material */}
      <ConfirmDialog
        isOpen={!!materialToDelete}
        title="Hapus Material"
        message={`Apakah Anda yakin ingin menghapus material "${materialToDelete?.name}"? Riwayat pembelian yang sudah terjadi akan tetap tercatat di sistem.`}
        confirmLabel="Hapus Material"
        onConfirm={async () => {
          if (materialToDelete) {
            await onDeleteMaterial(materialToDelete.id);
            setMaterialToDelete(null);
          }
        }}
        onCancel={() => setMaterialToDelete(null)}
      />
    </div>
  );
};
