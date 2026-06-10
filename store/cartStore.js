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
          if (newMaxStock != null && newQty > newMaxStock) {
            newQty = newMaxStock;
          }
          if (newQty > 20) newQty = 20;
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
            // Cap at maxStock if known and absolute max of 20
            let capped = (i.maxStock != null && quantity > i.maxStock) ? i.maxStock : quantity;
            if (capped > 20) capped = 20;
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
          const currentItems = get().items || [];
          
          if (saved) {
            const savedItems = JSON.parse(saved);
            
            // Merge current guest items into saved user items
            const mergedItems = [...savedItems];
            
            currentItems.forEach((guestItem) => {
              const existingIndex = mergedItems.findIndex(
                (i) => (i.product || i.id) === (guestItem.product || guestItem.id) && i.variant === guestItem.variant
              );
              
              if (existingIndex >= 0) {
                // Item exists, sum quantities
                const existing = mergedItems[existingIndex];
                const newMaxStock = guestItem.maxStock ?? existing.maxStock;
                let newQty = existing.quantity + guestItem.quantity;
                if (newMaxStock != null && newQty > newMaxStock) {
                  newQty = newMaxStock;
                }
                if (newQty > 20) newQty = 20;
                mergedItems[existingIndex] = {
                  ...existing,
                  quantity: newQty,
                  maxStock: newMaxStock,
                };
              } else {
                // New item from guest session
                mergedItems.push(guestItem);
              }
            });
            
            set({ items: mergedItems });
          } else if (currentItems.length > 0) {
            // User had no saved cart, but has guest cart, just keep the guest cart
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
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
