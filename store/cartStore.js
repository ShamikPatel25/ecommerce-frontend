import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      // Each item: { product, variant, quantity, unitPrice, name, variantLabel, thumbnail, slug, maxStock }

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => (i.product || i.id) === (item.product || item.id) && i.variant === item.variant
        );
        if (existingIndex >= 0) {
          const updated = [...items];
          const existing = updated[existingIndex];
          const newMaxStock = item.maxStock ?? existing.maxStock;
          let newQty = existing.quantity + item.quantity;
          // Cap at maxStock if known
          if (newMaxStock != null && newQty > newMaxStock) {
            newQty = newMaxStock;
          }
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            maxStock: newMaxStock,
          };
          set({ items: updated });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeOutOfStock: () => {
        set({ items: get().items.filter((i) => (i.maxStock ?? 1) > 0) });
      },

      // Update live stock for a single item (called after API validation)
      updateItemStock: (product, variant, maxStock) => {
        set({
          items: get().items.map((i) =>
            (i.product || i.id) === product && i.variant === variant
              ? { ...i, maxStock }
              : i
          ),
        });
      },

      removeItem: (product, variant) => {
        set({
          items: get().items.filter(
            (i) => !((i.product || i.id) === product && i.variant === variant)
          ),
        });
      },

      updateQuantity: (product, variant, quantity) => {
        if (quantity <= 0) {
          get().removeItem(product, variant);
          return;
        }
        set({
          items: get().items.map((i) => {
            if (!((i.product || i.id) === product && i.variant === variant)) return i;
            // Cap at maxStock if known
            const capped = (i.maxStock != null && quantity > i.maxStock) ? i.maxStock : quantity;
            return { ...i, quantity: capped };
          }),
        });
      },

      clearCart: () => set({ items: [] }),

      saveForUser: (userId) => {
        if (!userId) return;
        const { items } = get();
        localStorage.setItem(`cart-storage-${userId}`, JSON.stringify(items));
      },

      loadForUser: (userId) => {
        if (!userId) return;
        try {
          const saved = localStorage.getItem(`cart-storage-${userId}`);
          if (saved) {
            set({ items: JSON.parse(saved) });
          } else {
            set({ items: [] });
          }
        } catch {
          set({ items: [] });
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
