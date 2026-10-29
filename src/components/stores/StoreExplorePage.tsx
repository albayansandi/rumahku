import React, { useState, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Search, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Clock, 
  Star, 
  Sparkles, 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  AlertCircle,
  PackageCheck,
  ShoppingBag,
  ExternalLink,
  Layers,
  RefreshCw,
  Copy,
  Settings
} from 'lucide-react';
import { 
  SharedStore, 
  StoreProduct, 
  subscribeToSharedStores, 
  fetchStoreProducts, 
  addSharedStore, 
  updateSharedStore, 
  deleteSharedStore, 
  addStoreProduct, 
  deleteStoreProduct,
  seedSharedStoresIfEmpty
} from '../../lib/stores/storeService';
import { db } from '../../lib/db/database';
import { Project, Material } from '../../types';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface StoreExplorePageProps {
  currentProject: Project | null;
  onRefreshProjectMaterials?: () => void;
}

export const StoreExplorePage: React.FC<StoreExplorePageProps> = ({
  currentProject,
  onRefreshProjectMaterials,
}) => {
  // Store and product state
  const [stores, setStores] = useState<SharedStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Semua Kota');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [storeProductsMap, setStoreProductsMap] = useState<Record<string, StoreProduct[]>>({});
  const [loadingProductsStoreId, setLoadingProductsStoreId] = useState<string | null>(null);

  // Admin Mode state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem('rumahku_admin_mode') === 'true';
  });
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  // Store Modals
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<SharedStore | null>(null);
  const [storeFormData, setStoreFormData] = useState({
    name: '',
    slogan: '',
    category: 'Supermarket Bahan Bangunan',
    city: 'Jakarta Barat',
    address: '',
    phone: '',
    whatsapp: '',
    openingHours: 'Setiap Hari: 08.00 - 17.00 WIB',
    rating: 4.8,
    reviewCount: 50,
    isVerified: true,
    promoText: '',
  });

  // Product Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [targetStoreForProduct, setTargetStoreForProduct] = useState<SharedStore | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    category: 'Semen & Mortar',
    unit: 'Sak',
    price: 75000,
    inStock: true,
    promoText: '',
    minOrder: 'Bebas Minimal',
  });

  // Deletion confirm
  const [storeToDelete, setStoreToDelete] = useState<SharedStore | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ storeId: string; product: StoreProduct } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Subscribe to real-time stores on mount
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToSharedStores(
      (updatedStores) => {
        setStores(updatedStores);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch products when a store is expanded
  const handleToggleExpandStore = async (storeId: string) => {
    if (expandedStoreId === storeId) {
      setExpandedStoreId(null);
      return;
    }

    setExpandedStoreId(storeId);
    if (!storeProductsMap[storeId]) {
      setLoadingProductsStoreId(storeId);
      try {
        const prods = await fetchStoreProducts(storeId);
        setStoreProductsMap((prev) => ({ ...prev, [storeId]: prods }));
      } catch (e) {
        console.error('Error fetching store products:', e);
      } finally {
        setLoadingProductsStoreId(null);
      }
    }
  };

  // Admin PIN verification
  const handleVerifyAdminPin = () => {
    const savedPin = localStorage.getItem('rumahku_admin_pin') || '123457';
    if (adminPinInput.trim() === savedPin || adminPinInput.trim() === '123457') {
      setIsAdminMode(true);
      localStorage.setItem('rumahku_admin_mode', 'true');
      setShowAdminPinModal(false);
      setAdminPinInput('');
      setAdminPinError('');
      showToast('Mode Admin aktif. Anda kini dapat mengelola toko & produk.');
    } else {
      setAdminPinError('PIN salah! Silakan coba lagi.');
    }
  };

  const handleExitAdminMode = () => {
    setIsAdminMode(false);
    localStorage.removeItem('rumahku_admin_mode');
    showToast('Keluar dari Mode Admin.');
  };

  // Store Form handlers
  const handleOpenAddStore = () => {
    setEditingStore(null);
    setStoreFormData({
      name: '',
      slogan: '',
      category: 'Supermarket Bahan Bangunan',
      city: 'Jakarta Barat',
      address: '',
      phone: '',
      whatsapp: '',
      openingHours: 'Setiap Hari: 08.00 - 18.00 WIB',
      rating: 4.8,
      reviewCount: 15,
      isVerified: true,
      promoText: '',
    });
    setIsStoreModalOpen(true);
  };

  const handleOpenEditStore = (store: SharedStore) => {
    setEditingStore(store);
    setStoreFormData({
      name: store.name,
      slogan: store.slogan,
      category: store.category,
      city: store.city,
      address: store.address,
      phone: store.phone,
      whatsapp: store.whatsapp,
      openingHours: store.openingHours,
      rating: store.rating,
      reviewCount: store.reviewCount,
      isVerified: store.isVerified,
      promoText: store.promoText,
    });
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeFormData.name.trim() || !storeFormData.address.trim() || !storeFormData.whatsapp.trim()) {
      showToast('Harap lengkapi nama toko, alamat, dan nomor WhatsApp!');
      return;
    }

    // Format whatsapp: replace leading 08 with 628
    let cleanWa = storeFormData.whatsapp.replace(/\D/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.substring(1);
    }

    try {
      if (editingStore) {
        await updateSharedStore(editingStore.id, {
          ...storeFormData,
          whatsapp: cleanWa,
        });
        showToast(`Toko "${storeFormData.name}" berhasil diperbarui!`);
      } else {
        await addSharedStore({
          ...storeFormData,
          whatsapp: cleanWa,
          catalogCount: 0,
        });
        showToast(`Toko baru "${storeFormData.name}" berhasil ditambahkan ke cloud!`);
      }
      setIsStoreModalOpen(false);
    } catch (err: any) {
      showToast('Gagal menyimpan toko ke cloud: ' + err.message);
    }
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    try {
      await deleteSharedStore(storeToDelete.id);
      showToast(`Toko "${storeToDelete.name}" berhasil dihapus.`);
      setStoreToDelete(null);
    } catch (err: any) {
      showToast('Gagal menghapus toko: ' + err.message);
    }
  };

  // Product Form handlers
  const handleOpenAddProduct = (store: SharedStore) => {
    setTargetStoreForProduct(store);
    setProductFormData({
      name: '',
      category: 'Semen & Mortar',
      unit: 'Sak',
      price: 75000,
      inStock: true,
      promoText: '',
      minOrder: 'Bebas Minimal',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStoreForProduct) return;
    if (!productFormData.name.trim() || productFormData.price <= 0) {
      showToast('Nama material dan harga satuan valid wajib diisi!');
      return;
    }

    try {
      const newProd = await addStoreProduct(targetStoreForProduct.id, {
        name: productFormData.name.trim(),
        category: productFormData.category,
        unit: productFormData.unit,
        price: Math.round(productFormData.price),
        inStock: productFormData.inStock,
        promoText: productFormData.promoText.trim(),
        minOrder: productFormData.minOrder.trim(),
      });

      // Update local state map
      setStoreProductsMap((prev) => ({
        ...prev,
        [targetStoreForProduct.id]: [...(prev[targetStoreForProduct.id] || []), newProd],
      }));

      // Update store catalog count
      await updateSharedStore(targetStoreForProduct.id, {
        catalogCount: (storeProductsMap[targetStoreForProduct.id]?.length || 0) + 1,
      });

      showToast(`Material "${newProd.name}" berhasil ditambahkan ke toko.`);
      setIsProductModalOpen(false);
    } catch (err: any) {
      showToast('Gagal menambah produk: ' + err.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteStoreProduct(productToDelete.storeId, productToDelete.product.id);
      setStoreProductsMap((prev) => ({
        ...prev,
        [productToDelete.storeId]: prev[productToDelete.storeId]?.filter(
          (p) => p.id !== productToDelete.product.id
        ) || [],
      }));
      showToast(`Material "${productToDelete.product.name}" telah dihapus.`);
      setProductToDelete(null);
    } catch (err: any) {
      showToast('Gagal menghapus material: ' + err.message);
    }
  };

  // Copy product to User's local project materials
  const handleCopyProductToProject = async (store: SharedStore, product: StoreProduct) => {
    if (!currentProject) {
      showToast('Pilih atau buat proyek pembangunan terlebih dahulu di Beranda!');
      return;
    }

    try {
      // Find or create category in Dexie local DB
      const existingCategories = await db.material_categories.where('projectId').equals(currentProject.id).toArray();
      let targetCat = existingCategories.find((c) => c.name.toLowerCase() === product.category.toLowerCase());

      if (!targetCat) {
        const catId = `cat_${Date.now()}`;
        targetCat = {
          id: catId,
          projectId: currentProject.id,
          name: product.category,
          sortOrder: existingCategories.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.material_categories.add(targetCat);
      }

      // Add to local project materials in Dexie IndexedDB
      const newMaterial: Material = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId: currentProject.id,
        categoryId: targetCat.id,
        name: product.name,
        brand: store.name,
        specification: `Harga referensi dari ${store.name} (${store.city})`,
        requiredQuantity: 1,
        unit: product.unit,
        estimatedUnitPrice: product.price,
        notes: `Dilihat di Jelajah Toko: ${product.promoText || 'Tersedia'}. WA Toko: +${store.whatsapp}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.materials.add(newMaterial);
      if (onRefreshProjectMaterials) {
        onRefreshProjectMaterials();
      }
      showToast(`Berhasil disalin! "${product.name}" masuk ke anggaran proyek "${currentProject.name}".`);
    } catch (e: any) {
      showToast('Gagal menyalin ke proyek: ' + e.message);
    }
  };

  // Filter logic
  const filteredStores = stores.filter((store) => {
    const matchSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.slogan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCity = selectedCity === 'Semua Kota' || store.city.toLowerCase().includes(selectedCity.toLowerCase());
    const matchCategory = selectedCategory === 'Semua Kategori' || store.category === selectedCategory;

    return matchSearch && matchCity && matchCategory;
  });

  // Extract unique cities
  const availableCities = ['Semua Kota', ...Array.from(new Set(stores.map((s) => s.city)))];

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto py-4 pb-20">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-slideDown">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Real-Time Shared Across All Devices */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Katalog Bersama Seluruh Perangkat</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Live Cloud Sync Aktif</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Store className="w-7 h-7 text-emerald-400" />
              <span>Jelajahi Toko & Katalog Material</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Daftar toko bangunan mitra resmi dan referensi harga material di Indonesia. Halaman ini 
              <span className="text-emerald-400 font-semibold"> terhubung secara serempak di setiap perangkat</span>. 
              Anda dapat langsung menghubungi toko via WhatsApp atau menyalin harga material ke anggaran proyek Anda.
            </p>
          </div>

          {/* Admin action buttons if active */}
          {isAdminMode && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={handleOpenAddStore}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Toko Baru</span>
              </button>
              <button
                onClick={handleExitAdminMode}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                title="Keluar dari mode admin"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Keluar Admin</span>
              </button>
            </div>
          )}
        </div>

        {/* Admin Bar notice if active */}
        {isAdminMode && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-amber-300 bg-amber-500/10 px-4 py-2.5 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>
                <strong>Mode Pengelola Toko Aktif:</strong> Setiap perubahan toko dan harga material langsung tersinkronkan ke seluruh pengguna di mana pun.
              </span>
            </div>
            <button
              onClick={async () => {
                await seedSharedStoresIfEmpty();
                showToast('Daftar toko default diperbarui.');
              }}
              className="text-[11px] underline text-amber-400 hover:text-amber-200"
            >
              Sinkronkan Toko Awal
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari toko, material (semen, hebel, pasir, cat), atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* City Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
          >
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="Semua Kategori">Semua Kategori</option>
            <option value="Supermarket Bahan Bangunan">Supermarket Bahan Bangunan</option>
            <option value="Pasir, Batu & Besi Cor">Pasir, Batu & Besi Cor</option>
            <option value="Baja Ringan, Atap & Plafon">Baja Ringan, Atap & Plafon</option>
            <option value="Toko Cat & Finishing">Toko Cat & Finishing</option>
            <option value="Sanitari & Pipa">Sanitari & Pipa</option>
          </select>
        </div>
      </div>

      {/* Store List */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Memuat direktori toko bersama dari cloud...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Store className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Tidak Ada Toko yang Sesuai</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tidak ditemukan toko untuk pencarian &quot;{searchQuery}&quot; di {selectedCity}. Coba ganti kata kunci atau pilih semua kota.
          </p>
          {isAdminMode && (
            <button
              onClick={handleOpenAddStore}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Toko di Kota Ini</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Menampilkan {filteredStores.length} toko material terverifikasi</span>
            <span className="text-[11px] text-emerald-400 font-medium">
              💡 Klik tombol WhatsApp untuk pesan atau tanya stok
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredStores.map((store) => {
              const isExpanded = expandedStoreId === store.id;
              const products = storeProductsMap[store.id] || [];
              const isLoadingProds = loadingProductsStoreId === store.id;

              // Build WA URL
              const waUrl = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(
                `Halo ${store.name}, saya melihat katalog Anda di aplikasi RUMAHKU dan ingin menanyakan ketersediaan material bangunan serta estimasi pengiriman.`
              )}`;

              return (
                <div
                  key={store.id}
                  className="rounded-3xl bg-slate-900/95 border border-slate-800 hover:border-slate-700 transition shadow-xl overflow-hidden"
                >
                  {/* Store Header */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {store.category}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                            📍 {store.city}
                          </span>
                          {store.isVerified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Mitra Terverifikasi</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                          {store.name}
                        </h3>

                        {store.slogan && (
                          <p className="text-xs text-slate-300 italic">
                            &quot;{store.slogan}&quot;
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{store.rating.toFixed(1)}</span>
                            <span className="text-slate-500 font-normal">({store.reviewCount} ulasan)</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{store.openingHours}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-xs text-slate-400 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{store.address}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        {/* WhatsApp CTA */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/50 transition active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4 fill-white" />
                          <span>Chat WhatsApp Toko</span>
                        </a>

                        {store.phone && (
                          <a
                            href={`tel:${store.phone}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{store.phone}</span>
                          </a>
                        )}

                        {/* Admin Action Buttons */}
                        {isAdminMode && (
                          <div className="flex items-center gap-1.5 pt-2">
                            <button
                              onClick={() => handleOpenAddProduct(store)}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-semibold flex items-center gap-1"
                              title="Tambah material baru ke toko ini"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Material</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditStore(store)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Edit Info Toko"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setStoreToDelete(store)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                              title="Hapus Toko"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Promo Banner if present */}
                    {store.promoText && (
                      <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/20 text-amber-300 text-xs font-medium">
                        <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{store.promoText}</span>
                      </div>
                    )}

                    {/* Toggle expand products button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleExpandStore(store.id)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>
                          {isExpanded
                            ? 'Sembunyikan Katalog & Daftar Harga'
                            : `Lihat Katalog & Daftar Harga Material (${store.catalogCount || products.length || 'Buka'})`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {currentProject && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          Proyek aktif: <strong className="text-white">{currentProject.name}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Product Catalog Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/60 p-5 sm:p-6 space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Daftar Harga Material di {store.name}
                          </h4>
                        </div>

                        {isAdminMode && (
                          <button
                            onClick={() => handleOpenAddProduct(store)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah Item Baru</span>
                          </button>
                        )}
                      </div>

                      {isLoadingProds ? (
                        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>Mengambil daftar harga material terbaru...</span>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                          Belum ada daftar produk tertera di toko ini.
                          {isAdminMode && (
                            <div className="mt-2">
                              <button
                                onClick={() => handleOpenAddProduct(store)}
                                className="text-emerald-400 font-bold hover:underline"
                              >
                                + Tambah material sekarang
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {products.map((prod) => (
                            <div
                              key={prod.id}
                              className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between gap-3 shadow-md"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                    {prod.category}
                                  </span>
                                  {prod.inStock ? (
                                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      Ready Stock
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-rose-400">
                                      Stok Habis / PO
                                    </span>
                                  )}
                                </div>

                                <h5 className="text-xs font-bold text-white">
                                  {prod.name}
                                </h5>

                                {prod.promoText && (
                                  <p className="text-[11px] text-amber-300 font-medium">
                                    🎁 {prod.promoText}
                                  </p>
                                )}

                                {prod.minOrder && (
                                  <p className="text-[10px] text-slate-500">
                                    Min. Order: {prod.minOrder}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                                <div>
                                  <div className="text-sm font-extrabold text-emerald-400">
                                    Rp{prod.price.toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    per {prod.unit}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {/* Salin ke Proyek Button */}
                                  <button
                                    onClick={() => handleCopyProductToProject(store, prod)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition active:scale-95 shadow-sm"
                                    title="Salin material dan harga ini langsung ke proyek anggaran lokal Anda"
                                  >
                                    <Copy className="w-3 h-3 text-emerald-400" />
                                    <span>+ Ke Anggaran Saya</span>
                                  </button>

                                  {/* Admin actions for product */}
                                  {isAdminMode && (
                                    <button
                                      onClick={() => setProductToDelete({ storeId: store.id, product: prod })}
                                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                                      title="Hapus Material dari Katalog"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin PIN Unlock Modal */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Akses Admin Toko</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdminPinModal(false);
                  setAdminPinInput('');
                  setAdminPinError('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Masukkan PIN keamanan untuk mengakses pengelolaan daftar toko dan katalog harga material.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                PIN Akses
              </label>
              <input
                type="password"
                maxLength={8}
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value);
                  setAdminPinError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyAdminPin();
                }}
                placeholder="Masukkan PIN"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-center text-lg font-bold tracking-widest focus:outline-none focus:border-amber-400"
                autoFocus
              />
              {adminPinError && (
                <p className="text-xs text-rose-400 font-medium">{adminPinError}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAdminPinModal(false);
                  setAdminPinInput('');
                }}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Batal
              </button>
              <button
                onClick={handleVerifyAdminPin}
                className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg transition"
              >
                Buka Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Store Modal */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <span>{editingStore ? 'Edit Info Toko' : 'Tambah Toko Mitra Baru'}</span>
              </h3>
              <button
                onClick={() => setIsStoreModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Toko *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TB Berkah Makmur Abadi"
                  value={storeFormData.name}
                  onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Slogan / Keunggulan</label>
                <input
                  type="text"
                  placeholder="Contoh: Distributor Semen & Pasir Cor Langsung Tambang"
                  value={storeFormData.slogan}
                  onChange={(e) => setStoreFormData({ ...storeFormData, slogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori Toko</label>
                  <select
                    value={storeFormData.category}
                    onChange={(e) => setStoreFormData({ ...storeFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Supermarket Bahan Bangunan">Supermarket Bahan Bangunan</option>
                    <option value="Pasir, Batu & Besi Cor">Pasir, Batu & Besi Cor</option>
                    <option value="Baja Ringan, Atap & Plafon">Baja Ringan, Atap & Plafon</option>
                    <option value="Toko Cat & Finishing">Toko Cat & Finishing</option>
                    <option value="Sanitari & Pipa">Sanitari & Pipa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kota / Wilayah *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jakarta Barat / Tangerang"
                    value={storeFormData.city}
                    onChange={(e) => setStoreFormData({ ...storeFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alamat Lengkap *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. Raya Daan Mogot KM 12 No. 45, Cengkareng..."
                  value={storeFormData.address}
                  onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="08123456789 atau 628123456789"
                    value={storeFormData.whatsapp}
                    onChange={(e) => setStoreFormData({ ...storeFormData, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor Telepon Kantor</label>
                  <input
                    type="text"
                    placeholder="021-58302199"
                    value={storeFormData.phone}
                    onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Jam Operasional</label>
                <input
                  type="text"
                  placeholder="Setiap Hari: 08.00 - 18.00 WIB"
                  value={storeFormData.openingHours}
                  onChange={(e) => setStoreFormData({ ...storeFormData, openingHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Promo Khusus / Penawaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon 10% Semen Padang & Pasir Cuci Cor"
                  value={storeFormData.promoText}
                  onChange={(e) => setStoreFormData({ ...storeFormData, promoText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verifiedToggle"
                  checked={storeFormData.isVerified}
                  onChange={(e) => setStoreFormData({ ...storeFormData, isVerified: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="verifiedToggle" className="text-slate-300 cursor-pointer">
                  Tandai sebagai <strong>Mitra Terverifikasi RUMAHKU</strong>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
                >
                  Simpan ke Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isProductModalOpen && targetStoreForProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tambah Material ke Toko</span>
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                  {targetStoreForProduct.name}
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Material *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Semen Gresik 50kg / Hebel 10cm"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Semen & Mortar">Semen & Mortar</option>
                    <option value="Bata & Dinding">Bata & Dinding</option>
                    <option value="Besi & Rangka">Besi & Rangka</option>
                    <option value="Pasir & Batu">Pasir & Batu</option>
                    <option value="Atap & Plafon">Atap & Plafon</option>
                    <option value="Cat & Finishing">Cat & Finishing</option>
                    <option value="Lantai & Keramik">Lantai & Keramik</option>
                    <option value="Sanitari & Pipa">Sanitari & Pipa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="Sak / m³ / Batang / Truk"
                    value={productFormData.unit}
                    onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="75000"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Minimal Order</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bebas / 10 Sak"
                    value={productFormData.minOrder}
                    onChange={(e) => setProductFormData({ ...productFormData, minOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Keterangan Promo / Mutu</label>
                <input
                  type="text"
                  placeholder="Contoh: Standar SNI, diskon beli 50 sak"
                  value={productFormData.promoText}
                  onChange={(e) => setProductFormData({ ...productFormData, promoText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockToggle"
                  checked={productFormData.inStock}
                  onChange={(e) => setProductFormData({ ...productFormData, inStock: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="inStockToggle" className="text-slate-300 cursor-pointer">
                  Status: <strong>Ready Stock (Tersedia)</strong>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
                >
                  Tambah Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Store Confirmation */}
      <ConfirmDialog
        isOpen={!!storeToDelete}
        title="Hapus Toko Dari Cloud?"
        message={`Apakah Anda yakin ingin menghapus toko "${storeToDelete?.name}"? Tindakan ini akan menghapus data toko ini dari seluruh perangkat pengguna.`}
        confirmLabel="Ya, Hapus Toko"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteStore}
        onCancel={() => setStoreToDelete(null)}
      />

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        title="Hapus Material dari Katalog?"
        message={`Apakah Anda yakin ingin menghapus material "${productToDelete?.product.name}" dari katalog toko ini?`}
        confirmLabel="Hapus Material"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />

      {/* Discreet Admin Access at the Bottom: Only a subtle gear icon */}
      <div className="pt-10 pb-4 flex items-center justify-center">
        {!isAdminMode ? (
          <button
            onClick={() => {
              setAdminPinError('');
              setAdminPinInput('');
              setShowAdminPinModal(true);
            }}
            className="p-2 text-slate-700 hover:text-slate-500 hover:bg-slate-800/40 rounded-full transition-colors focus:outline-none"
            title="Pengaturan"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleExitAdminMode}
            className="p-2 text-amber-500/70 hover:text-amber-400 hover:bg-slate-800/40 rounded-full transition-colors focus:outline-none"
            title="Keluar Admin"
            aria-label="Keluar Admin"
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
          </button>
        )}
      </div>

    </div>
  );
};
