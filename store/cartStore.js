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
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + item.quantity,
            maxStock: item.maxStock ?? updated[existingIndex].maxStock,
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
          items: get().items.map((i) =>
            (i.product || i.id) === product && i.variant === variant
              ? { ...i, quantity }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
