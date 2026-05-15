import { create } from 'zustand';

const CACHE_TTL_MS = 60_000; // 60 seconds

export const useDashboardStore = create((set, get) => ({
  // Keyed by storeId so switching stores always fetches fresh data
  cache: {},

  setCache: (storeId, data) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [storeId]: { data, fetchedAt: Date.now() },
      },
    })),

  getCache: (storeId) => {
    const entry = get().cache[storeId];
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null; // stale
    return entry.data;
  },

  invalidate: (storeId) =>
    set((state) => {
      const next = { ...state.cache };
      if (storeId) delete next[storeId];
      else return { cache: {} }; // invalidate all
      return { cache: next };
    }),
}));
