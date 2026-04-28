'use client';

import { createContext, useContext } from 'react';

const StorefrontContext = createContext({ isSubdomain: false });

export function StorefrontProviderWrapper({ isSubdomain, children }) {
  return (
    <StorefrontContext.Provider value={{ isSubdomain }}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useIsSubdomain() {
  return useContext(StorefrontContext).isSubdomain;
}

/* ── Store-info context (currency, name, etc.) ── */
const StoreInfoContext = createContext(null);

export function StoreInfoProvider({ store, children }) {
  return (
    <StoreInfoContext.Provider value={store}>
      {children}
    </StoreInfoContext.Provider>
  );
}

/** Returns the store object fetched by StorefrontClientLayout (or null while loading). */
export function useStoreInfo() {
  return useContext(StoreInfoContext);
}
