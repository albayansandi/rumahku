import React, { useState } from 'react';
import { 
  Calculator, 
  Layers, 
  Grid3X3, 
  Truck, 
  Paintbrush, 
  Box, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  calculateHebel, 
  calculateKeramik, 
  calculatePasir, 
  calculateCat, 
  calculateBeton 
} from '../../lib/calculations/materialCalculators';
import { MaterialCategory, Material } from '../../types';
import { formatRupiah } from '../../lib/calculations/financial';

interface CalculatorHubProps {
  categories: MaterialCategory[];
  projectId: string;
  onAddMaterialFromCalculator: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose?: () => void;
}

export const CalculatorHub: React.FC<CalculatorHubProps> = ({
  categories,
  projectId,
  onAddMaterialFromCalculator,
  onClose,
}) => {
  const [activeCalc, setActiveCalc] = useState<'hebel' | 'keramik' | 'pasir' | 'cat' | 'beton'>('hebel');

  // Confirmation Modal state for "Masukkan ke Daftar Material"
  const [confirmImport, setConfirmImport] = useState<{
    name: string;
    categoryId: string;
    requiredQuantity: number;
    unit: string;
    estimatedUnitPrice: number;
    notes: string;
  } | null>(null);

  // 1. Hebel State
  const [hebelWallLength, setHebelWallLength] = useState(12);
  const [hebelWallHeight, setHebelWallHeight] = useState(3.5);
  const [hebelOpeningsArea, setHebelOpeningsArea] = useState(4.2); // doors + windows
  const [hebelWaste, setHebelWaste] = useState(5);
  const hebelResult = calculateHebel({
    wallLength: hebelWallLength,
    wallHeight: hebelWallHeight,
    openingsArea: hebelOpeningsArea,
    blockLength: 0.6,
    blockHeight: 0.2,
    wastePercentage: hebelWaste,
  });

  // 2. Keramik State
  const [tileRoomLength, setTileRoomLength] = useState(6);
  const [tileRoomWidth, setTileRoomWidth] = useState(4);
  const [tileLengthCm, setTileLengthCm] = useState(60);
  const [tileWidthCm, setTileWidthCm] = useState(60);
  const [tilePcsPerBox, setTilePcsPerBox] = useState(4);
  const [tileWaste, setTileWaste] = useState(10);
  const keramikResult = calculateKeramik({
    roomLength: tileRoomLength,
    roomWidth: tileRoomWidth,
    tileLengthCm,
    tileWidthCm,
    piecesPerBox: tilePcsPerBox,
    wastePercentage: tileWaste,
  });

  // 3. Pasir State
  const [sandLength, setSandLength] = useState(8);
  const [sandWidth, setSandWidth] = useState(6);
  const [sandThickness, setSandThickness] = useState(0.08); // 8cm
  const pasirResult = calculatePasir({
    length: sandLength,
    width: sandWidth,
    thickness: sandThickness,
  });

  // 4. Cat State
  const [paintWallArea, setPaintWallArea] = useState(90);
  const [paintSpreadRate, setPaintSpreadRate] = useState(11);
  const [paintCoats, setPaintCoats] = useState(2);
  const catResult = calculateCat({
    wallArea: paintWallArea,
    spreadRateM2PerLiter: paintSpreadRate,
    coatsCount: paintCoats,
  });

  // 5. Beton State
  const [concreteLength, setConcreteLength] = useState(10);
  const [concreteWidth, setConcreteWidth] = useState(0.2); // sloof 20cm
  const [concreteHeight, setConcreteHeight] = useState(0.3); // sloof 30cm
  const betonResult = calculateBeton({
    length: concreteLength,
    width: concreteWidth,
    heightOrThickness: concreteHeight,
  });

  // Helper to trigger import dialog
  const promptImport = (item: {
    name: string;
    defaultCategoryName: string;
    requiredQuantity: number;
    unit: string;
    defaultEstimatedPrice: number;
    notes: string;
  }) => {
    const matchedCategory =
      categories.find((c) => c.name.toLowerCase().includes(item.defaultCategoryName.toLowerCase())) ||
      categories[0];

    setConfirmImport({
      name: item.name,
      categoryId: matchedCategory?.id || '',
      requiredQuantity: item.requiredQuantity,
      unit: item.unit,
      estimatedUnitPrice: item.defaultEstimatedPrice,
      notes: item.notes,
    });
  };

  const handleConfirmSave = async () => {
    if (!confirmImport) return;
    try {
      await onAddMaterialFromCalculator({
        projectId,
        categoryId: confirmImport.categoryId || categories[0]?.id,
        name: confirmImport.name,
        requiredQuantity: confirmImport.requiredQuantity,
        unit: confirmImport.unit,
        estimatedUnitPrice: confirmImport.estimatedUnitPrice,
        notes: confirmImport.notes,
      });
      alert(`Berhasil menambahkan "${confirmImport.name}" ke daftar material!`);
      setConfirmImport(null);
    } catch (e) {
      console.error(e);
      alert('Gagal menambahkan material.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Calculator className="w-7 h-7 text-emerald-400" />
            <span>Kalkulator Kebutuhan Material</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Hitung estimasi kebutuhan hebel, keramik, pasir, cat tembok, dan volume beton secara presisi.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Tutup Kalkulator
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveCalc('hebel')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeCalc === 'hebel'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Hebel / Bata</span>
        </button>

        <button
          onClick={() => setActiveCalc('keramik')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeCalc === 'keramik'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>Keramik</span>
        </button>

        <button
          onClick={() => setActiveCalc('pasir')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeCalc === 'pasir'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pasir</span>
        </button>

        <button
          onClick={() => setActiveCalc('cat')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeCalc === 'cat'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          <span>Cat Dinding</span>
        </button>

        <button
          onClick={() => setActiveCalc('beton')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeCalc === 'beton'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Beton Cor</span>
        </button>
      </div>

      {/* 1. HEBEL CALCULATOR */}
      {activeCalc === 'hebel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Input Parameter Dinding Hebel</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Panjang Dinding (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hebelWallLength}
                  onChange={(e) => setHebelWallLength(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tinggi Dinding (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hebelWallHeight}
                  onChange={(e) => setHebelWallHeight(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Luas Pintu & Jendela (m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hebelOpeningsArea}
                  onChange={(e) => setHebelOpeningsArea(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Cadangan / Waste (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={hebelWaste}
                  onChange={(e) => setHebelWaste(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 text-[11px] text-slate-400">
              * Perhitungan menggunakan standar bata ringan 60 × 20 × 10 cm (1 m³ isi ±83 keping).
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-4">Hasil Estimasi Hebel</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Luas Bersih Dinding:</span>
                  <span className="font-bold text-white font-mono-numbers">{hebelResult.netWallArea} m²</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Jumlah Hebel Utama:</span>
                  <span className="font-bold text-white font-mono-numbers">{hebelResult.baseBlocksCount} pcs</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Cadangan ({hebelWaste}%):</span>
                  <span className="font-bold text-amber-400 font-mono-numbers">+{hebelResult.wasteBlocksCount} pcs</span>
                </div>
                <div className="flex justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                  <span className="font-bold text-emerald-300">Total Kebutuhan Kubik:</span>
                  <span className="font-black text-emerald-400 font-mono-numbers text-lg">
                    {hebelResult.totalCubicMeters} m³ ({hebelResult.totalBlocksCount} pcs)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                promptImport({
                  name: `Bata Ringan Hebel 10cm (${hebelWallLength}m x ${hebelWallHeight}m)`,
                  defaultCategoryName: 'Dinding',
                  requiredQuantity: hebelResult.totalCubicMeters,
                  unit: 'Kubik',
                  defaultEstimatedPrice: 650000,
                  notes: `Estimasi otomatis kalkulator untuk dinding bersih ${hebelResult.netWallArea} m²`,
                })
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Masukkan ke Daftar Material</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. KERAMIK CALCULATOR */}
      {activeCalc === 'keramik' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-emerald-400" />
              <span>Input Parameter Ruangan & Keramik</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Panjang Ruangan (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tileRoomLength}
                  onChange={(e) => setTileRoomLength(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Lebar Ruangan (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tileRoomWidth}
                  onChange={(e) => setTileRoomWidth(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  P. Keramik (cm)
                </label>
                <input
                  type="number"
                  value={tileLengthCm}
                  onChange={(e) => setTileLengthCm(parseInt(e.target.value, 10) || 60)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white font-mono-numbers"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  L. Keramik (cm)
                </label>
                <input
                  type="number"
                  value={tileWidthCm}
                  onChange={(e) => setTileWidthCm(parseInt(e.target.value, 10) || 60)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white font-mono-numbers"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Isi / Dus (pcs)
                </label>
                <input
                  type="number"
                  value={tilePcsPerBox}
                  onChange={(e) => setTilePcsPerBox(parseInt(e.target.value, 10) || 4)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white font-mono-numbers"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Persentase Potongan / Cadangan (%)
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={tileWaste}
                onChange={(e) => setTileWaste(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
              />
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-4">Hasil Estimasi Keramik</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Luas Total Ruangan:</span>
                  <span className="font-bold text-white font-mono-numbers">{keramikResult.roomArea} m²</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Luas Cover Per Dus:</span>
                  <span className="font-bold text-white font-mono-numbers">{keramikResult.areaPerBoxM2} m² / dus</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Kebutuhan Keping:</span>
                  <span className="font-bold text-white font-mono-numbers">{keramikResult.totalTilesCount} keping</span>
                </div>
                <div className="flex justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                  <span className="font-bold text-emerald-300">Total Kebutuhan Dus:</span>
                  <span className="font-black text-emerald-400 font-mono-numbers text-lg">
                    {keramikResult.totalBoxesCount} Dus
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                promptImport({
                  name: `Keramik Granit ${tileLengthCm}x${tileWidthCm}`,
                  defaultCategoryName: 'Lantai',
                  requiredQuantity: keramikResult.totalBoxesCount,
                  unit: 'Dus',
                  defaultEstimatedPrice: 195000,
                  notes: `Hasil kalkulator ruangan ${tileRoomLength}m x ${tileRoomWidth}m (${keramikResult.roomArea} m²) + ${tileWaste}% waste`,
                })
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Masukkan ke Daftar Material</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. PASIR CALCULATOR */}
      {activeCalc === 'pasir' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <span>Input Parameter Pasir Pasang</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Panjang Area (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={sandLength}
                onChange={(e) => setSandLength(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Lebar Area (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={sandWidth}
                onChange={(e) => setSandWidth(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ketebalan Lapisan Pasir (m)
              </label>
              <input
                type="number"
                step="0.01"
                value={sandThickness}
                onChange={(e) => setSandThickness(parseFloat(e.target.value) || 0)}
                placeholder="Contoh: 0.05 untuk 5cm"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
              />
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-4">Hasil Estimasi Pasir</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Luas Permukaan:</span>
                  <span className="font-bold text-white font-mono-numbers">{pasirResult.areaM2} m²</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Estimasi Armada Truk Engkel (4m³):</span>
                  <span className="font-bold text-cyan-400 font-mono-numbers">~{pasirResult.estimatedTrucks} Truk</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Estimasi Armada Pick-up (0.8m³):</span>
                  <span className="font-bold text-cyan-400 font-mono-numbers">~{pasirResult.estimatedPickups} Pick Up</span>
                </div>
                <div className="flex justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                  <span className="font-bold text-emerald-300">Total Volume Pasir:</span>
                  <span className="font-black text-emerald-400 font-mono-numbers text-lg">
                    {pasirResult.totalWithWasteM3} m³ (Kubik)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                promptImport({
                  name: 'Pasir Pasang / Cor Halus',
                  defaultCategoryName: 'Pondasi',
                  requiredQuantity: pasirResult.totalWithWasteM3,
                  unit: 'Kubik',
                  defaultEstimatedPrice: 320000,
                  notes: `Estimasi tebal ${sandThickness * 100}cm pada luas ${pasirResult.areaM2} m²`,
                })
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Masukkan ke Daftar Material</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. CAT CALCULATOR */}
      {activeCalc === 'cat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-emerald-400" />
              <span>Input Parameter Pengecatan</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Total Luas Dinding yang Dicat (m²)
              </label>
              <input
                type="number"
                step="1"
                value={paintWallArea}
                onChange={(e) => setPaintWallArea(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Daya Sebar Cat (m²/Liter)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={paintSpreadRate}
                  onChange={(e) => setPaintSpreadRate(parseFloat(e.target.value) || 10)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white font-mono-numbers"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Jumlah Lapisan (Lapis)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={paintCoats}
                  onChange={(e) => setPaintCoats(parseInt(e.target.value, 10) || 2)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white font-mono-numbers"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-4">Hasil Estimasi Cat Dinding</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Total Kebutuhan Liter:</span>
                  <span className="font-bold text-white font-mono-numbers">{catResult.totalLiters} Liter</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Opsi Galon (5 Liter):</span>
                  <span className="font-bold text-cyan-400 font-mono-numbers">~{catResult.estimatedGallons5L} Galon</span>
                </div>
                <div className="flex justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                  <span className="font-bold text-emerald-300">Opsi Pail (20 Liter):</span>
                  <span className="font-black text-emerald-400 font-mono-numbers text-lg">
                    ~{catResult.estimatedPails20L} Pail
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                promptImport({
                  name: `Cat Tembok Interior / Eksterior (${paintCoats} Lapis)`,
                  defaultCategoryName: 'Cat',
                  requiredQuantity: catResult.totalLiters,
                  unit: 'Liter',
                  defaultEstimatedPrice: 65000,
                  notes: `Estimasi untuk luas ${paintWallArea} m² (${paintCoats} lapisan cat)`,
                })
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Masukkan ke Daftar Material</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. BETON CALCULATOR */}
      {activeCalc === 'beton' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-emerald-400" />
              <span>Input Parameter Balok / Plat Beton Cor</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Panjang Cor (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={concreteLength}
                onChange={(e) => setConcreteLength(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Lebar / Tebal (m)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={concreteWidth}
                  onChange={(e) => setConcreteWidth(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white font-mono-numbers"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tinggi / Tebal (m)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={concreteHeight}
                  onChange={(e) => setConcreteHeight(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white font-mono-numbers"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-4">Hasil Estimasi Campuran Beton</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Estimasi Semen Portland (50kg):</span>
                  <span className="font-bold text-white font-mono-numbers">~{betonResult.cementSacksApprox} Sak</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Estimasi Pasir Cor:</span>
                  <span className="font-bold text-white font-mono-numbers">{betonResult.sandM3Approx} m³</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-800/60 text-xs">
                  <span className="text-slate-400">Estimasi Kerikil / Split:</span>
                  <span className="font-bold text-white font-mono-numbers">{betonResult.gravelM3Approx} m³</span>
                </div>
                <div className="flex justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                  <span className="font-bold text-emerald-300">Total Volume Beton Cor:</span>
                  <span className="font-black text-emerald-400 font-mono-numbers text-lg">
                    {betonResult.totalWithWasteM3} m³ (Kubik)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                promptImport({
                  name: `Ready-mix Beton Cor K-225`,
                  defaultCategoryName: 'Pondasi',
                  requiredQuantity: betonResult.totalWithWasteM3,
                  unit: 'Kubik',
                  defaultEstimatedPrice: 850000,
                  notes: `Cor sloof/balok ${concreteLength}m x ${concreteWidth}m x ${concreteHeight}m`,
                })
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Masukkan ke Daftar Material</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Add directly to Material List */}
      {confirmImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Konfirmasi Tambah Material</h3>
            <p className="text-xs text-slate-300">
              Periksa dan sesuaikan data hasil kalkulator sebelum dimasukkan ke anggaran proyek:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nama Material
                </label>
                <input
                  type="text"
                  value={confirmImport.name}
                  onChange={(e) => setConfirmImport({ ...confirmImport, name: e.target.value })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Kategori Proyek
                </label>
                <select
                  value={confirmImport.categoryId}
                  onChange={(e) => setConfirmImport({ ...confirmImport, categoryId: e.target.value })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Jumlah ({confirmImport.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={confirmImport.requiredQuantity}
                    onChange={(e) =>
                      setConfirmImport({
                        ...confirmImport,
                        requiredQuantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Harga Satuan Estimasi (Rp)
                  </label>
                  <input
                    type="number"
                    value={confirmImport.estimatedUnitPrice}
                    onChange={(e) =>
                      setConfirmImport({
                        ...confirmImport,
                        estimatedUnitPrice: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white font-mono-numbers"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 text-xs flex justify-between text-emerald-300">
                <span>Total Estimasi:</span>
                <span className="font-bold font-mono-numbers">
                  {formatRupiah(confirmImport.requiredQuantity * confirmImport.estimatedUnitPrice)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmImport(null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg"
              >
                Simpan ke Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
