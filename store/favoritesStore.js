import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      items: [],
      // Each item: { id, name, slug, price, thumbnail, category_name }

      addItem: (item) => {
        const items = get().items;
        const exists = items.some((i) => i.id === item.id);
        if (!exists) {
          set({ items: [...items, item] });
          return true;
        }
        return false;
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((i) => i.id !== productId),
        });
      },

      toggleItem: (item) => {
        const items = get().items;
        const exists = items.some((i) => i.id === item.id);
        if (exists) {
          set({ items: items.filter((i) => i.id !== item.id) });
          return false; // removed
        } else {
          set({ items: [...items, item] });
          return true; // added
        }
      },

      isFavorite: (productId) => {
        return get().items.some((i) => i.id === productId);
      },

      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: 'favorites-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
