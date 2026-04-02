import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      // Each item: { product, variant, quantity, unitPrice, name, variantLabel, thumbnail, slug }

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.product === item.product && i.variant === item.variant
        );
        if (existingIndex >= 0) {
          const updated = [...items];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + item.quantity,
          };
          set({ items: updated });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (product, variant) => {
        set({
          items: get().items.filter(
            (i) => !(i.product === product && i.variant === variant)
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
            i.product === product && i.variant === variant
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
