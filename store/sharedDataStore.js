/**
 * Shared data store for categories and products.
 * Pages that need these lists read from cache first (60s TTL).
 * Any mutation (create/update/delete) calls invalidate() to force a fresh fetch.
 */
import { create } from 'zustand';
import { categoryAPI, productAPI } from '@/lib/api';
import { useStoreStore } from '@/store/storeStore';

const TTL = 60_000; // 60 seconds

function isStale(fetchedAt) {
  return !fetchedAt || Date.now() - fetchedAt > TTL;
}

export const useSharedDataStore = create((set, get) => ({
  lastStoreId: null,

  categories: [],
  categoriesFetchedAt: null,
  categoriesLoading: false,

  products: [],
  productsFetchedAt: null,
  productsLoading: false,

  // ── Categories ──────────────────────────────────────────────────
  fetchCategories: async (force = false) => {
    const currentStoreId = useStoreStore.getState().activeStore?.id;
    const { categoriesFetchedAt, categoriesLoading, lastStoreId } = get();
    
    const storeChanged = currentStoreId !== lastStoreId;

    if (!force && !storeChanged && !isStale(categoriesFetchedAt)) return get().categories;
    if (categoriesLoading && !storeChanged) return get().categories;

    set({ categoriesLoading: true });
    try {
      const res = await categoryAPI.list({ perPage: 100 });
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      set({ 
        categories: data, 
        categoriesFetchedAt: Date.now(), 
        categoriesLoading: false,
        lastStoreId: currentStoreId
      });
      return data;
    } catch {
      set({ categoriesLoading: false });
      return get().categories;
    }
  },

  invalidateCategories: () => set({ categoriesFetchedAt: null }),

  // ── Products ────────────────────────────────────────────────────
  fetchProducts: async (force = false) => {
    const currentStoreId = useStoreStore.getState().activeStore?.id;
    const { productsFetchedAt, productsLoading, lastStoreId } = get();
    
    const storeChanged = currentStoreId !== lastStoreId;

    if (!force && !storeChanged && !isStale(productsFetchedAt)) return get().products;
    if (productsLoading && !storeChanged) return get().products;

    set({ productsLoading: true });
    try {
      const res = await productAPI.list();
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      set({ 
        products: data, 
        productsFetchedAt: Date.now(), 
        productsLoading: false,
        lastStoreId: currentStoreId
      });
      return data;
    } catch {
      set({ productsLoading: false });
      return get().products;
    }
  },

  invalidateProducts: () => set({ productsFetchedAt: null }),
}));
