import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStoreStore = create(
  persist(
    (set) => ({
      activeStore: null,   // { id, name, subdomain, ... }
      stores: [],          // all user's stores

      setActiveStore: (store) => set({ activeStore: store }),
      setStores: (stores) => set({ stores }),
    }),
    {
      name: 'store-selection',
      version: 2,
      migrate: (state) => state,
      partialize: (state) => ({
        activeStore: state.activeStore,
      }),
    }
  )
);
