import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { firestoreDb, handleFirestoreError, OperationType } from '../firebase/firestore';

export interface SharedStore {
  id: string;
  name: string;
  slogan: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  openingHours: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  promoText: string;
  catalogCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreProduct {
  id: string;
  storeId: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  inStock: boolean;
  promoText?: string;
  minOrder?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial realistic default Indonesian hardware and building supply stores
export const DEFAULT_INDONESIAN_STORES: { store: SharedStore; products: Omit<StoreProduct, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[] }[] = [
  {
    store: {
      id: 'store_mitra10_gading_serpong',
      name: 'Mitra10 Supermarket Bahan Bangunan',
      slogan: 'Pusat Belanja Bahan Bangunan Terlengkap & Bergaransi',
      category: 'Supermarket Bahan Bangunan',
      city: 'Tangerang',
      address: 'Jl. Boulevard Gading Serpong Kav. 1, Curug Sangereng, Kelapa Dua, Tangerang',
      phone: '021-54210988',
      whatsapp: '628118001010',
      openingHours: 'Setiap Hari: 08.00 - 21.00 WIB',
      rating: 4.8,
      reviewCount: 342,
      isVerified: true,
      promoText: 'Cashback 5% Pengadaan Semen & Keramik + Gratis Pengiriman s/d 10 KM',
      catalogCount: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    products: [
      {
        name: 'Semen Tiga Roda Portland Composite (PCC) 50 Kg',
        category: 'Semen & Mortar',
        unit: 'Sak',
        price: 74000,
        inStock: true,
        promoText: 'Beli 100 Sak Diskon Rp2.000/sak',
        minOrder: 'Bebas Minimal',
      },
      {
        name: 'Bata Ringan Hebel AAC Standar SNI 7.5cm',
        category: 'Bata & Dinding',
        unit: 'm³',
        price: 585000,
        inStock: true,
        promoText: 'Termasuk Bongkar Muat',
        minOrder: '1 m³',
      },
      {
        name: 'Bata Ringan Hebel AAC Standar SNI 10cm',
        category: 'Bata & Dinding',
        unit: 'm³',
        price: 595000,
        inStock: true,
        minOrder: '1 m³',
      },
      {
        name: 'Mortar Perekat Bata Ringan MU-380 (40 Kg)',
        category: 'Semen & Mortar',
        unit: 'Sak',
        price: 92000,
        inStock: true,
        promoText: 'Daya rekat tinggi tahan goncangan',
      },
      {
        name: 'Besi Beton 10mm SNI Polos Panjang 12m',
        category: 'Besi & Rangka',
        unit: 'Batang',
        price: 88000,
        inStock: true,
        promoText: 'Toleransi 0.2mm bersertifikat resmi',
        minOrder: '10 Batang',
      },
      {
        name: 'Cat Tembok Dulux Catylac Interior 25 Kg (Pail)',
        category: 'Cat & Finishing',
        unit: 'Pail',
        price: 685000,
        inStock: true,
        promoText: 'Tersedia pilihan warna tinting',
      },
    ],
  },
  {
    store: {
      id: 'store_tb_berkah_jaya_abadi',
      name: 'TB Berkah Jaya Mandiri',
      slogan: 'Distributor Pasir Merapi, Batu Kali & Pasir Cor Langsung Tambang',
      category: 'Pasir, Batu & Besi Cor',
      city: 'Jakarta Barat',
      address: 'Jl. Raya Daan Mogot KM 12 No. 45, Cengkareng, Jakarta Barat',
      phone: '021-58302199',
      whatsapp: '6281288997766',
      openingHours: 'Senin - Sabtu: 07.30 - 17.30 WIB',
      rating: 4.7,
      reviewCount: 189,
      isVerified: true,
      promoText: 'Promo Pasir Cuci Cor 1 Dump Truk: Rp1.750.000 se-Jakarta Barat',
      catalogCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    products: [
      {
        name: 'Pasir Cuci Cor Extra Halus (1 Dump Truk Colt Diesel 4.5 m³)',
        category: 'Pasir & Batu',
        unit: 'Truk',
        price: 1750000,
        inStock: true,
        promoText: 'Bebas lumpur, siap cor pondasi & dak',
        minOrder: '1 Truk',
      },
      {
        name: 'Batu Kali Pecah / Batu Belah Pondasi (1 Truk 4 m³)',
        category: 'Pasir & Batu',
        unit: 'Truk',
        price: 1600000,
        inStock: true,
        minOrder: '1 Truk',
      },
      {
        name: 'Split Cor / Batu Koral Beton Ukuran 1-2cm (1 Truk 4 m³)',
        category: 'Pasir & Batu',
        unit: 'Truk',
        price: 1850000,
        inStock: true,
        minOrder: '1 Truk',
      },
      {
        name: 'Besi Beton Ulir 13mm SNI Panjang 12m',
        category: 'Besi & Rangka',
        unit: 'Batang',
        price: 148000,
        inStock: true,
        promoText: 'Besi full standar SNI untuk cakar ayam & balok gantung',
      },
      {
        name: 'Kawat Bendrat Ikat Besi Beton (Roll 20 Kg)',
        category: 'Besi & Rangka',
        unit: 'Roll',
        price: 360000,
        inStock: true,
      },
    ],
  },
  {
    store: {
      id: 'store_depo_bangunan_bandung',
      name: 'Depo Bangunan Soekarno Hatta',
      slogan: 'Belanja Bahan Bangunan Nyaman, Lengkap, Murah & Mudah',
      category: 'Supermarket Bahan Bangunan',
      city: 'Bandung',
      address: 'Jl. Soekarno Hatta No. 493, Batununggal, Bandung, Jawa Barat',
      phone: '022-7318080',
      whatsapp: '6281321008899',
      openingHours: 'Setiap Hari: 08.00 - 20.00 WIB',
      rating: 4.9,
      reviewCount: 412,
      isVerified: true,
      promoText: 'Kusen Aluminium & Keramik Lantai 60x60 Granit Diskon s/d 15%',
      catalogCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    products: [
      {
        name: 'Granit Lantai Glazed Polish 60x60cm Motif Marmer (Dus isi 4)',
        category: 'Lantai & Keramik',
        unit: 'Dus',
        price: 195000,
        inStock: true,
        promoText: 'Anti gores grade AAA',
        minOrder: '5 Dus',
      },
      {
        name: 'Kusen Pintu Aluminium Alexindo 4 inch Hitam / Coklat (6m)',
        category: 'Kusen & Pintu',
        unit: 'Batang',
        price: 185000,
        inStock: true,
        promoText: 'Tahan rayap dan tahan cuaca',
      },
      {
        name: 'Kloset Duduk Toto Eco Washer Putih Komplit Set',
        category: 'Sanitari & Pipa',
        unit: 'Unit',
        price: 1850000,
        inStock: true,
        promoText: 'Garansi resmi Toto 5 tahun',
      },
      {
        name: 'Pipa PVC Rucika AW 3/4 inch Panjang 4m (Air Bersih)',
        category: 'Sanitari & Pipa',
        unit: 'Batang',
        price: 38000,
        inStock: true,
      },
      {
        name: 'Toren Tangki Air Penguin 1000 Liter Anti Lumut (TB 110)',
        category: 'Sanitari & Pipa',
        unit: 'Unit',
        price: 1720000,
        inStock: true,
        promoText: 'Gratis radar pelampung otomatis',
      },
    ],
  },
  {
    store: {
      id: 'store_baja_ringan_lestari_surabaya',
      name: 'CV Sinar Baja & Atap Modern',
      slogan: 'Pusat Baja Ringan Galvalum, Spandek & Genteng Metal Berkualitas',
      category: 'Baja Ringan, Atap & Plafon',
      city: 'Surabaya',
      address: 'Jl. Rungkut Industri III No. 18, Surabaya, Jawa Timur',
      phone: '031-8439120',
      whatsapp: '6282245678901',
      openingHours: 'Senin - Sabtu: 08.00 - 17.00 WIB',
      rating: 4.8,
      reviewCount: 156,
      isVerified: true,
      promoText: 'Paket Rangka Atap Baja Ringan C75 + Reng + Baut Diskon Spesial',
      catalogCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    products: [
      {
        name: 'Kanal C Baja Ringan C75 Ketebalan 0.75mm Full SNI (6 Meter)',
        category: 'Besi & Rangka',
        unit: 'Batang',
        price: 94000,
        inStock: true,
        promoText: 'Anti karat galvalum prima',
        minOrder: '10 Batang',
      },
      {
        name: 'Reng Baja Ringan R30 Ketebalan 0.45mm (6 Meter)',
        category: 'Besi & Rangka',
        unit: 'Batang',
        price: 43000,
        inStock: true,
      },
      {
        name: 'Genteng Metal Pasir Minimalis Ukuran 2x4 Daun (80x80cm)',
        category: 'Atap & Plafon',
        unit: 'Lembar',
        price: 39000,
        inStock: true,
        promoText: 'Pilihan warna: Hitam, Merah Maroon, Coklat',
      },
      {
        name: 'Papan Gypsum Jayaboard Standard 9mm (1.2m x 2.4m)',
        category: 'Atap & Plafon',
        unit: 'Lembar',
        price: 76000,
        inStock: true,
      },
      {
        name: 'Sekrup Roofing Baut Baja Ringan 10x19 (Dus isi 1000 pcs)',
        category: 'Besi & Rangka',
        unit: 'Dus',
        price: 125000,
        inStock: true,
      },
    ],
  },
];

/**
 * Check if the shared stores collection is empty and seed if needed
 */
export async function seedSharedStoresIfEmpty(): Promise<SharedStore[]> {
  const storesPath = 'shared_stores';
  try {
    const snap = await getDocs(collection(firestoreDb, storesPath));
    if (!snap.empty) {
      const stores: SharedStore[] = [];
      snap.forEach((d) => stores.push(d.data() as SharedStore));
      return stores;
    }

    // Seed default stores to Firestore
    const batch = writeBatch(firestoreDb);
    const seededStores: SharedStore[] = [];

    for (const item of DEFAULT_INDONESIAN_STORES) {
      const storeRef = doc(firestoreDb, storesPath, item.store.id);
      batch.set(storeRef, item.store);
      seededStores.push(item.store);

      for (let i = 0; i < item.products.length; i++) {
        const prod = item.products[i];
        const prodId = `prod_${item.store.id}_${i + 1}`;
        const prodRef = doc(firestoreDb, `${storesPath}/${item.store.id}/products`, prodId);
        const prodData: StoreProduct = {
          ...prod,
          id: prodId,
          storeId: item.store.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        batch.set(prodRef, prodData);
      }
    }

    await batch.commit();
    return seededStores;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, storesPath);
    // Return in-memory fallback so user interface always renders nicely
    return DEFAULT_INDONESIAN_STORES.map((s) => s.store);
  }
}

/**
 * Real-time subscription to shared stores list (visible to all devices everywhere)
 */
export function subscribeToSharedStores(
  onUpdate: (stores: SharedStore[]) => void,
  onError?: (err: any) => void
): () => void {
  const storesPath = 'shared_stores';
  try {
    const q = query(collection(firestoreDb, storesPath));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, initiate background seed
          seedSharedStoresIfEmpty().then((res) => onUpdate(res));
          return;
        }
        const stores: SharedStore[] = [];
        snapshot.forEach((docSnap) => {
          stores.push(docSnap.data() as SharedStore);
        });
        // Sort by rating desc
        stores.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        onUpdate(stores);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, storesPath);
        // Fallback to default Indonesian stores if offline or network blocked
        onUpdate(DEFAULT_INDONESIAN_STORES.map((s) => s.store));
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, storesPath);
    onUpdate(DEFAULT_INDONESIAN_STORES.map((s) => s.store));
    return () => {};
  }
}

/**
 * Fetch products for a specific store
 */
export async function fetchStoreProducts(storeId: string): Promise<StoreProduct[]> {
  const prodPath = `shared_stores/${storeId}/products`;
  try {
    const snap = await getDocs(collection(firestoreDb, prodPath));
    if (!snap.empty) {
      const products: StoreProduct[] = [];
      snap.forEach((d) => products.push(d.data() as StoreProduct));
      return products;
    }

    // Check if store matches a default template
    const def = DEFAULT_INDONESIAN_STORES.find((s) => s.store.id === storeId);
    if (def) {
      return def.products.map((p, i) => ({
        ...p,
        id: `prod_${storeId}_${i + 1}`,
        storeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
    return [];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, prodPath);
    const def = DEFAULT_INDONESIAN_STORES.find((s) => s.store.id === storeId);
    return def
      ? def.products.map((p, i) => ({
          ...p,
          id: `prod_${storeId}_${i + 1}`,
          storeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      : [];
  }
}

// ================= ADMIN MUTATIONS ================= //

/**
 * Add a new store to shared directory (Admin operation)
 */
export async function addSharedStore(store: Omit<SharedStore, 'id' | 'createdAt' | 'updatedAt'>): Promise<SharedStore> {
  const storeId = `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const fullStore: SharedStore = {
    ...store,
    id: storeId,
    createdAt: now,
    updatedAt: now,
  };

  const path = `shared_stores/${storeId}`;
  try {
    await setDoc(doc(firestoreDb, 'shared_stores', storeId), fullStore);
    return fullStore;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Update an existing store (Admin operation)
 */
export async function updateSharedStore(storeId: string, updates: Partial<SharedStore>): Promise<void> {
  const path = `shared_stores/${storeId}`;
  try {
    const storeRef = doc(firestoreDb, 'shared_stores', storeId);
    await setDoc(storeRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

/**
 * Delete a store from shared directory (Admin operation)
 */
export async function deleteSharedStore(storeId: string): Promise<void> {
  const path = `shared_stores/${storeId}`;
  try {
    await deleteDoc(doc(firestoreDb, 'shared_stores', storeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

/**
 * Add product to store catalog (Admin operation)
 */
export async function addStoreProduct(
  storeId: string,
  product: Omit<StoreProduct, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>
): Promise<StoreProduct> {
  const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const fullProduct: StoreProduct = {
    ...product,
    id: prodId,
    storeId,
    createdAt: now,
    updatedAt: now,
  };

  const path = `shared_stores/${storeId}/products/${prodId}`;
  try {
    await setDoc(doc(firestoreDb, `shared_stores/${storeId}/products`, prodId), fullProduct);
    return fullProduct;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Delete product from store catalog (Admin operation)
 */
export async function deleteStoreProduct(storeId: string, productId: string): Promise<void> {
  const path = `shared_stores/${storeId}/products/${productId}`;
  try {
    await deleteDoc(doc(firestoreDb, `shared_stores/${storeId}/products`, productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}
