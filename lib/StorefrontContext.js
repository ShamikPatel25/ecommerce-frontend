'use client';

import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const StorefrontContext = createContext({ isSubdomain: false });

export function StorefrontProviderWrapper({ isSubdomain, children }) {
  return (
    <StorefrontContext.Provider value={{ isSubdomain }}>
      {children}
    </StorefrontContext.Provider>
  );
}

StorefrontProviderWrapper.propTypes = {
  isSubdomain: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

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

StoreInfoProvider.propTypes = {
  store: PropTypes.object,
  children: PropTypes.node.isRequired,
};

/** Returns the store object fetched by StorefrontClientLayout (or null while loading). */
export function useStoreInfo() {
  return useContext(StoreInfoContext);
}
