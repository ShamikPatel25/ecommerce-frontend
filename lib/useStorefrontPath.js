'use client';

import { useCallback } from 'react';
import { useIsSubdomain } from './StorefrontContext';

/**
 * Returns the correct link prefix for storefront pages.
 *
 * `isSubdomain` is provided via StorefrontContext, which is set from the
 * server-side layout reading the `x-is-subdomain` request header set by
 * the middleware. This ensures SSR and client render produce identical
 * output — no hydration mismatch.
 *
 * On a subdomain (nike.localhost:3000/products), no prefix is needed.
 * On direct access (localhost:3000/storefront/products), /storefront prefix is kept.
 */
export function useStorefrontPath() {
  const isSubdomain = useIsSubdomain();

  const prefix = isSubdomain ? '' : '/storefront';

  const href = useCallback((path) => `${prefix}${path}`, [prefix]);

  return { prefix, href };
}
