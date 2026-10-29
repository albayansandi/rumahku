import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Material, MaterialCategory, StandardUnit } from '../../types';
import { CurrencyInput } from '../shared/CurrencyInput';
import { formatRupiah } from '../../lib/calculations/financial';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MaterialCategory[];
  projectId: string;
  initialMaterial?: Material | null;
  onSave: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  onAddCategory: (name: string) => Promise<MaterialCategory>;
}

const DEFAULT_UNITS: StandardUnit[] = [
  'Batang',
  'Sak',
  'Kubik',
  'Meter',
  'Meter persegi',
  'Kilogram',
  'Liter',
  'Pcs',
  'Dus',
  'Lembar',
  'Roll',
  'Unit',
];

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  categories,
  projectId,
  initialMaterial,
  onSave,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [specification, setSpecification] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<StandardUnit>('Batang');
  const [customUnit, setCustomUnit] = useState('');
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialMaterial) {
      setName(initialMaterial.name);
      setCategoryId(initialMaterial.categoryId);
      setBrand(initialMaterial.brand || '');
      setSpecification(initialMaterial.specification || '');
      setRequiredQuantity(initialMaterial.requiredQuantity);
      if (DEFAULT_UNITS.includes(initialMaterial.unit)) {
        setUnit(initialMaterial.unit);
        setCustomUnit('');
      } else {
        setUnit('Kustom');
        setCustomUnit(initialMaterial.unit);
      }
      setEstimatedUnitPrice(initialMaterial.estimatedUnitPrice);
      setNotes(initialMaterial.notes || '');
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setBrand('');
      setSpecification('');
      setRequiredQuantity(1);
      setUnit('Batang');
      setCustomUnit('');
      setEstimatedUnitPrice(0);
      setNotes('');
    }
  }, [initialMaterial, categories, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation: Total Estimasi
  const liveTotalEstimate = Math.round((Number(requiredQuantity) || 0) * (Number(estimatedUnitPrice) || 0));

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await onAddCategory(newCategoryName.trim());
      setCategoryId(created.id);
      setNewCategoryName('');
      setIsNewCategoryOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama material wajib diisi.');
      return;
    }
    if (requiredQuantity <= 0) {
      alert('Jumlah kebutuhan harus lebih dari 0.');
      return;
    }
    if (estimatedUnitPrice < 0) {
      alert('Harga estimasi tidak boleh negatif.');
      return;
    }

    const selectedUnit = unit === 'Kustom' ? (customUnit.trim() || 'Unit') : unit;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          projectId,
          categoryId: categoryId || categories[0]?.id,
          name: name.trim(),
          brand: brand.trim() || undefined,
          specification: specification.trim() || undefined,
          requiredQuantity: Number(requiredQuantity),
          unit: selectedUnit,
          estimatedUnitPrice: Number(estimatedUnitPrice),
          notes: notes.trim() || undefined,
        },
        initialMaterial?.id
      );
      onClose();
    } catch (err) {
      console.error('Error saving material', err);
      alert('Gagal menyimpan material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {initialMaterial ? 'Edit Data Material' : 'Tambah Material Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Material */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nama Material <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Besi Beton Ulir 10mm"
              required
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Kategori Dropdown with inline add */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Kategori Pekerjaan <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsNewCategoryOpen(!isNewCategoryOpen)}
                className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Kategori Baru</span>
              </button>
            </div>

            {isNewCategoryOpen ? (
              <div className="flex gap-2 p-2 rounded-xl bg-slate-800/80 border border-emerald-500/40 mb-2">
                <input
                  type="text"
                  placeholder="Nama kategori baru..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCategoryOpen(false)}
                  className="px-2 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300"
                >
                  Batal
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Merek & Spesifikasi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Merek</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Contoh: Krakatau Steel"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Spesifikasi</label>
              <input
                type="text"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                placeholder="Contoh: SNI P.12m"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Jumlah Kebutuhan & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Jumlah Kebutuhan <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={requiredQuantity || ''}
                onChange={(e) => setRequiredQuantity(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Satuan <span className="text-rose-400">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as StandardUnit)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {DEFAULT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="Kustom">+ Satuan Lainnya...</option>
              </select>
            </div>
          </div>

          {unit === 'Kustom' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tulis Satuan Kustom
              </label>
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Contoh: Truk, Pick Up, Galon, Kotak"
                required
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white"
              />
            </div>
          )}

          {/* Harga Satuan Estimasi */}
          <CurrencyInput
            label="Estimasi Harga Satuan"
            value={estimatedUnitPrice}
            onChange={(val) => setEstimatedUnitPrice(val)}
            required
            placeholder="85.000"
          />

          {/* Live Total Estimation Card (Section 8.2) */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-emerald-300 font-semibold block">Total Estimasi Biaya</span>
              <span className="text-[11px] text-slate-400 font-mono-numbers">
                {requiredQuantity} {unit === 'Kustom' ? customUnit || 'Unit' : unit} × {formatRupiah(estimatedUnitPrice)}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono-numbers">
              {formatRupiah(liveTotalEstimate)}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan lokasi pembelian, rekomendasi toko, dll."
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
              {isSubmitting ? 'Menyimpan...' : initialMaterial ? 'Simpan Perubahan' : 'Tambah ke Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
