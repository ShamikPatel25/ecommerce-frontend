import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCartStore } from './cartStore';

export const useStorefrontAuthStore = create(
  persist(
    (set, get) => ({
      customer: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (customer, accessToken, refreshToken) => {
        set({ customer, accessToken, refreshToken });
        if (customer?.id) {
          useCartStore.getState().loadForUser(customer.id);
        }
      },

      setCustomer: (customer) => set({ customer }),

      logout: () => {
        const { customer } = get();
        if (customer?.id) {
          useCartStore.getState().saveForUser(customer.id);
        }
        // Only clear auth state — don't clear the cart on logout
        // Cart is preserved so users can continue shopping after re-login
        set({ customer: null, accessToken: null, refreshToken: null });
      },

      // Full logout with cart clear (for explicit user-initiated logout)
      fullLogout: () => {
        const { customer } = get();
        if (customer?.id) {
          useCartStore.getState().saveForUser(customer.id);
        }
        useCartStore.getState().clearCart();
        set({ customer: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'storefront-auth',
      partialize: (state) => ({
        customer: state.customer,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),

      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (merged.customer && !merged.accessToken) {
          merged.customer = null;
          merged.refreshToken = null;
        }
        return merged;
      },
    }
  )
);
