import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStorefrontAuthStore = create(
  persist(
    (set) => ({
      customer: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (customer, accessToken, refreshToken) =>
        set({ customer, accessToken, refreshToken }),

      logout: () =>
        set({ customer: null, accessToken: null, refreshToken: null }),
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
