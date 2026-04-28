import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,

      setAuth: (user, tokens) => {
        set({ user, token: tokens.access });
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
        }
      },

      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 2,
      migrate: (state) => state,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Sync token back to localStorage keys that Axios reads
            if (state.token && typeof window !== 'undefined') {
              const existing = localStorage.getItem('access_token');
              if (!existing) {
                localStorage.setItem('access_token', state.token);
              }
            }
            // If no token exists anywhere, clear the user too
            if (typeof window !== 'undefined') {
              const hasToken = state.token || localStorage.getItem('access_token');
              if (!hasToken) {
                state.user = null;
                state.token = null;
              }
            }
            state._hasHydrated = true;
          }
        };
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
