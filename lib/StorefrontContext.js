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
