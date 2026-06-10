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

      saveForUser: (userId) => {
        if (!userId) return;
        const { items } = get();
        localStorage.setItem(`favorites-storage-${userId}`, JSON.stringify(items));
      },

      loadForUser: (userId) => {
        if (!userId) return;
        try {
          const saved = localStorage.getItem(`favorites-storage-${userId}`);
          const currentItems = get().items || [];
          
          if (saved) {
            const savedItems = JSON.parse(saved);
            
            // Merge current guest items into saved user items
            const mergedItems = [...savedItems];
            
            currentItems.forEach((guestItem) => {
              const exists = mergedItems.some((i) => i.id === guestItem.id);
              if (!exists) {
                mergedItems.push(guestItem);
              }
            });
            
            set({ items: mergedItems });
          } else if (currentItems.length > 0) {
            // Keep guest favorites if user has no saved favorites
            set({ items: currentItems });
          } else {
            set({ items: [] });
          }
        } catch {
          // Keep current items if parsing fails
          const currentItems = get().items || [];
          set({ items: currentItems });
        }
      },
    }),
    {
      name: 'favorites-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
